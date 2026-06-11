import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiShoppingBag } from 'react-icons/fi'
import { getAdminOrders } from '../../../services/admin'

const fmt = (n) => Number(n ?? 0).toLocaleString('fr-SN') + ' FCFA'

const STATUS_COLORS = {
  PENDING:    'bg-yellow-900/40 text-yellow-400',
  CONFIRMED:  'bg-blue-900/40 text-blue-400',
  PROCESSING: 'bg-purple-900/40 text-purple-400',
  SHIPPED:    'bg-indigo-900/40 text-indigo-400',
  DELIVERED:  'bg-green-900/40 text-green-400',
  CANCELLED:  'bg-red-900/40 text-red-400',
  REFUNDED:   'bg-orange-900/40 text-orange-400',
}

const STATUS_LABELS = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée', PROCESSING: 'En préparation',
  SHIPPED: 'Expédiée', DELIVERED: 'Livrée', CANCELLED: 'Annulée', REFUNDED: 'Remboursée',
}

const FILTERS = [
  { value: '', label: 'Toutes' },
  { value: 'PENDING',    label: 'En attente' },
  { value: 'CONFIRMED',  label: 'Confirmées' },
  { value: 'PROCESSING', label: 'En préparation' },
  { value: 'SHIPPED',    label: 'Expédiées' },
  { value: 'DELIVERED',  label: 'Livrées' },
  { value: 'CANCELLED',  label: 'Annulées' },
]

function AdminOrdersPage() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('')

  const load = (s = status) => {
    setLoading(true)
    getAdminOrders(s ? { status: s } : {})
      .then(({ data }) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleFilter = (s) => {
    setStatus(s)
    load(s)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Commandes</h1>
        <p className="text-sm text-gray-500 mt-1">Toutes les commandes vendeurs sur la plateforme.</p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              status === f.value
                ? 'bg-[#D4AF37] text-black'
                : 'bg-[#16161E] text-gray-400 border border-[#2a2a3a] hover:border-[#D4AF37]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-14 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
          <FiShoppingBag className="text-gray-600 mx-auto mb-3" size={32} />
          <p className="text-sm text-gray-500">Aucune commande trouvée.</p>
        </div>
      ) : (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a] text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Vendeur</th>
                <th className="text-left px-4 py-3">Acheteur</th>
                <th className="text-left px-4 py-3">Statut</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-[#2a2a3a] last:border-0 hover:bg-white/5">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{order.id}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/vendors`}
                      className="text-[#D4AF37] hover:underline font-medium"
                    >
                      {order.vendor_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{order.buyer_name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-800 text-gray-400'}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-semibold whitespace-nowrap">
                    {fmt(Number(order.subtotal ?? 0) + Number(order.shipping_cost ?? 0))}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('fr-SN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-[#2a2a3a] text-xs text-gray-600">
            {orders.length} commande{orders.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrdersPage
