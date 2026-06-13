import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiX } from 'react-icons/fi'
import { getMyOrder, cancelOrder } from '../../services/orders'
import { useMeta } from '../../hooks/useMeta'

const STATUS_CONFIG = {
  PENDING:    { label: 'En attente',     cls: 'bg-yellow-900/40 text-yellow-400', step: 0 },
  CONFIRMED:  { label: 'Confirmée',      cls: 'bg-blue-900/40  text-blue-400',    step: 1 },
  PROCESSING: { label: 'En préparation', cls: 'bg-purple-900/40 text-purple-400', step: 2 },
  SHIPPED:    { label: 'Expédiée',       cls: 'bg-indigo-900/40 text-indigo-400', step: 3 },
  DELIVERED:  { label: 'Livrée',         cls: 'bg-green-900/40 text-green-400',   step: 4 },
  CANCELLED:  { label: 'Annulée',        cls: 'bg-red-900/40   text-red-400',     step: -1 },
  REFUNDED:   { label: 'Remboursée',     cls: 'bg-orange-900/40 text-orange-400', step: -1 },
}

const STEPS = ['En attente', 'Confirmée', 'En préparation', 'Expédiée', 'Livrée']

function OrderDetailPage() {
  const { id }            = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useMeta({ title: order ? `Commande #${order.id}` : 'Commande' })

  const load = () => {
    setLoading(true)
    getMyOrder(id)
      .then(({ data }) => setOrder(data))
      .catch((err) => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleCancel = async () => {
    if (!window.confirm('Annuler cette commande ?')) return
    setCancelling(true)
    try {
      await cancelOrder(id)
      toast.success('Commande annulée.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Impossible d\'annuler.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="h-64 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-gray-500 mb-4">Commande introuvable.</p>
        <Link to="/orders" className="text-[#D4AF37] hover:underline text-sm">← Mes commandes</Link>
      </div>
    )
  }

  const cfg       = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
  const currentStep = cfg.step
  const isCancelled = ['CANCELLED', 'REFUNDED'].includes(order.status)
  const itemCount   = order.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition">
        <FiArrowLeft size={14} /> Mes commandes
      </Link>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Commande #{order.id}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            <Link to={`/vendors/${order.vendor_slug}`} className="text-[#D4AF37] hover:underline">
              {order.vendor_name}
            </Link>
          </p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
      </div>

      {/* Progress */}
      {!isCancelled && (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-[#2a2a3a] -z-0" />
            <div
              className="absolute top-3.5 left-0 h-0.5 bg-[#D4AF37] -z-0 transition-all duration-500"
              style={{ width: `${Math.max(0, (currentStep / (STEPS.length - 1)) * 100)}%` }}
            />
            {STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-1.5 z-10">
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition ${
                  i <= currentStep
                    ? 'border-[#D4AF37] bg-[#D4AF37] text-black'
                    : 'border-[#2a2a3a] bg-[#16161E] text-gray-600'
                }`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i <= currentStep ? 'text-gray-300' : 'text-gray-600'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-[#2a2a3a] text-sm text-gray-400">
          {itemCount} article{itemCount !== 1 ? 's' : ''}
        </div>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 px-4 py-4 border-b border-[#2a2a3a] last:border-0">
            <Link to={`/marketplace/${item.product_slug}`} className="flex-shrink-0">
              <div className="w-14 h-14 rounded-lg bg-[#2a2a3a] overflow-hidden">
                {item.cover_image ? (
                  <img src={item.cover_image} alt={item.product_name} className="product-image-contain p-1" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-700">📦</div>
                )}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/marketplace/${item.product_slug}`} className="text-white text-sm font-medium hover:text-[#D4AF37] transition line-clamp-1">
                {item.product_name}
              </Link>
              {item.variant_label && <p className="text-gray-500 text-xs mt-0.5">{item.variant_label}</p>}
              <p className="text-gray-500 text-xs">{Number(item.unit_price).toLocaleString('fr-SN')} FCFA × {item.quantity}</p>
            </div>
            <p className="text-white font-medium text-sm whitespace-nowrap">
              {Number(item.subtotal).toLocaleString('fr-SN')} FCFA
            </p>
          </div>
        ))}
        <div className="px-4 py-3 flex justify-between text-sm font-semibold">
          <span className="text-gray-400">Total commande</span>
          <span className="text-[#D4AF37] text-base">{Number(order.total).toLocaleString('fr-SN')} FCFA</span>
        </div>
      </div>

      {/* Delivery */}
      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-4 mb-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Adresse de livraison</p>
        <p className="text-white text-sm whitespace-pre-line">{order.delivery_address}</p>
        {order.notes && <p className="text-gray-500 text-xs mt-2 italic">{order.notes}</p>}
      </div>

      {/* Cancel */}
      {order.status === 'PENDING' && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition disabled:opacity-50"
        >
          <FiX size={14} /> {cancelling ? 'Annulation...' : 'Annuler cette commande'}
        </button>
      )}
    </div>
  )
}

export default OrderDetailPage
