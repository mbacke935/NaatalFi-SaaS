import { useEffect, useState } from 'react'
import { FiCreditCard } from 'react-icons/fi'
import { getAdminPayments } from '../../../services/admin'

const fmt = (n) => Number(n ?? 0).toLocaleString('fr-SN') + ' FCFA'

const STATUS_COLORS = {
  PENDING: 'bg-yellow-900/40 text-yellow-400',
  PAID: 'bg-green-900/40 text-green-400',
  FAILED: 'bg-red-900/40 text-red-400',
  CANCELLED: 'bg-gray-800 text-gray-400',
  EXPIRED: 'bg-orange-900/40 text-orange-400',
}

const FILTERS = ['', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED']

function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  const load = (nextStatus = status) => {
    setLoading(true)
    getAdminPayments(nextStatus ? { status: nextStatus } : {})
      .then(({ data }) => setPayments(data))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const paidTotal = payments
    .filter((payment) => payment.status === 'PAID')
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Paiements</h1>
          <p className="text-sm text-gray-500 mt-1">Historique paiements et retours webhook.</p>
        </div>
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Payes affiches</p>
          <p className="text-lg text-green-400 font-bold">{fmt(paidTotal)}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map((filter) => (
          <button
            key={filter || 'ALL'}
            onClick={() => { setStatus(filter); load(filter) }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              status === filter
                ? 'bg-[#D4AF37] text-black'
                : 'bg-[#16161E] text-gray-400 border border-[#2a2a3a] hover:border-[#D4AF37]'
            }`}
          >
            {filter || 'Tous'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-40 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
      ) : payments.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
          <FiCreditCard className="text-gray-600 mx-auto mb-3" size={32} />
          <p className="text-sm text-gray-500">Aucun paiement trouve.</p>
        </div>
      ) : (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a] text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Reference</th>
                <th className="text-left px-4 py-3">Commande</th>
                <th className="text-left px-4 py-3">Acheteur</th>
                <th className="text-left px-4 py-3">Provider</th>
                <th className="text-left px-4 py-3">Statut</th>
                <th className="text-right px-4 py-3">Montant</th>
                <th className="text-left px-4 py-3">Webhook</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-[#2a2a3a] last:border-0 hover:bg-white/5">
                  <td className="px-4 py-3 text-white font-mono text-xs">{payment.reference}</td>
                  <td className="px-4 py-3 text-gray-300">#{payment.order_id}</td>
                  <td className="px-4 py-3 text-gray-400">{payment.buyer_email || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{payment.provider}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[payment.status] ?? 'bg-gray-800 text-gray-400'}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[#D4AF37] font-semibold">{fmt(payment.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {payment.has_webhook ? (payment.provider_reference || 'Recu') : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(payment.created_at).toLocaleDateString('fr-SN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default PaymentsPage
