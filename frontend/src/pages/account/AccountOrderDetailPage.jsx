import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiX } from 'react-icons/fi'
import { getAccountOrder }    from '../../services/account'
import { cancelOrder }        from '../../services/orders'
import { useMeta }            from '../../hooks/useMeta'

const STATUS_CONFIG = {
  PENDING:    { label: 'En attente',     cls: 'bg-yellow-900/40 text-yellow-400', step: 0 },
  CONFIRMED:  { label: 'Confirmée',      cls: 'bg-blue-900/40   text-blue-400',   step: 1 },
  PROCESSING: { label: 'En préparation', cls: 'bg-purple-900/40 text-purple-400', step: 2 },
  SHIPPED:    { label: 'Expédiée',       cls: 'bg-indigo-900/40 text-indigo-400', step: 3 },
  DELIVERED:  { label: 'Livrée',         cls: 'bg-green-900/40  text-green-400',  step: 4 },
  CANCELLED:  { label: 'Annulée',        cls: 'bg-red-900/40    text-red-400',    step: -1 },
  REFUNDED:   { label: 'Remboursée',     cls: 'bg-orange-900/40 text-orange-400', step: -1 },
}

const STEPS = ['En attente', 'Confirmée', 'En préparation', 'Expédiée', 'Livrée']

function AccountOrderDetailPage() {
  const { id } = useParams()
  useMeta({ title: `Commande #${id}` })

  const [order,    setOrder]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    setLoading(true)
    getAccountOrder(id)
      .then(({ data }) => setOrder(data))
      .catch((err) => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    if (!window.confirm('Annuler cette commande ?')) return
    setCancelling(true)
    try {
      await cancelOrder(id)
      setOrder((o) => ({ ...o, status: 'CANCELLED' }))
      toast.success('Commande annulée.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Impossible d\'annuler.')
    } finally {
      setCancelling(false)
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

  const cfg       = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
  const activeStep = cfg.step
  const itemCount  = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0
  const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED'

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
            {' · '}{itemCount} article{itemCount !== 1 ? 's' : ''}
          </p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
      </div>

      {/* Barre de progression */}
      {!isCancelled && (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5 mb-4">
          <div className="flex items-start justify-between gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition ${
                  i < activeStep  ? 'bg-[#D4AF37] text-black'
                  : i === activeStep ? 'bg-[#D4AF37]/20 border-2 border-[#D4AF37] text-[#D4AF37]'
                  : 'bg-[#2a2a3a] text-gray-600'
                }`}>
                  {i < activeStep ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`hidden sm:block absolute`} />
                )}
                <span className={`text-center leading-tight hidden sm:block text-xs ${
                  i <= activeStep ? 'text-white' : 'text-gray-600'
                }`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Articles */}
      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-[#2a2a3a] text-xs text-gray-500 uppercase tracking-wide">
          Articles
        </div>
        {order.items?.map((item) => (
          <div key={item.id} className="flex items-center gap-4 px-4 py-4 border-b border-[#2a2a3a] last:border-0">
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
              {Number(item.subtotal ?? item.unit_price * item.quantity).toLocaleString('fr-SN')} FCFA
            </p>
          </div>
        ))}
        <div className="px-4 py-3 flex justify-between">
          <span className="text-gray-400 text-sm">Total</span>
          <span className="text-[#D4AF37] font-bold">{Number(order.total).toLocaleString('fr-SN')} FCFA</span>
        </div>
      </div>

      {/* Livraison */}
      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Adresse de livraison</p>
        <p className="text-white text-sm whitespace-pre-line">{order.delivery_address}</p>
        {order.notes && <p className="text-gray-500 text-xs mt-2 italic">{order.notes}</p>}
      </div>

      {/* Bouton annulation */}
      {order.status === 'PENDING' && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-red-500/40 text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
        >
          <FiX size={14} />
          {cancelling ? 'Annulation...' : 'Annuler la commande'}
        </button>
      )}
    </div>
  )
}

export default AccountOrderDetailPage
