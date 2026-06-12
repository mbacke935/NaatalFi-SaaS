import { useEffect, useMemo, useState } from 'react'
import { FiAlertCircle, FiBarChart2, FiBox, FiShoppingBag, FiTrendingUp } from 'react-icons/fi'
import { getVendorAnalytics } from '../../../services/analytics'

const fmt = (n) => Number(n ?? 0).toLocaleString('fr-SN') + ' FCFA'

const fmtShort = (n) => {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return Math.round(n).toString()
}

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    setLoading(true)
    getVendorAnalytics({ period })
      .then(({ data }) => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false))
  }, [period])

  const daily = useMemo(() => analytics?.daily ?? [], [analytics])
  const maxRevenue = Math.max(...daily.map((day) => Number(day.revenue ?? 0)), 1)

  if (loading) {
    return <div className="h-64 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
  }

  const cards = [
    { label: 'Revenus', value: fmt(analytics?.revenue), icon: FiTrendingUp },
    { label: 'Commandes', value: analytics?.orders_count ?? 0, icon: FiShoppingBag },
    { label: 'Articles vendus', value: analytics?.items_sold ?? 0, icon: FiBox },
    { label: 'Panier moyen', value: fmt(analytics?.average_basket), icon: FiBarChart2 },
    { label: 'Taux litiges', value: `${Math.round(Number(analytics?.dispute_rate ?? 0) * 1000) / 10}%`, icon: FiAlertCircle },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Ventes, revenus et produits les plus performants.</p>
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
                <Icon className="text-[#D4AF37]" size={19} />
              </div>
              <p className="text-xl font-bold text-white">{card.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
          <h2 className="font-semibold text-white mb-5">Revenus par jour</h2>

          <div className="flex gap-3">
            <div className="w-10 flex flex-col justify-between items-end text-right pb-5 pt-0.5 flex-shrink-0">
              <span className="text-[10px] text-gray-500 leading-none">{fmtShort(maxRevenue)}</span>
              <span className="text-[10px] text-gray-500 leading-none">{fmtShort(maxRevenue * 0.5)}</span>
              <span className="text-[10px] text-gray-500 leading-none">0</span>
            </div>

            <div className="flex-1 relative">
              <div className="absolute inset-x-0 pointer-events-none" style={{ top: 0, bottom: '1.25rem' }}>
                <div className="absolute top-0 inset-x-0 border-t border-[#2a2a3a]" />
                <div className="absolute inset-x-0 border-t border-[#2a2a3a]" style={{ top: '50%' }} />
                <div className="absolute bottom-0 inset-x-0 border-t border-[#2a2a3a]" />
              </div>

              <div className="h-64 flex items-end gap-0.5">
                {daily.map((day) => {
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
          </div>
        </div>

        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Top produits</h2>
          {(analytics?.top_products ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">Pas encore de ventes sur cette periode.</p>
          ) : (
            <div className="space-y-4">
              {analytics.top_products.slice(0, 5).map((product, index) => (
                <div key={`${product.product_id}-${product.name}`}>
                  <div className="flex justify-between gap-3 text-sm mb-1">
                    <span className="text-gray-300 truncate">{index + 1}. {product.name}</span>
                    <span className="text-white font-semibold whitespace-nowrap">{fmt(product.revenue)}</span>
                  </div>
                  <p className="text-xs text-gray-500">{product.quantity} vendu{product.quantity !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
