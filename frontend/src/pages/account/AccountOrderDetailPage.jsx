import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiX, FiPackage, FiStar } from 'react-icons/fi'
import { getAccountOrder } from '../../services/account'
import { cancelOrder }     from '../../services/orders'
import { createReview }    from '../../services/reviews'
import { createDispute }   from '../../services/disputes'
import { useMeta }         from '../../hooks/useMeta'

const VENDOR_STATUS = {
  PENDING:    { label: 'En attente',     cls: 'bg-yellow-900/40 text-yellow-400', step: 0 },
  CONFIRMED:  { label: 'Confirmée',      cls: 'bg-blue-900/40   text-blue-400',   step: 1 },
  PROCESSING: { label: 'En préparation', cls: 'bg-purple-900/40 text-purple-400', step: 2 },
  SHIPPED:    { label: 'Expédiée',       cls: 'bg-indigo-900/40 text-indigo-400', step: 3 },
  DELIVERED:  { label: 'Livrée',         cls: 'bg-green-900/40  text-green-400',  step: 4 },
  CANCELLED:  { label: 'Annulée',        cls: 'bg-red-900/40    text-red-400',    step: -1 },
  REFUNDED:   { label: 'Remboursée',     cls: 'bg-orange-900/40 text-orange-400', step: -1 },
}

const STEPS = ['En attente', 'Confirmée', 'En préparation', 'Expédiée', 'Livrée']

