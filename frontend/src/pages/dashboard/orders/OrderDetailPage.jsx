import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiCheck } from 'react-icons/fi'
import { getVendorOrder, updateOrderStatus } from '../../../services/orders'

const STATUS_CONFIG = {
  PENDING:    { label: 'En attente',     cls: 'bg-yellow-900/40 text-yellow-400' },
  CONFIRMED:  { label: 'Confirmée',      cls: 'bg-blue-900/40  text-blue-400'   },
  PROCESSING: { label: 'En préparation', cls: 'bg-purple-900/40 text-purple-400' },
  SHIPPED:    { label: 'Expédiée',       cls: 'bg-indigo-900/40 text-indigo-400' },
  DELIVERED:  { label: 'Livrée',         cls: 'bg-green-900/40 text-green-400'  },
  CANCELLED:  { label: 'Annulée',        cls: 'bg-red-900/40   text-red-400'    },
  REFUNDED:   { label: 'Remboursée',     cls: 'bg-orange-900/40 text-orange-400' },
}

const NEXT_ACTIONS = {
  PENDING:    [{ status: 'CONFIRMED',  label: 'Confirmer la commande', cls: 'bg-[#D4AF37] text-black hover:bg-[#c49e30]' },
               { status: 'CANCELLED', label: 'Annuler',               cls: 'border border-red-500/50 text-red-400 hover:bg-red-500/10' }],
  CONFIRMED:  [{ status: 'PROCESSING', label: 'Mettre en préparation', cls: 'bg-[#D4AF37] text-black hover:bg-[#c49e30]' },
               { status: 'CANCELLED',  label: 'Annuler',              cls: 'border border-red-500/50 text-red-400 hover:bg-red-500/10' }],
  PROCESSING: [{ status: 'SHIPPED',   label: 'Marquer expédiée',       cls: 'bg-[#D4AF37] text-black hover:bg-[#c49e30]' }],
  SHIPPED:    [{ status: 'DELIVERED', label: 'Marquer livrée',          cls: 'bg-[#D4AF37] text-black hover:bg-[#c49e30]' }],
}

function VendorOrderDetailPage() {
  const { id }            = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const load = () => {
    setLoading(true)
    getVendorOrder(id)
      .then(({ data }) => setOrder(data))
      .catch((err) => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleStatusUpdate = async (newStatus) => {
    setPendingAction(null)
    setUpdating(true)
    try {
      await updateOrderStatus(id, newStatus)
      toast.success('Statut mis à jour.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Impossible de mettre à jour.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="h-48 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse mb-4" />
        <div className="h-32 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-3">Commande introuvable.</p>
        <Link to="/dashboard/orders" className="text-[#D4AF37] hover:underline text-sm">← Retour aux commandes</Link>
      </div>
    )
  }

  const cfg        = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
  const actions    = NEXT_ACTIONS[order.status] || []
  const itemCount  = order.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="max-w-2xl">
      <Link to="/dashboard/orders" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition">
        <FiArrowLeft size={14} /> Retour aux commandes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Commande #{order.id}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
      </div>

      {/* Status actions */}
      {actions.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action.status}
                onClick={() => setPendingAction(action)}
                disabled={updating}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${action.cls}`}
              >
                {action.status !== 'CANCELLED' && <FiCheck size={14} />}
                {action.label}
              </button>
            ))}
          </div>
          {pendingAction && (
            <div className="bg-[#16161E] border border-[#D4AF37]/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <p className="text-sm text-gray-300 flex-1">
                Confirmer : <span className="font-semibold text-white">{pendingAction.label}</span> pour la commande #{order.id} ?
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setPendingAction(null)} className="px-3 py-1.5 text-sm border border-[#2a2a3a] text-gray-400 hover:text-white rounded-lg transition">
                  Annuler
                </button>
                <button
                  onClick={() => handleStatusUpdate(pendingAction.status)}
                  disabled={updating}
                  className="px-3 py-1.5 text-sm bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {updating ? 'Mise à jour...' : 'Confirmer'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Client */}
      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Client</p>
        <p className="text-white font-medium text-sm">{order.buyer_name}</p>
        <p className="text-gray-400 text-xs">{order.buyer_email}</p>
        <p className="text-xs text-gray-500 uppercase tracking-wide mt-3 mb-1">Adresse de livraison</p>
        <p className="text-white text-sm whitespace-pre-line">{order.delivery_address}</p>
        {order.notes && <p className="text-gray-500 text-xs mt-2 italic">{order.notes}</p>}
      </div>

      {/* Items */}
      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-[#2a2a3a] text-xs text-gray-500 uppercase tracking-wide">
          {itemCount} article{itemCount !== 1 ? 's' : ''}
        </div>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 px-4 py-4 border-b border-[#2a2a3a] last:border-0">
            <div className="w-12 h-12 rounded-lg bg-[#2a2a3a] overflow-hidden flex-shrink-0">
              {item.cover_image ? (
                <img src={item.cover_image} alt={item.product_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-700">📦</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium line-clamp-1">{item.product_name}</p>
              {item.variant_label && <p className="text-gray-500 text-xs">{item.variant_label}</p>}
              <p className="text-gray-500 text-xs">{Number(item.unit_price).toLocaleString('fr-SN')} FCFA × {item.quantity}</p>
            </div>
            <p className="text-white text-sm font-medium whitespace-nowrap">
              {Number(item.subtotal).toLocaleString('fr-SN')} FCFA
            </p>
          </div>
        ))}
        {Number(order.shipping_cost) > 0 && (
          <div className="px-4 py-3 border-t border-[#2a2a3a] flex justify-between text-sm text-gray-400">
            <span>Livraison</span>
            <span>{Number(order.shipping_cost).toLocaleString('fr-SN')} FCFA</span>
          </div>
        )}
        <div className="px-4 py-3 border-t border-[#2a2a3a] flex justify-between text-sm font-semibold">
          <span className="text-gray-400">Total</span>
          <span className="text-[#D4AF37] text-base">
            {(Number(order.subtotal ?? 0) + Number(order.shipping_cost ?? 0)).toLocaleString('fr-SN')} FCFA
          </span>
        </div>
      </div>
    </div>
  )
}

export default VendorOrderDetailPage
