import { useEffect, useMemo, useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiMessageSquare } from 'react-icons/fi'
import { getVendorDisputes } from '../../../services/disputes'

const statusLabels = {
  OPEN: 'Ouvert',
  UNDER_REVIEW: 'En revue',
  RESOLVED: 'Resolu',
  CLOSED: 'Ferme',
}

const reasonLabels = {
  ITEM_NOT_RECEIVED: 'Article non recu',
  DAMAGED_ITEM: 'Article endommage',
  WRONG_ITEM: 'Mauvais article',
  OTHER: 'Autre',
}

function DisputesPage() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getVendorDisputes()
      .then(({ data }) => setDisputes(Array.isArray(data) ? data : []))
      .catch(() => setDisputes([]))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => ({
    open: disputes.filter((item) => item.status === 'OPEN').length,
    review: disputes.filter((item) => item.status === 'UNDER_REVIEW').length,
    resolved: disputes.filter((item) => item.status === 'RESOLVED').length,
  }), [disputes])

  if (loading) {
    return <div className="h-40 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Litiges</h1>
        <p className="text-sm text-gray-500 mt-1">Suivi des reclamations et arbitrages vendeur.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Ouverts', value: stats.open, icon: FiAlertCircle, tone: 'text-yellow-400' },
          { label: 'En revue', value: stats.review, icon: FiMessageSquare, tone: 'text-blue-400' },
          { label: 'Resolus', value: stats.resolved, icon: FiCheckCircle, tone: 'text-green-400' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
                <Icon className={item.tone} size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{item.value}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
        {disputes.length === 0 ? (
          <div className="p-12 text-center">
            <FiMessageSquare size={36} className="text-gray-600 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Aucun litige en cours.</p>
          </div>
        ) : disputes.map((dispute) => (
          <article key={dispute.id} className="p-4 border-b border-[#2a2a3a] last:border-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-white font-semibold">
                  Litige #{dispute.id} - Commande vendeur #{dispute.vendor_order}
                </p>
                <p className="text-xs text-gray-500">
                  {dispute.buyer_name} - {reasonLabels[dispute.reason] || dispute.reason}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-yellow-900/30 text-yellow-300 whitespace-nowrap">
                {statusLabels[dispute.status] || dispute.status}
              </span>
            </div>
            {dispute.description && <p className="text-sm text-gray-400 mt-3">{dispute.description}</p>}
            <p className="text-xs text-gray-600 mt-3">
              Montant gele : {Number(dispute.frozen_amount).toLocaleString('fr-SN')} FCFA
            </p>
            {dispute.admin_note && (
              <p className="text-xs text-gray-500 mt-2">Note admin : {dispute.admin_note}</p>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

export default DisputesPage
