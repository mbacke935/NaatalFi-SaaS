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

  const resolve = async (dispute, resolution) => {
    const note = window.prompt('Note admin', '') || ''
    try {
      await resolveAdminDispute(dispute.id, { resolution, note })
      toast.success('Litige resolu.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Resolution impossible.')
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
                  onClick={() => resolve(dispute, 'REFUND')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm"
                >
                  <FiRefreshCcw size={14} />
                  Rembourser
                </button>
                <button
                  type="button"
                  onClick={() => resolve(dispute, 'NO_REFUND')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm"
                >
                  <FiCheckCircle size={14} />
                  Liberer vendeur
                </button>
              </div>
            )}
            {dispute.admin_note && <p className="text-xs text-gray-500 mt-3">Note : {dispute.admin_note}</p>}
          </article>
        ))}
      </div>
    </div>
  )
}

export default AdminDisputesPage
