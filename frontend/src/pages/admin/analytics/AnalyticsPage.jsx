import { useEffect, useMemo, useState } from 'react'
import { FiAlertCircle, FiBarChart2, FiPercent, FiShoppingBag, FiTrendingUp } from 'react-icons/fi'
import { getAdminAnalyticsOverview, getAdminAnalyticsVendors } from '../../../services/admin'

const fmt = (n) => Number(n ?? 0).toLocaleString('fr-SN') + ' FCFA'
const pct = (n) => `${Math.round(Number(n ?? 0) * 1000) / 10}%`

function AdminAnalyticsPage() {
  const [overview, setOverview] = useState(null)
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      getAdminAnalyticsOverview({ period }),
      getAdminAnalyticsVendors({ period }),
    ])
      .then(([overviewRes, vendorsRes]) => {
        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data)
        else setOverview(null)
        if (vendorsRes.status === 'fulfilled') setVendors(vendorsRes.value.data)
        else setVendors([])
      })
      .finally(() => setLoading(false))
  }, [period])

  const maxRevenue = useMemo(
    () => Math.max(...(overview?.daily ?? []).map((day) => Number(day.revenue ?? 0)), 1),
    [overview],
  )

  if (loading) {
    return <div className="h-64 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
  }

  const cards = [
    { label: 'GMV', value: fmt(overview?.gmv), icon: FiTrendingUp, tone: 'text-[#D4AF37]' },
    { label: 'Commissions', value: fmt(overview?.commissions), icon: FiPercent, tone: 'text-green-400' },
    { label: 'Commandes', value: overview?.orders_count ?? 0, icon: FiShoppingBag, tone: 'text-blue-400' },
    { label: 'Panier moyen', value: fmt(overview?.average_basket), icon: FiBarChart2, tone: 'text-purple-400' },
    { label: 'Taux litiges', value: pct(overview?.dispute_rate), icon: FiAlertCircle, tone: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Rapports</h1>
          <p className="text-sm text-gray-500 mt-1">Vue globale des performances marketplace.</p>
        </div>
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-1 flex">
          {[
            ['7d', '7j'],
            ['30d', '30j'],
            ['90d', '90j'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${period === value ? 'bg-[#D4AF37] text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
          <h2 className="font-semibold text-white mb-5">GMV par jour</h2>
          <div className="h-64 flex items-end gap-1">
            {(overview?.daily ?? []).map((day) => {
              const revenue = Number(day.revenue ?? 0)
              const label = new Date(day.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
              return (
                <div key={day.date} className="flex-1 min-w-0 h-full flex flex-col justify-end gap-1.5">
                  <div className="relative flex-1 flex items-end">
                    <div
                      className="w-full rounded-t bg-[#D4AF37]/80 hover:bg-[#D4AF37] transition"
                      style={{ height: `${Math.max((revenue / maxRevenue) * 100, revenue ? 5 : 1)}%` }}
                      title={`${label}: ${fmt(revenue)}`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-600 text-center truncate">{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2a2a3a]">
            <h2 className="font-semibold text-white">Top vendeurs</h2>
          </div>
          {vendors.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">Pas encore de donnees.</p>
          ) : (
            <div className="divide-y divide-[#2a2a3a]">
              {vendors.slice(0, 8).map((vendor) => (
                <div key={vendor.vendor_id} className="px-5 py-4">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-white font-medium truncate">{vendor.name}</span>
                    <span className="text-[#D4AF37] font-semibold whitespace-nowrap">{fmt(vendor.revenue)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{vendor.orders} commande{vendor.orders !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminAnalyticsPage
