import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiCheckCircle, FiMessageSquare, FiRefreshCcw } from 'react-icons/fi'
import { getAdminDisputes, resolveAdminDispute } from '../../../services/admin'

const statusLabels = {
  OPEN: 'Ouvert',
  UNDER_REVIEW: 'En revue',
  RESOLVED: 'Resolu',
  CLOSED: 'Ferme',
}

function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [resolveDialog, setResolveDialog] = useState(null) // { dispute, resolution }
  const [adminNote, setAdminNote] = useState('')

  const load = () => {
    setLoading(true)
    getAdminDisputes()
      .then(({ data }) => setDisputes(Array.isArray(data) ? data : []))
      .catch(() => setDisputes([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openResolveDialog = (dispute, resolution) => {
    setResolveDialog({ dispute, resolution })
    setAdminNote('')
  }

  const resolve = async () => {
    try {
      await resolveAdminDispute(resolveDialog.dispute.id, { resolution: resolveDialog.resolution, note: adminNote })
      toast.success('Litige résolu.')
      setResolveDialog(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Résolution impossible.')
    }
  }

  if (loading) {
    return <div className="h-40 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Litiges</h1>
        <p className="text-sm text-gray-500 mt-1">Arbitrage des reclamations acheteur/vendeur.</p>
      </div>

      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
        {disputes.length === 0 ? (
          <div className="p-12 text-center">
            <FiMessageSquare size={36} className="text-gray-600 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Aucun litige pour le moment.</p>
          </div>
        ) : disputes.map((dispute) => (
          <article key={dispute.id} className="p-4 border-b border-[#2a2a3a] last:border-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white font-semibold">Litige #{dispute.id} · {dispute.vendor_name}</p>
                <p className="text-xs text-gray-500">
                  {dispute.buyer_name} · Commande vendeur #{dispute.vendor_order} · {statusLabels[dispute.status] || dispute.status}
                </p>
              </div>
              <p className="text-sm text-[#D4AF37] whitespace-nowrap">
                {Number(dispute.frozen_amount).toLocaleString('fr-SN')} FCFA geles
              </p>
            </div>
            <p className="text-sm text-gray-400 mt-3">{dispute.reason} · {dispute.description || 'Sans details'}</p>
            {dispute.status !== 'RESOLVED' && (
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => openResolveDialog(dispute, 'REFUND')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm"
                >
                  <FiRefreshCcw size={14} />
                  Rembourser
                </button>
                <button
                  type="button"
                  onClick={() => openResolveDialog(dispute, 'NO_REFUND')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm"
                >
                  <FiCheckCircle size={14} />
                  Libérer vendeur
                </button>
              </div>
            )}
            {dispute.admin_note && <p className="text-xs text-gray-500 mt-3">Note : {dispute.admin_note}</p>}
          </article>
        ))}
      </div>

      {resolveDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold mb-1">
              {resolveDialog.resolution === 'REFUND' ? 'Rembourser l\'acheteur' : 'Libérer le vendeur'}
            </h3>
            <p className="text-gray-400 text-sm mb-4">Litige #{resolveDialog.dispute.id} — {resolveDialog.dispute.vendor_name}</p>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Note admin (optionnel)"
              rows={3}
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setResolveDialog(null)} className="flex-1 px-4 py-2 border border-[#2a2a3a] text-gray-400 hover:text-white rounded-lg text-sm transition">Annuler</button>
              <button
                onClick={resolve}
                className={`flex-1 px-4 py-2 font-semibold rounded-lg text-sm transition ${
                  resolveDialog.resolution === 'REFUND'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDisputesPage
