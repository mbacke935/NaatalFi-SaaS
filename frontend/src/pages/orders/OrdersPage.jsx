import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPackage, FiChevronRight } from 'react-icons/fi'
import { getMyOrders } from '../../services/orders'
import { useMeta } from '../../hooks/useMeta'

const STATUS_CONFIG = {
  PENDING:    { label: 'En attente',      cls: 'bg-yellow-900/40 text-yellow-400' },
  CONFIRMED:  { label: 'Confirmée',       cls: 'bg-blue-900/40  text-blue-400'   },
  PROCESSING: { label: 'En préparation',  cls: 'bg-purple-900/40 text-purple-400' },
  SHIPPED:    { label: 'Expédiée',        cls: 'bg-indigo-900/40 text-indigo-400' },
  DELIVERED:  { label: 'Livrée',          cls: 'bg-green-900/40 text-green-400'  },
  CANCELLED:  { label: 'Annulée',         cls: 'bg-red-900/40   text-red-400'    },
  REFUNDED:   { label: 'Remboursée',      cls: 'bg-orange-900/40 text-orange-400' },
}

function OrdersPage() {
  useMeta({ title: 'Mes commandes' })
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyOrders()
      .then(({ data }) => setOrders(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Mes commandes</h1>

      {orders.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
          <FiPackage size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 mb-3">Vous n'avez pas encore de commandes.</p>
          <Link to="/marketplace" className="text-[#D4AF37] hover:underline text-sm">
            Parcourir la marketplace →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0)
            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center gap-4 bg-[#16161E] border border-[#2a2a3a] rounded-xl px-4 py-4 hover:border-[#D4AF37]/40 transition group"
              >
                {/* Cover */}
                <div className="w-12 h-12 rounded-lg bg-[#2a2a3a] overflow-hidden flex-shrink-0">
                  {order.items[0]?.cover_image ? (
                    <img src={order.items[0].cover_image} alt="" className="product-image-contain p-1" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700">📦</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium text-sm">Commande #{order.id}</p>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${cfg.cls}`}>{cfg.label}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {order.vendor_name} · {itemCount} article{itemCount !== 1 ? 's' : ''} ·{' '}
                    {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[#D4AF37] font-bold text-sm">
                    {Number(order.total).toLocaleString('fr-SN')} FCFA
                  </span>
                  <FiChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default OrdersPage
