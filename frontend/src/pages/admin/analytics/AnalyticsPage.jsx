import { useEffect, useMemo, useState } from 'react'
import { FiBarChart2, FiCreditCard, FiShoppingBag, FiTrendingUp, FiUsers } from 'react-icons/fi'
import { getAdminOrders, getAdminStats } from '../../../services/admin'

const fmt = (n) => Number(n ?? 0).toLocaleString('fr-SN') + ' FCFA'

function AdminAnalyticsPage() {
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([getAdminStats(), getAdminOrders({})])
      .then(([statsRes, ordersRes]) => {
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
        if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const analytics = useMemo(() => {
    const byVendor = {}
    orders.forEach((order) => {
      const total = Number(order.total ?? order.subtotal ?? 0) + Number(order.shipping_cost ?? 0)
      const key = order.vendor_name || 'Vendeur'
      byVendor[key] = byVendor[key] || { name: key, orders: 0, revenue: 0 }
      byVendor[key].orders += 1
      byVendor[key].revenue += total
    })
    return {
      topVendors: Object.values(byVendor).sort((a, b) => b.revenue - a.revenue).slice(0, 8),
      averageOrder: orders.length
        ? orders.reduce((sum, order) => sum + Number(order.total ?? order.subtotal ?? 0) + Number(order.shipping_cost ?? 0), 0) / orders.length
        : 0,
    }
  }, [orders])

  if (loading) {
    return <div className="h-64 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
  }

  const cards = [
    { label: 'GMV', value: fmt(stats?.gmv), icon: FiTrendingUp, tone: 'text-[#D4AF37]' },
    { label: 'Commandes payees', value: stats?.paid_orders ?? 0, icon: FiShoppingBag, tone: 'text-green-400' },
    { label: 'Utilisateurs', value: stats?.total_users ?? 0, icon: FiUsers, tone: 'text-blue-400' },
    { label: 'Panier moyen', value: fmt(analytics.averageOrder), icon: FiBarChart2, tone: 'text-purple-400' },
    { label: 'Retraits attente', value: stats?.pending_payouts ?? 0, icon: FiCreditCard, tone: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Rapports</h1>
        <p className="text-sm text-gray-500 mt-1">Vue globale des performances marketplace.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
                <Icon className={card.tone} size={18} />
              </div>
              <p className="text-xl font-bold text-white">{card.value}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2a3a]">
          <h2 className="font-semibold text-white">Top vendeurs</h2>
        </div>
        {analytics.topVendors.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">Pas encore de donnees.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a] text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Vendeur</th>
                <th className="text-right px-4 py-3">Commandes</th>
                <th className="text-right px-4 py-3">Revenus</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topVendors.map((vendor) => (
                <tr key={vendor.name} className="border-b border-[#2a2a3a] last:border-0">
                  <td className="px-4 py-3 text-white">{vendor.name}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{vendor.orders}</td>
                  <td className="px-4 py-3 text-right text-[#D4AF37] font-semibold">{fmt(vendor.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AdminAnalyticsPage
