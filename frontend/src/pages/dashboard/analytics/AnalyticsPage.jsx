import { useEffect, useMemo, useState } from 'react'
import { FiBarChart2, FiBox, FiShoppingBag, FiTrendingUp } from 'react-icons/fi'
import { getVendorOrders } from '../../../services/orders'

const fmt = (n) => Number(n ?? 0).toLocaleString('fr-SN') + ' FCFA'

const fmtShort = (n) => {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return Math.round(n).toString()
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function AnalyticsPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    getVendorOrders({})
      .then(({ data }) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const analytics = useMemo(() => {
    const cutoff = startOfDay(new Date())
    cutoff.setDate(cutoff.getDate() - days + 1)
    const validStatuses = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
    const filtered = orders.filter((o) => new Date(o.created_at) >= cutoff)
    const paid = filtered.filter((o) => validStatuses.includes(o.status))
    const revenue = paid.reduce((sum, o) => sum + Number(o.subtotal ?? 0) + Number(o.shipping_cost ?? 0), 0)
    const itemsSold = paid.reduce((sum, o) => sum + (o.items ?? []).reduce((s, item) => s + item.quantity, 0), 0)

    const daily = Array.from({ length: days }).map((_, index) => {
      const date = startOfDay(new Date())
      date.setDate(date.getDate() - (days - index - 1))
      const key = date.toISOString().slice(0, 10)
      const dayOrders = paid.filter((o) => startOfDay(o.created_at).toISOString().slice(0, 10) === key)
      return {
        key,
        label: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        revenue: dayOrders.reduce((sum, o) => sum + Number(o.subtotal ?? 0) + Number(o.shipping_cost ?? 0), 0),
        count: dayOrders.length,
      }
    })

    const topProducts = {}
    paid.forEach((order) => {
      ;(order.items ?? []).forEach((item) => {
        if (!topProducts[item.product_name]) {
          topProducts[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 }
        }
        topProducts[item.product_name].quantity += item.quantity
        topProducts[item.product_name].revenue += Number(item.subtotal ?? 0)
      })
    })

    return {
      revenue,
      orders: paid.length,
      itemsSold,
      averageBasket: paid.length ? revenue / paid.length : 0,
      daily,
      topProducts: Object.values(topProducts).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    }
  }, [orders, days])

  const maxRevenue = Math.max(...analytics.daily.map((d) => d.revenue), 1)

  if (loading) {
    return <div className="h-64 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
  }

  const cards = [
    { label: 'Revenus', value: fmt(analytics.revenue), icon: FiTrendingUp },
    { label: 'Commandes', value: analytics.orders, icon: FiShoppingBag },
    { label: 'Articles vendus', value: analytics.itemsSold, icon: FiBox },
    { label: 'Panier moyen', value: fmt(analytics.averageBasket), icon: FiBarChart2 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Ventes, revenus et produits les plus performants.</p>
        </div>
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-1 flex">
          {[7, 30, 90].map((value) => (
            <button
              key={value}
              onClick={() => setDays(value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${days === value ? 'bg-[#D4AF37] text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              {value}j
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Chart: Y-axis + bars */}
          <div className="flex gap-3">
            {/* Y-axis labels */}
            <div className="w-10 flex flex-col justify-between items-end text-right pb-5 pt-0.5 flex-shrink-0">
              <span className="text-[10px] text-gray-500 leading-none">{fmtShort(maxRevenue)}</span>
              <span className="text-[10px] text-gray-500 leading-none">{fmtShort(maxRevenue * 0.5)}</span>
              <span className="text-[10px] text-gray-500 leading-none">0</span>
            </div>

            {/* Bars area with grid lines */}
            <div className="flex-1 relative">
              {/* Horizontal grid lines */}
              <div className="absolute inset-x-0 pointer-events-none" style={{ top: 0, bottom: '1.25rem' }}>
                <div className="absolute top-0 inset-x-0 border-t border-[#2a2a3a]" />
                <div className="absolute inset-x-0 border-t border-[#2a2a3a]" style={{ top: '50%' }} />
                <div className="absolute bottom-0 inset-x-0 border-t border-[#2a2a3a]" />
              </div>

              <div className="h-64 flex items-end gap-0.5">
                {analytics.daily.map((day) => (
                  <div key={day.key} className="flex-1 min-w-0 h-full flex flex-col justify-end gap-1.5">
                    <div className="relative flex-1 flex items-end">
                      <div
                        className="w-full rounded-t bg-[#D4AF37]/80 hover:bg-[#D4AF37] transition"
                        style={{ height: `${Math.max((day.revenue / maxRevenue) * 100, day.revenue ? 5 : 1)}%` }}
                        title={`${day.label}: ${fmt(day.revenue)}`}
                      />
                    </div>
                    <span className="text-[10px] text-gray-600 text-center truncate">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Top produits</h2>
          {analytics.topProducts.length === 0 ? (
            <p className="text-sm text-gray-500">Pas encore de ventes sur cette période.</p>
          ) : (
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={product.name}>
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
