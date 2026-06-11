import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiBell, FiCheckCircle, FiClock, FiShoppingBag, FiTruck } from 'react-icons/fi'
import { getVendorOrders } from '../../../services/orders'

const config = {
  PENDING:    { icon: FiClock,         title: 'Commande à confirmer',   tone: 'text-yellow-400' },
  CONFIRMED:  { icon: FiShoppingBag,   title: 'Commande confirmée',     tone: 'text-blue-400'   },
  PROCESSING: { icon: FiTruck,         title: 'Commande en préparation', tone: 'text-purple-400' },
  SHIPPED:    { icon: FiTruck,         title: 'Commande expédiée',      tone: 'text-indigo-400' },
  DELIVERED:  { icon: FiCheckCircle,   title: 'Commande livrée',        tone: 'text-green-400'  },
}

function NotificationsPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getVendorOrders({})
      .then(({ data }) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const notifications = useMemo(() => (
    orders
      .filter((order) => config[order.status])
      .slice(0, 30)
      .map((order) => ({
        id: order.id,
        status: order.status,
        title: config[order.status].title,
        message: `Commande #${order.id} - ${order.buyer_name || 'Client'}`,
        date: order.updated_at || order.created_at,
      }))
  ), [orders])

  if (loading) {
    return <div className="h-40 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Événements récents liés à vos commandes.</p>
        </div>
        <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
          <FiBell className="text-[#D4AF37]" size={20} />
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
          <FiBell className="text-gray-600 mx-auto mb-3" size={32} />
          <p className="text-sm text-gray-500">Aucune notification pour le moment.</p>
        </div>
      ) : (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          {notifications.map((notification) => {
            const cfg = config[notification.status]
            const Icon = cfg.icon
            return (
              <Link
                key={`${notification.status}-${notification.id}`}
                to={`/dashboard/orders/${notification.id}`}
                className="flex items-center gap-4 px-5 py-4 border-b border-[#2a2a3a] last:border-0 hover:bg-white/5 transition"
              >
                <div className="w-10 h-10 rounded-lg bg-[#0B0B0F] border border-[#2a2a3a] flex items-center justify-center flex-shrink-0">
                  <Icon className={cfg.tone} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{notification.title}</p>
                  <p className="text-xs text-gray-500 truncate">{notification.message}</p>
                </div>
                <p className="text-xs text-gray-600 whitespace-nowrap">
                  {new Date(notification.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
