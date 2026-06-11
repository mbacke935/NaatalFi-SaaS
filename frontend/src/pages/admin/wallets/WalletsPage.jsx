import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiCheck, FiCreditCard, FiX } from 'react-icons/fi'
import { adminGetPayouts, adminGetWallets, adminApprovePayout, adminRejectPayout } from '../../../services/wallet'

const fmt = (n) => Number(n ?? 0).toLocaleString('fr-SN') + ' FCFA'

const STATUS_COLORS = {
  PENDING: 'bg-yellow-900/40 text-yellow-400',
  APPROVED: 'bg-green-900/40 text-green-400',
  REJECTED: 'bg-red-900/40 text-red-400',
}

function WalletsPage() {
  const [wallets, setWallets] = useState([])
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.allSettled([adminGetWallets(), adminGetPayouts({ status: 'PENDING' })])
      .then(([walletRes, payoutRes]) => {
        if (walletRes.status === 'fulfilled') setWallets(walletRes.value.data)
        if (payoutRes.status === 'fulfilled') setPayouts(payoutRes.value.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const approve = async (id) => {
    if (!window.confirm('Approuver ce retrait ?')) return
    setActing(true)
    try {
      await adminApprovePayout(id)
      toast.success('Retrait approuve.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur.')
    } finally {
      setActing(false)
    }
  }

  const reject = async (id) => {
    const note = window.prompt('Motif du rejet')
    if (!note) return
    setActing(true)
    try {
      await adminRejectPayout(id, note)
      toast.success('Retrait rejete.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur.')
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return <div className="h-48 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Wallets</h1>
        <p className="text-sm text-gray-500 mt-1">Soldes vendeurs et approbation des retraits.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Wallets</p>
          <p className="text-2xl font-bold text-white">{wallets.length}</p>
        </div>
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Disponible total</p>
          <p className="text-2xl font-bold text-green-400">{fmt(wallets.reduce((s, w) => s + Number(w.available_balance), 0))}</p>
        </div>
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Retraits en attente</p>
          <p className="text-2xl font-bold text-yellow-400">{payouts.length}</p>
        </div>
      </div>

      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2a3a] flex items-center gap-2">
          <FiCreditCard className="text-[#D4AF37]" size={18} />
          <h2 className="font-semibold text-white">Demandes de retrait</h2>
        </div>
        {payouts.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">Aucune demande en attente.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a] text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Vendeur</th>
                <th className="text-left px-4 py-3">Montant</th>
                <th className="text-left px-4 py-3">Banque</th>
                <th className="text-left px-4 py-3">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id} className="border-b border-[#2a2a3a] last:border-0 hover:bg-white/5">
                  <td className="px-4 py-3 text-white font-medium">{payout.vendor_name}</td>
                  <td className="px-4 py-3 text-[#D4AF37] font-semibold">{fmt(payout.amount)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    <p>{payout.bank_info?.bank_name}</p>
                    <p className="text-gray-600">{payout.bank_info?.account_number}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[payout.status]}`}>{payout.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button disabled={acting} onClick={() => approve(payout.id)} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50">
                        <FiCheck size={14} />
                      </button>
                      <button disabled={acting} onClick={() => reject(payout.id)} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50">
                        <FiX size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2a3a]">
          <h2 className="font-semibold text-white">Soldes vendeurs</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a3a] text-gray-500 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3">Vendeur</th>
              <th className="text-right px-4 py-3">Disponible</th>
              <th className="text-right px-4 py-3">En attente</th>
              <th className="text-right px-4 py-3">Gele</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((wallet) => (
              <tr key={wallet.id} className="border-b border-[#2a2a3a] last:border-0">
                <td className="px-4 py-3 text-white">{wallet.vendor_name}</td>
                <td className="px-4 py-3 text-right text-green-400">{fmt(wallet.available_balance)}</td>
                <td className="px-4 py-3 text-right text-yellow-400">{fmt(wallet.pending_balance)}</td>
                <td className="px-4 py-3 text-right text-red-400">{fmt(wallet.frozen_balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default WalletsPage
