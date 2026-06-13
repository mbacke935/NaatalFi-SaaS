import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiAlertTriangle, FiBox, FiCreditCard, FiMail, FiMessageSquare, FiShoppingBag, FiTrendingUp, FiUsers, FiHome, FiArrowRight } from 'react-icons/fi'
import { getAdminAlertSummary, getAdminStats, getAdminOrders } from '../../services/admin'
import { adminGetVendors } from '../../services/vendors'

const fmt = (n) => Number(n ?? 0).toLocaleString('fr-SN') + ' FCFA'

const STATUS_COLORS = {
  PENDING:    'bg-yellow-900/40 text-yellow-400',
  CONFIRMED:  'bg-blue-900/40 text-blue-400',
  PROCESSING: 'bg-purple-900/40 text-purple-400',
  SHIPPED:    'bg-indigo-900/40 text-indigo-400',
  DELIVERED:  'bg-green-900/40 text-green-400',
  CANCELLED:  'bg-red-900/40 text-red-400',
}

const STATUS_LABELS = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée', PROCESSING: 'En préparation',
  SHIPPED: 'Expédiée', DELIVERED: 'Livrée', CANCELLED: 'Annulée',
}

function AdminDashboardPage() {
  const [stats, setStats]           = useState(null)
  const [pendingVendors, setPending] = useState([])
  const [recentOrders, setOrders]   = useState([])
  const [alerts, setAlerts]         = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.allSettled([
      getAdminStats(),
      adminGetVendors('PENDING'),
      getAdminOrders({}),
      getAdminAlertSummary(),
    ]).then(([statsRes, vendorsRes, ordersRes, alertsRes]) => {
      if (statsRes.status === 'fulfilled')  setStats(statsRes.value.data)
      if (vendorsRes.status === 'fulfilled') setPending(vendorsRes.value.data.slice(0, 5))
      if (ordersRes.status === 'fulfilled')  setOrders(ordersRes.value.data.slice(0, 6))
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="h-28 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const kpis = stats ? [
    { label: 'Utilisateurs',      value: stats.total_users,    icon: FiUsers,       tone: 'text-blue-400' },
    { label: 'Vendeurs',          value: stats.total_vendors,  icon: FiHome,        tone: 'text-purple-400',
      badge: stats.pending_vendors ? `${stats.pending_vendors} en attente` : null },
    { label: 'Commandes payées',  value: stats.paid_orders,    icon: FiShoppingBag, tone: 'text-green-400' },
    { label: 'GMV total',         value: fmt(stats.gmv),       icon: FiTrendingUp,  tone: 'text-[#D4AF37]' },
    { label: 'Retraits en attente', value: stats.pending_payouts, icon: FiCreditCard, tone: 'text-yellow-400',
      sub: stats.pending_payouts > 0 ? fmt(stats.pending_payouts_amount) : null },
    { label: 'Produits',          value: '—',                  icon: FiBox,         tone: 'text-gray-400' },
  ] : []

  const alertItems = alerts ? [
    {
      key: 'vendors',
      label: 'Vendeurs en attente',
      value: alerts.pending_vendors,
      to: '/admin/vendors?status=PENDING',
      icon: FiHome,
      tone: 'text-yellow-400',
    },
    {
      key: 'payouts',
      label: 'Retraits en attente',
      value: alerts.pending_payouts,
      to: '/admin/wallets?status=PENDING',
      icon: FiCreditCard,
      tone: 'text-yellow-400',
    },
    {
      key: 'disputes',
      label: 'Litiges ouverts',
      value: alerts.open_disputes,
      to: '/admin/disputes?status=OPEN',
      icon: FiMessageSquare,
      tone: 'text-red-400',
    },
    {
      key: 'payments',
      label: 'Paiements a verifier',
      value: Number(alerts.pending_payments ?? 0) + Number(alerts.failed_payments ?? 0),
      to: Number(alerts.failed_payments ?? 0) > 0 ? '/admin/payments?status=FAILED' : '/admin/payments?status=PENDING',
      icon: FiAlertTriangle,
      tone: 'text-orange-400',
    },
    {
      key: 'emails',
      label: 'Emails echoues',
      value: alerts.failed_emails,
      to: '/admin/emails?status=FAILED',
      icon: FiMail,
      tone: 'text-red-400',
    },
  ].filter((item) => Number(item.value ?? 0) > 0) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">Vue globale de la marketplace NaatalFi.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                <Icon className={kpi.tone} size={19} />
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
              {kpi.badge && (
                <p className="text-xs text-yellow-400 mt-1">{kpi.badge}</p>
              )}
              {kpi.sub && (
                <p className="text-xs text-gray-500 mt-1">{kpi.sub}</p>
              )}
            </div>
          )
        })}
      </div>

      {alertItems.length > 0 && (
        <div className="bg-[#16161E] border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiAlertTriangle className="text-yellow-400" size={18} />
            <h2 className="font-semibold text-white">Actions a traiter</h2>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {alertItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  className="rounded-lg border border-[#2a2a3a] bg-[#0B0B0F] px-4 py-3 hover:border-[#D4AF37]/60 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Icon className={item.tone} size={18} />
                    <span className="text-lg font-bold text-white">{item.value}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{item.label}</p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2a2a3a] flex items-center justify-between">
            <h2 className="font-semibold text-white">Commandes récentes</h2>
            <Link to="/admin/orders" className="text-xs text-[#D4AF37] hover:underline">Voir tout</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">Aucune commande pour le moment.</p>
          ) : recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#2a2a3a] last:border-0 hover:bg-white/5">
              <div className="min-w-0">
                <p className="text-sm text-white font-medium">#{order.id} · {order.vendor_name}</p>
                <p className="text-xs text-gray-500 truncate">{order.buyer_name}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-800 text-gray-400'}`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
                <p className="text-sm text-[#D4AF37] font-semibold whitespace-nowrap">
                  {fmt(Number(order.subtotal ?? 0) + Number(order.shipping_cost ?? 0))}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pending vendors */}
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2a2a3a] flex items-center justify-between">
            <h2 className="font-semibold text-white">Vendeurs en attente</h2>
            <Link to="/admin/vendors?status=PENDING" className="text-xs text-[#D4AF37] hover:underline">Voir tout</Link>
          </div>
          {pendingVendors.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">Aucune demande en attente.</p>
          ) : pendingVendors.map((vendor) => (
            <Link
              key={vendor.id}
              to={`/admin/vendors/${vendor.id}`}
              className="flex items-center gap-3 px-5 py-4 border-b border-[#2a2a3a] last:border-0 hover:bg-white/5 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-[#2a2a3a] flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                {vendor.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{vendor.name}</p>
                <p className="text-xs text-gray-500 truncate">{vendor.user_email}</p>
              </div>
              <FiArrowRight className="text-[#D4AF37]" size={14} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
