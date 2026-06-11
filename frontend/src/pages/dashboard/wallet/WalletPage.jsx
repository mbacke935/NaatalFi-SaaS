import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  FiDollarSign, FiClock, FiLock, FiArrowDownCircle,
  FiX, FiCheckCircle, FiXCircle, FiAlertCircle,
} from 'react-icons/fi'
import { getWallet, getTransactions, getPayouts, requestPayout } from '../../../services/wallet'

const fmt = (n) => Number(n ?? 0).toLocaleString('fr-SN') + ' FCFA'

const PLAN_BADGE = {
  FREE:    'bg-gray-700 text-gray-300',
  PRO:     'bg-blue-900/40 text-blue-400',
  PREMIUM: 'bg-yellow-900/40 text-yellow-400',
}

const TX_TYPE = {
  SALE:    { label: 'Vente',          cls: 'bg-green-900/40 text-green-400'  },
  COMMISSION: { label: 'Commission', cls: 'bg-orange-900/40 text-orange-400'},
  PAYOUT:  { label: 'Retrait',        cls: 'bg-blue-900/40 text-blue-400'    },
  REFUND:  { label: 'Remboursement',  cls: 'bg-purple-900/40 text-purple-400'},
  FREEZE:  { label: 'Gel',            cls: 'bg-red-900/40 text-red-400'      },
  RELEASE: { label: 'Dégel',          cls: 'bg-teal-900/40 text-teal-400'    },
}

const PAYOUT_STATUS = {
  PENDING:  { label: 'En attente', cls: 'bg-yellow-900/40 text-yellow-400', icon: FiAlertCircle  },
  APPROVED: { label: 'Approuvée',  cls: 'bg-green-900/40 text-green-400',   icon: FiCheckCircle  },
  REJECTED: { label: 'Rejetée',    cls: 'bg-red-900/40 text-red-400',       icon: FiXCircle      },
}

function PayoutModal({ available, onClose, onSuccess }) {
  const [form, setForm]   = useState({ amount: '', bank_name: '', account_number: '', account_name: '' })
  const [saving, setSaving] = useState(false)

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount < 1000) return toast.error('Montant minimum : 1 000 FCFA')
    if (amount > Number(available)) return toast.error('Montant supérieur au solde disponible.')
    if (!form.bank_name || !form.account_number || !form.account_name) {
      return toast.error('Veuillez remplir tous les champs bancaires.')
    }
    setSaving(true)
    try {
      await requestPayout({
        amount:         amount,
        bank_name:      form.bank_name,
        account_number: form.account_number,
        account_name:   form.account_name,
      })
      toast.success('Demande de retrait envoyée.')
      onSuccess()
      onClose()
    } catch {
      toast.error('Erreur lors de la demande de retrait.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Demander un retrait</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <FiX size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">
              Montant (FCFA) <span className="text-gray-600 normal-case">— max {fmt(available)}</span>
            </label>
            <input
              name="amount" type="number" min="1000" step="1" required
              value={form.amount} onChange={handle}
              placeholder="ex: 50000"
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Banque / Opérateur</label>
            <input
              name="bank_name" type="text" required
              value={form.bank_name} onChange={handle}
              placeholder="ex: Wave, Orange Money, BNDE…"
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Numéro de compte / téléphone</label>
            <input
              name="account_number" type="text" required
              value={form.account_number} onChange={handle}
              placeholder="ex: 77 000 00 00"
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Titulaire du compte</label>
            <input
              name="account_name" type="text" required
              value={form.account_name} onChange={handle}
              placeholder="Nom complet"
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <button
            type="submit" disabled={saving}
            className="w-full bg-[#D4AF37] hover:bg-[#c49e30] disabled:opacity-50 text-black font-semibold py-2.5 rounded-lg transition mt-2"
          >
            {saving ? 'Envoi…' : 'Confirmer le retrait'}
          </button>
        </form>
      </div>
    </div>
  )
}

function SkeletonRow({ cols = 4 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-3 bg-[#2a2a3a] rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export default function WalletPage() {
  const [wallet,   setWallet]   = useState(null)
  const [txs,      setTxs]      = useState([])
  const [payouts,  setPayouts]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [txLoading, setTxLoading] = useState(true)
  const [tab,      setTab]      = useState('transactions')
  const [modal,    setModal]    = useState(false)

  const loadWallet = () =>
    getWallet()
      .then(({ data }) => setWallet(data))
      .catch(() => toast.error('Impossible de charger le portefeuille.'))
      .finally(() => setLoading(false))

  const loadTxs = () => {
    setTxLoading(true)
    Promise.all([getTransactions(), getPayouts()])
      .then(([{ data: t }, { data: p }]) => { setTxs(t); setPayouts(p) })
      .catch(() => toast.error('Erreur lors du chargement des transactions.'))
      .finally(() => setTxLoading(false))
  }

  useEffect(() => { loadWallet(); loadTxs() }, [])

  const handlePayoutSuccess = () => { loadWallet(); loadTxs() }

  const planBadgeCls = PLAN_BADGE[wallet?.plan_name] ?? PLAN_BADGE.FREE

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Mon Portefeuille</h1>
          {wallet && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${planBadgeCls}`}>
              Plan {wallet.plan_name} — {wallet.commission_rate}% commission
            </span>
          )}
        </div>
        <button
          onClick={() => setModal(true)}
          disabled={!wallet || Number(wallet.available_balance) <= 0}
          className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#c49e30] disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold px-5 py-2.5 rounded-lg transition text-sm"
        >
          <FiArrowDownCircle size={16} />
          Demander un retrait
        </button>
      </div>

      {/* Soldes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Disponible */}
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <FiDollarSign className="text-green-400" size={16} />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Disponible</span>
          </div>
          {loading ? (
            <div className="h-6 bg-[#2a2a3a] rounded animate-pulse w-3/4" />
          ) : (
            <p className="text-xl font-bold text-green-400">{fmt(wallet?.available_balance)}</p>
          )}
          <p className="text-xs text-gray-600 mt-1">Retrait possible immédiatement</p>
        </div>

        {/* En attente */}
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <FiClock className="text-yellow-400" size={16} />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">En attente</span>
          </div>
          {loading ? (
            <div className="h-6 bg-[#2a2a3a] rounded animate-pulse w-3/4" />
          ) : (
            <p className="text-xl font-bold text-yellow-400">{fmt(wallet?.pending_balance)}</p>
          )}
          <p className="text-xs text-gray-600 mt-1">Disponible dans 7 jours après livraison</p>
        </div>

        {/* Gelé */}
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
              <FiLock className="text-red-400" size={16} />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Gelé</span>
          </div>
          {loading ? (
            <div className="h-6 bg-[#2a2a3a] rounded animate-pulse w-3/4" />
          ) : (
            <p className="text-xl font-bold text-red-400">{fmt(wallet?.frozen_balance)}</p>
          )}
          <p className="text-xs text-gray-600 mt-1">Bloqué (litige en cours)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'transactions', label: 'Transactions' },
          { key: 'payouts',      label: 'Demandes de retrait' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === key
                ? 'bg-[#D4AF37] text-black'
                : 'bg-[#16161E] text-gray-400 border border-[#2a2a3a] hover:border-[#D4AF37]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table Transactions */}
      {tab === 'transactions' && (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a]">
                <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase tracking-wide font-medium">Date</th>
                <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase tracking-wide font-medium">Description</th>
                <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase tracking-wide font-medium hidden sm:table-cell">Type</th>
                <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase tracking-wide font-medium">Montant</th>
              </tr>
            </thead>
            <tbody>
              {txLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
                : txs.length === 0
                  ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-500 text-sm">
                        <FiDollarSign className="mx-auto mb-2 opacity-30" size={32} />
                        Aucune transaction pour le moment
                      </td>
                    </tr>
                  )
                  : txs.map((tx) => {
                    const t = TX_TYPE[tx.type] ?? { label: tx.type, cls: 'bg-gray-700 text-gray-300' }
                    const isCredit = ['SALE', 'REFUND', 'RELEASE'].includes(tx.type)
                    return (
                      <tr key={tx.id} className="border-b border-[#2a2a3a] last:border-0 hover:bg-white/5 transition">
                        <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-white">{tx.description || tx.reference}</td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.cls}`}>{t.label}</span>
                        </td>
                        <td className={`py-3 px-4 text-right font-semibold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                          {isCredit ? '+' : '−'} {fmt(tx.amount)}
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Table Demandes de retrait */}
      {tab === 'payouts' && (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a]">
                <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase tracking-wide font-medium">Date</th>
                <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase tracking-wide font-medium hidden sm:table-cell">Banque</th>
                <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase tracking-wide font-medium">Montant</th>
                <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase tracking-wide font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {txLoading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
                : payouts.length === 0
                  ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-500 text-sm">
                        <FiArrowDownCircle className="mx-auto mb-2 opacity-30" size={32} />
                        Aucune demande de retrait
                      </td>
                    </tr>
                  )
                  : payouts.map((p) => {
                    const s = PAYOUT_STATUS[p.status] ?? PAYOUT_STATUS.PENDING
                    const Icon = s.icon
                    return (
                      <tr key={p.id} className="border-b border-[#2a2a3a] last:border-0 hover:bg-white/5 transition">
                        <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-gray-300 hidden sm:table-cell">
                          {p.bank_info?.bank_name ?? '—'}
                          {p.bank_info?.account_number ? ` · ${p.bank_info.account_number}` : ''}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-white">{fmt(p.amount)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>
                            <Icon size={11} />
                            {s.label}
                          </span>
                          {p.admin_note && (
                            <p className="text-xs text-gray-500 mt-0.5 italic">{p.admin_note}</p>
                          )}
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <PayoutModal
          available={wallet?.available_balance ?? 0}
          onClose={() => setModal(false)}
          onSuccess={handlePayoutSuccess}
        />
      )}
    </div>
  )
}
