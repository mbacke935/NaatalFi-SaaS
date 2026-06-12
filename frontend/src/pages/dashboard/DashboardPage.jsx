import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiBox, FiClock, FiCreditCard, FiShoppingBag, FiTrendingUp } from 'react-icons/fi'
import { getVendorOrders } from '../../services/orders'
import { getMyProducts } from '../../services/products'
import { getWallet } from '../../services/wallet'

const fmt = (n) => Number(n ?? 0).toLocaleString('fr-SN') + ' FCFA'

const statusLabel = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PROCESSING: 'En préparation',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
}

function DashboardPage() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([getVendorOrders({}), getMyProducts({}), getWallet()])
      .then(([ordersRes, productsRes, walletRes]) => {
        if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data)
        if (productsRes.status === 'fulfilled') setProducts(productsRes.value.data)
        if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const metrics = useMemo(() => {
    const paidStatuses = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
    const revenue = orders
      .filter((o) => paidStatuses.includes(o.status))
      .reduce((sum, o) => sum + Number(o.subtotal ?? 0) + Number(o.shipping_cost ?? 0), 0)
    return {
      revenue,
      orders: orders.length,
      pending: orders.filter((o) => o.status === 'PENDING').length,
      activeProducts: products.filter((p) => p.status === 'PUBLISHED').length,
    }
  }, [orders, products])

  const recentOrders = orders.slice(0, 5)
  const lowStockProducts = products
    .filter((p) => p.status === 'OUT_OF_STOCK' || (p.stock_quantity != null && p.stock_quantity > 0 && p.stock_quantity < 5))
    .slice(0, 5)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  const cards = [
    { label: 'Revenus', value: fmt(metrics.revenue), icon: FiTrendingUp, tone: 'text-green-400' },
    { label: 'Commandes', value: metrics.orders, icon: FiShoppingBag, tone: 'text-blue-400' },
    { label: 'En attente', value: metrics.pending, icon: FiClock, tone: 'text-yellow-400' },
    { label: 'Produits actifs', value: metrics.activeProducts, icon: FiBox, tone: 'text-purple-400' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-1">Vue opérationnelle de votre boutique.</p>
        </div>
        <Link
          to="/dashboard/products/new"
          className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold px-4 py-2 rounded-lg text-sm transition"
        >
          Nouveau produit
          <FiArrowRight size={15} />
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
                <Icon className={card.tone} size={20} />
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2a2a3a] flex items-center justify-between">
            <h2 className="font-semibold text-white">Commandes récentes</h2>
            <Link to="/dashboard/orders" className="text-xs text-[#D4AF37] hover:underline">Voir tout</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">Aucune commande pour le moment.</p>
          ) : (
            recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/dashboard/orders/${order.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#2a2a3a] last:border-0 hover:bg-white/5 transition"
              >
                <div>
                  <p className="text-sm text-white font-medium">Commande #{order.id}</p>
                  <p className="text-xs text-gray-500">{order.buyer_name} · {statusLabel[order.status] ?? order.status}</p>
                </div>
                <p className="text-sm text-[#D4AF37] font-semibold whitespace-nowrap">{fmt(Number(order.subtotal ?? 0) + Number(order.shipping_cost ?? 0))}</p>
              </Link>
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Wallet</h2>
              <FiCreditCard className="text-[#D4AF37]" size={18} />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Disponible</span><span className="text-white font-semibold">{fmt(wallet?.available_balance)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">En attente</span><span className="text-yellow-400 font-semibold">{fmt(wallet?.pending_balance)}</span></div>
            </div>
            <Link to="/dashboard/wallet" className="block mt-4 text-xs text-[#D4AF37] hover:underline">Gérer le wallet</Link>
          </div>

          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
            <h2 className="font-semibold text-white mb-3">Stock à surveiller</h2>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-gray-500">Tous vos stocks sont OK.</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((p) => (
                  <Link key={p.id} to={`/dashboard/products/${p.id}/edit`} className="flex items-center justify-between gap-2 hover:bg-white/5 rounded-lg px-1 py-0.5 transition">
                    <span className="text-sm text-gray-300 hover:text-white truncate">{p.name}</span>
                    {p.status === 'OUT_OF_STOCK'
                      ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-900/40 text-red-400 flex-shrink-0">Rupture</span>
                      : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-400 flex-shrink-0">{p.stock_quantity} restant{p.stock_quantity !== 1 ? 's' : ''}</span>
                    }
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