function ProgressBar({ status }) {
  const cfg = VENDOR_STATUS[status]
  if (!cfg || cfg.step < 0) return null
  const activeStep = cfg.step
  return (
    <div className="flex items-center justify-between gap-1 py-3">
      {STEPS.map((s, i) => (
        <div key={s} className="flex flex-col items-center flex-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition ${
            i < activeStep  ? 'bg-[#D4AF37] text-black'
            : i === activeStep ? 'bg-[#D4AF37]/20 border-2 border-[#D4AF37] text-[#D4AF37]'
            : 'bg-[#2a2a3a] text-gray-600'
          }`}>
            {i < activeStep ? '✓' : i + 1}
          </div>
          <span className={`text-center leading-tight hidden sm:block text-xs ${
            i <= activeStep ? 'text-white' : 'text-gray-600'
          }`}>{s}</span>
        </div>
      ))}
    </div>
  )
}

function AccountOrderDetailPage() {
  const { id } = useParams()
  useMeta({ title: `Commande #${id}` })

  const [order,      setOrder]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [notFound,   setNotFound]   = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [reviewForms, setReviewForms] = useState({})
  const [reviewed, setReviewed] = useState({})
  const [disputeForms, setDisputeForms] = useState({})
  const [disputed, setDisputed] = useState({})

  useEffect(() => {
    setLoading(true)
    getAccountOrder(id)
      .then(({ data }) => setOrder(data))
      .catch((err) => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    setCancelling(true)
    setShowCancelConfirm(false)
    try {
      await cancelOrder(id)
      setOrder((o) => ({
        ...o,
        status: 'CANCELLED',
        vendor_orders: o.vendor_orders.map((vo) =>
          ['PENDING', 'CONFIRMED'].includes(vo.status) ? { ...vo, status: 'CANCELLED' } : vo
        ),
      }))
      toast.success('Commande annulée.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Impossible d\'annuler.')
    } finally {
      setCancelling(false)
    }
  }

  const updateReviewForm = (itemId, patch) => {
    setReviewForms((forms) => ({
      ...forms,
      [itemId]: { rating: 5, comment: '', ...(forms[itemId] || {}), ...patch },
    }))
  }

  const handleReview = async (vendorOrder, item) => {
    const form = reviewForms[item.id] || { rating: 5, comment: '' }
    try {
      await createReview({
        vendor_order_id: vendorOrder.id,
        product_id: item.product,
        rating: form.rating,
        comment: form.comment,
      })
      setReviewed((state) => ({ ...state, [item.id]: true }))
      toast.success('Avis publie.')
    } catch (err) {
      toast.error(err.response?.data?.product_id?.[0] || err.response?.data?.vendor_order_id?.[0] || 'Impossible de publier cet avis.')
    }
  }

  const updateDisputeForm = (vendorOrderId, patch) => {
    setDisputeForms((forms) => ({
      ...forms,
      [vendorOrderId]: { reason: 'ITEM_NOT_RECEIVED', description: '', ...(forms[vendorOrderId] || {}), ...patch },
    }))
  }

  const handleDispute = async (vendorOrder) => {
    const form = disputeForms[vendorOrder.id] || { reason: 'ITEM_NOT_RECEIVED', description: '' }
    try {
      await createDispute({
        vendor_order_id: vendorOrder.id,
        reason: form.reason,
        description: form.description,
      })
      setDisputed((state) => ({ ...state, [vendorOrder.id]: true }))
      toast.success('Litige ouvert.')
    } catch (err) {
      toast.error(err.response?.data?.vendor_order_id?.[0] || err.response?.data?.error || 'Impossible d ouvrir ce litige.')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
        <div className="h-40 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-3">Commande introuvable.</p>
        <Link to="/account/orders" className="text-[#D4AF37] hover:underline text-sm">← Retour aux commandes</Link>
      </div>
    )
  }

  const vendorOrders = order.vendor_orders ?? []
  const canCancel    = order.status === 'PENDING'

  return (
    <div>
      <Link to="/account/orders" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition">
        <FiArrowLeft size={14} /> Retour aux commandes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Commande #{order.id}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}{order.item_count} article{order.item_count !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="text-[#D4AF37] font-bold text-lg">{Number(order.total).toLocaleString('fr-SN')} FCFA</span>
      </div>

      {/* Une section par vendeur */}
      {vendorOrders.map((vo) => {
        const cfg = VENDOR_STATUS[vo.status] || VENDOR_STATUS.PENDING
        return (
          <div key={vo.id} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden mb-4">
            {/* Vendeur header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a3a]">
              <div className="flex items-center gap-2">
                <FiPackage size={14} className="text-[#D4AF37]" />
                <Link to={`/vendors/${vo.vendor_slug}`} className="text-sm font-semibold text-white hover:text-[#D4AF37] transition">
                  {vo.vendor_name}
                </Link>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${cfg.cls}`}>{cfg.label}</span>
            </div>

            {/* Progression */}
            {cfg.step >= 0 && (
              <div className="px-4 border-b border-[#2a2a3a]">
                <ProgressBar status={vo.status} />
              </div>
            )}

            {['SHIPPED', 'DELIVERED'].includes(vo.status) && !disputed[vo.id] && (
              <div className="px-4 py-3 border-b border-[#2a2a3a] bg-[#0B0B0F]">
                <div className="grid md:grid-cols-4 gap-2">
                  <select
                    value={disputeForms[vo.id]?.reason || 'ITEM_NOT_RECEIVED'}
                    onChange={(event) => updateDisputeForm(vo.id, { reason: event.target.value })}
                    className="bg-[#16161E] border border-[#2a2a3a] rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="ITEM_NOT_RECEIVED">Non recu</option>
                    <option value="DAMAGED">Article abime</option>
                    <option value="WRONG_ITEM">Mauvais article</option>
                    <option value="OTHER">Autre</option>
                  </select>
                  <input
                    value={disputeForms[vo.id]?.description || ''}
                    onChange={(event) => updateDisputeForm(vo.id, { description: event.target.value })}
                    placeholder="Details du litige"
                    className="md:col-span-2 bg-[#16161E] border border-[#2a2a3a] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleDispute(vo)}
                    className="px-3 py-2 rounded-lg border border-red-500/40 text-red-400 text-xs hover:bg-red-500/10"
                  >
                    Ouvrir un litige
                  </button>
                </div>
              </div>
            )}

            {/* Articles */}
            {vo.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-4 py-4 border-b border-[#2a2a3a] last:border-0 flex-wrap">
                <div className="w-12 h-12 rounded-lg bg-[#2a2a3a] flex-shrink-0 overflow-hidden">
                  {item.cover_image
                    ? <img src={item.cover_image} alt={item.product_name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-700">📦</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium line-clamp-1">{item.product_name}</p>
                  {item.variant_label && <p className="text-gray-500 text-xs">{item.variant_label}</p>}
                  <p className="text-gray-500 text-xs">
                    {Number(item.unit_price).toLocaleString('fr-SN')} FCFA × {item.quantity}
                  </p>
                </div>
                <p className="text-white text-sm font-medium whitespace-nowrap">
                  {Number(item.subtotal).toLocaleString('fr-SN')} FCFA
                </p>
                {vo.status === 'DELIVERED' && item.product && !reviewed[item.id] && (
                  <div className="w-full sm:w-80 bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg p-3">
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const value = reviewForms[item.id]?.rating || 5
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => updateReviewForm(item.id, { rating: index + 1 })}
                            className="text-[#D4AF37]"
                            aria-label={`${index + 1} etoile`}
                          >
                            <FiStar size={16} fill={index < value ? 'currentColor' : 'none'} />
                          </button>
                        )
                      })}
                    </div>
                    <textarea
                      value={reviewForms[item.id]?.comment || ''}
                      onChange={(event) => updateReviewForm(item.id, { comment: event.target.value })}
                      placeholder="Votre avis"
                      rows={2}
                      className="w-full bg-[#16161E] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      type="button"
                      onClick={() => handleReview(vo, item)}
                      className="mt-2 px-3 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold"
                    >
                      Publier
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Sous-total */}
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">Sous-total</span>
              <span className="text-white font-medium">{Number(vo.subtotal).toLocaleString('fr-SN')} FCFA</span>
            </div>
          </div>
        )
      })}

      {/* Adresse */}
      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Adresse de livraison</p>
        <p className="text-white text-sm whitespace-pre-line">{order.delivery_address}</p>
        {order.notes && <p className="text-gray-500 text-xs mt-2 italic">{order.notes}</p>}
      </div>

      {/* Bouton annulation */}
      {canCancel && !showCancelConfirm && (
        <button
          onClick={() => setShowCancelConfirm(true)}
          disabled={cancelling}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-red-500/40 text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
        >
          <FiX size={14} />
          Annuler la commande
        </button>
      )}

      {canCancel && showCancelConfirm && (
        <div className="bg-red-900/15 border border-red-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <p className="text-sm text-red-300 flex-1">
            Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-[#2a2a3a] hover:border-gray-500 transition"
            >
              Garder
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
            >
              <FiX size={14} />
              {cancelling ? 'Annulation...' : 'Confirmer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountOrderDetailPage
