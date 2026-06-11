import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiShoppingBag, FiHeart, FiMapPin, FiChevronRight, FiClock } from 'react-icons/fi'
import { getAccountOrders } from '../../services/account'
import { getFavorites }     from '../../services/account'
import { useMeta }          from '../../hooks/useMeta'

const STATUS_LABEL = {
  PENDING:    { label: 'En attente',     cls: 'text-yellow-400 bg-yellow-900/30' },
  CONFIRMED:  { label: 'Confirmée',      cls: 'text-blue-400   bg-blue-900/30'   },
  PROCESSING: { label: 'En préparation', cls: 'text-purple-400 bg-purple-900/30' },
  SHIPPED:    { label: 'Expédiée',       cls: 'text-indigo-400 bg-indigo-900/30' },
  DELIVERED:  { label: 'Livrée',         cls: 'text-green-400  bg-green-900/30'  },
  CANCELLED:  { label: 'Annulée',        cls: 'text-red-400    bg-red-900/30'    },
}

function AccountPage() {
  useMeta({ title: 'Mon compte' })

  const [orders,    setOrders]    = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getAccountOrders(), getFavorites()])
      .then(([o, f]) => { setOrders(o.data); setFavorites(f.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const pending   = orders.filter((o) => o.status === 'PENDING').length
  const delivered = orders.filter((o) => o.status === 'DELIVERED').length

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Tableau de bord</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Commandes',        value: orders.length,    icon: FiShoppingBag, to: '/account/orders' },
          { label: 'En attente',       value: pending,          icon: FiClock,       to: '/account/orders' },
          { label: 'Favoris',          value: favorites.length, icon: FiHeart,       to: '/account/favorites' },
        ].map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to}
            className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-4 hover:border-[#D4AF37]/40 transition group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className="text-[#D4AF37]" />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{loading ? '—' : value}</p>
          </Link>
        ))}
      </div>

      {/* Commandes récentes */}
      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden mb-6">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a3a]">
          <h2 className="text-sm font-semibold text-white">Commandes récentes</h2>
          <Link to="/account/orders" className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1">
            Voir tout <FiChevronRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-[#2a2a3a] rounded animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <FiShoppingBag size={28} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aucune commande pour l'instant.</p>
          </div>
        ) : (
          <div>
            {orders.slice(0, 5).map((order) => {
              const cfg = STATUS_LABEL[order.status] || STATUS_LABEL.PENDING
              const orderDate = new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
              return (
                <Link key={order.id} to={`/account/orders/${order.id}`}
                  className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a3a] last:border-0 hover:bg-white/5 transition"
                >
                  <div>
                    <span className="text-white text-sm font-medium">#{order.id}</span>
                    <span className="text-gray-500 text-xs ml-2">{orderDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${cfg.cls}`}>{cfg.label}</span>
                    <span className="text-[#D4AF37] text-sm font-medium whitespace-nowrap">
                      {Number(order.total).toLocaleString('fr-SN')} FCFA
                    </span>
                    <FiChevronRight size={14} className="text-gray-600" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Liens rapides */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/account/addresses"
          className="flex items-center gap-3 p-4 bg-[#16161E] border border-[#2a2a3a] rounded-xl hover:border-[#D4AF37]/40 transition"
        >
          <FiMapPin size={18} className="text-[#D4AF37]" />
          <span className="text-white text-sm">Mes adresses</span>
        </Link>
        <Link to="/account/favorites"
          className="flex items-center gap-3 p-4 bg-[#16161E] border border-[#2a2a3a] rounded-xl hover:border-[#D4AF37]/40 transition"
        >
          <FiHeart size={18} className="text-[#D4AF37]" />
          <span className="text-white text-sm">Mes favoris</span>
        </Link>
      </div>
    </div>
  )
}

export default AccountPage
