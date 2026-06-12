import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPackage, FiChevronRight } from 'react-icons/fi'
import { getVendorOrders } from '../../../services/orders'

const STATUS_CONFIG = {
  PENDING:    { label: 'En attente',     cls: 'bg-yellow-900/40 text-yellow-400' },
  CONFIRMED:  { label: 'Confirmée',      cls: 'bg-blue-900/40  text-blue-400'   },
  PROCESSING: { label: 'En préparation', cls: 'bg-purple-900/40 text-purple-400' },
  SHIPPED:    { label: 'Expédiée',       cls: 'bg-indigo-900/40 text-indigo-400' },
  DELIVERED:  { label: 'Livrée',         cls: 'bg-green-900/40 text-green-400'  },
  CANCELLED:  { label: 'Annulée',        cls: 'bg-red-900/40   text-red-400'    },
  REFUNDED:   { label: 'Remboursée',     cls: 'bg-orange-900/40 text-orange-400' },
}

const TABS = [
  { key: '',           label: 'Toutes' },
  { key: 'PENDING',    label: 'En attente' },
  { key: 'CONFIRMED',  label: 'Confirmées' },
  { key: 'PROCESSING', label: 'En préparation' },
  { key: 'SHIPPED',    label: 'Expédiées' },
  { key: 'DELIVERED',  label: 'Livrées' },
  { key: 'CANCELLED',  label: 'Annulées' },
]

function VendorOrdersPage() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('')

  const load = (statusFilter) => {
    setLoading(true)
    getVendorOrders(statusFilter ? { status: statusFilter } : {})
      .then(({ data }) => setOrders(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(tab) }, [tab])

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">Commandes</h1>
        <span className="text-sm text-gray-500">{orders.length} commande{orders.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#16161E] border border-[#2a2a3a] rounded-xl p-1 overflow-x-auto w-fit max-w-full">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setLoading(true); setTab(t.key) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              tab === t.key ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
          <FiPackage size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Aucune commande pour l'instant.</p>
        </div>
      ) : (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-[#2a2a3a] text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Commande</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Client</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3">Statut</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const cfg       = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
                const itemCount = order.items.reduce((s, i) => s + i.quantity, 0)
                return (
                  <tr key={order.id} className="border-b border-[#2a2a3a] last:border-0 hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">#{order.id}</p>
                      <p className="text-gray-500 text-xs">{itemCount} article{itemCount !== 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                      <p>{order.buyer_name}</p>
                      <p className="text-xs text-gray-600">{order.buyer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${cfg.cls}`}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-medium whitespace-nowrap">
                      {Number(order.total).toLocaleString('fr-SN')} FCFA
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/dashboard/orders/${order.id}`}
                        className="text-gray-500 hover:text-[#D4AF37] transition"
                      >
                        <FiChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default VendorOrdersPage
