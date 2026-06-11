import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiShoppingBag, FiChevronRight } from 'react-icons/fi'
import { getAccountOrders } from '../../services/account'
import { useMeta }          from '../../hooks/useMeta'

const STATUS_CONFIG = {
  PENDING:    { label: 'En attente',     cls: 'bg-yellow-900/40 text-yellow-400' },
  CONFIRMED:  { label: 'Confirmée',      cls: 'bg-blue-900/40   text-blue-400'   },
  PROCESSING: { label: 'En préparation', cls: 'bg-purple-900/40 text-purple-400' },
  SHIPPED:    { label: 'Expédiée',       cls: 'bg-indigo-900/40 text-indigo-400' },
  DELIVERED:  { label: 'Livrée',         cls: 'bg-green-900/40  text-green-400'  },
  CANCELLED:  { label: 'Annulée',        cls: 'bg-red-900/40    text-red-400'    },
  REFUNDED:   { label: 'Remboursée',     cls: 'bg-orange-900/40 text-orange-400' },
}

function AccountOrdersPage() {
  useMeta({ title: 'Mes commandes' })

  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAccountOrders()
      .then(({ data }) => setOrders(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Mes commandes</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-16 text-center">
          <FiShoppingBag size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Vous n'avez pas encore de commandes.</p>
          <Link to="/marketplace" className="text-[#D4AF37] hover:underline text-sm">
            Découvrir la marketplace →
          </Link>
        </div>
      ) : (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          {orders.map((order) => {
            const cfg       = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
            const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0
            const cover     = order.items?.[0]?.cover_image

            return (
              <Link key={order.id} to={`/account/orders/${order.id}`}
                className="flex items-center gap-4 px-4 py-4 border-b border-[#2a2a3a] last:border-0 hover:bg-white/5 transition"
              >
                {/* Cover */}
                <div className="w-12 h-12 rounded-lg bg-[#2a2a3a] flex-shrink-0 overflow-hidden">
                  {cover
                    ? <img src={cover} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-700 text-lg">📦</div>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium text-sm">Commande #{order.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${cfg.cls}`}>{cfg.label}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {itemCount} article{itemCount !== 1 ? 's' : ''} ·{' '}
                    {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Total */}
                <div className="text-right flex-shrink-0">
                  <p className="text-[#D4AF37] font-semibold text-sm whitespace-nowrap">
                    {Number(order.total).toLocaleString('fr-SN')} FCFA
                  </p>
                  <FiChevronRight size={14} className="text-gray-600 ml-auto mt-1" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AccountOrdersPage
