import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiCheck, FiCreditCard, FiX } from 'react-icons/fi'
import {
  adminApprovePayout,
  adminGetPayouts,
  adminGetPlatformAccount,
  adminGetWallets,
  adminRejectPayout,
  adminUpdatePlatformAccount,
} from '../../../services/wallet'

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
  const [confirmApprove, setConfirmApprove] = useState(null)
  const [rejectDialog, setRejectDialog] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [platformAccount, setPlatformAccount] = useState(null)
  const [accountForm, setAccountForm] = useState({
    method: 'MOBILE_MONEY',
    account_name: '',
    phone_number: '',
    bank_name: '',
    account_number: '',
    instructions: '',
  })

  const load = () => {
    setLoading(true)
    Promise.allSettled([adminGetWallets(), adminGetPayouts({ status: 'PENDING' }), adminGetPlatformAccount()])
      .then(([walletRes, payoutRes, accountRes]) => {
        if (walletRes.status === 'fulfilled') setWallets(walletRes.value.data)
        if (payoutRes.status === 'fulfilled') setPayouts(payoutRes.value.data)
        if (accountRes.status === 'fulfilled') {
          setPlatformAccount(accountRes.value.data)
          setAccountForm({
            method: accountRes.value.data.method || 'MOBILE_MONEY',
            account_name: accountRes.value.data.account_name || '',
            phone_number: accountRes.value.data.phone_number || '',
            bank_name: accountRes.value.data.bank_name || '',
            account_number: accountRes.value.data.account_number || '',
            instructions: accountRes.value.data.instructions || '',
          })
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const approve = async (payout) => {
    setConfirmApprove(null)
    setActing(true)
    try {
      await adminApprovePayout(payout.id)
      toast.success('Retrait approuvé.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur.')
    } finally {
      setActing(false)
    }
  }

  const reject = async () => {
    if (!rejectNote.trim()) { toast.error('Le motif est obligatoire.'); return }
    setActing(true)
    try {
      await adminRejectPayout(rejectDialog.id, rejectNote.trim())
      toast.success('Retrait rejeté.')
      setRejectDialog(null)
      setRejectNote('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur.')
    } finally {
      setActing(false)
    }
  }

  const handleAccount = (event) => {
    setAccountForm((form) => ({ ...form, [event.target.name]: event.target.value }))
  }

  const savePlatformAccount = async (event) => {
    event.preventDefault()
    setActing(true)
    try {
      const { data } = await adminUpdatePlatformAccount(accountForm)
      setPlatformAccount(data)
      toast.success('Coordonnees de versement mises a jour.')
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.phone_number || err.response?.data?.bank_name || 'Erreur.')
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

      <form onSubmit={savePlatformAccount} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-white">Compte de versement plateforme</h2>
            <p className="text-xs text-gray-500 mt-1">Coordonnees utilisees pour recevoir les commissions NaatalFi.</p>
          </div>
          <p className="text-sm text-[#D4AF37] font-semibold">
            Commissions: {fmt(platformAccount?.total_commissions)}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <select
            name="method"
            value={accountForm.method}
            onChange={handleAccount}
            className="bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="MOBILE_MONEY">Mobile money</option>
            <option value="BANK">Banque</option>
          </select>
          <input
            name="account_name"
            value={accountForm.account_name}
            onChange={handleAccount}
            required
            placeholder="Nom du titulaire"
            className="bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
          />
          <input
            name="phone_number"
            value={accountForm.phone_number}
            onChange={handleAccount}
            placeholder="Numero mobile money"
            className="bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
          />
          <input
            name="bank_name"
            value={accountForm.bank_name}
            onChange={handleAccount}
            placeholder="Nom de la banque"
            className="bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
          />
          <input
            name="account_number"
            value={accountForm.account_number}
            onChange={handleAccount}
            placeholder="Numero de compte"
            className="bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
          />
          <input
            name="instructions"
            value={accountForm.instructions}
            onChange={handleAccount}
            placeholder="Instructions internes"
            className="bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <button
          type="submit"
          disabled={acting}
          className="px-4 py-2 bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold rounded-lg text-sm transition disabled:opacity-50"
        >
          Enregistrer
        </button>
      </form>

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
                      <button disabled={acting} onClick={() => setConfirmApprove(payout)} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50">
                        <FiCheck size={14} />
                      </button>
                      <button disabled={acting} onClick={() => { setRejectDialog(payout); setRejectNote('') }} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50">
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
      {/* Dialog approbation retrait */}
      {confirmApprove && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold mb-2">Approuver ce retrait ?</h3>
            <p className="text-gray-400 text-sm mb-1">Vendeur : <span className="text-white">{confirmApprove.vendor_name}</span></p>
            <p className="text-[#D4AF37] font-bold text-lg mb-5">{fmt(confirmApprove.amount)}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmApprove(null)} className="flex-1 px-4 py-2 border border-[#2a2a3a] text-gray-400 hover:text-white rounded-lg text-sm transition">Annuler</button>
              <button onClick={() => approve(confirmApprove)} disabled={acting} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50">Approuver</button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog rejet retrait */}
      {rejectDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold mb-2">Rejeter ce retrait</h3>
            <p className="text-gray-400 text-sm mb-4">Vendeur : <span className="text-white">{rejectDialog.vendor_name}</span> · {fmt(rejectDialog.amount)}</p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Motif du rejet (obligatoire)"
              rows={3}
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectDialog(null)} className="flex-1 px-4 py-2 border border-[#2a2a3a] text-gray-400 hover:text-white rounded-lg text-sm transition">Annuler</button>
              <button onClick={reject} disabled={acting || !rejectNote.trim()} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50">Rejeter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletsPage
