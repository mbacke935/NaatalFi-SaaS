// PHASE_FUTURE_3: Litiges — décommenter le bloc ci-dessous et supprimer ce composant
import { FiMail, FiMessageCircle } from 'react-icons/fi'

function DisputesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Litiges</h1>
        <p className="text-sm text-gray-500 mt-1">Signalez un problème avec une commande.</p>
      </div>

      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-8 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mx-auto mb-5">
          <FiMessageCircle size={26} className="text-[#D4AF37]" />
        </div>
        <h2 className="text-white font-semibold text-lg mb-2">Contactez notre équipe</h2>
        <p className="text-gray-400 text-sm mb-6">
          Pour tout litige ou réclamation sur une commande, notre équipe est disponible pour vous aider rapidement.
        </p>
        <div className="space-y-3">
          <a
            href="https://wa.me/221777000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition"
          >
            <FiMessageCircle size={18} />
            WhatsApp — Réponse rapide
          </a>
          <a
            href="mailto:support@naatalfi.sn"
            className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl border border-[#2a2a3a] text-gray-300 hover:text-white hover:border-[#D4AF37]/40 font-medium text-sm transition"
          >
            <FiMail size={18} />
            support@naatalfi.sn
          </a>
        </div>
        <p className="text-xs text-gray-600 mt-5">
          Précisez votre numéro de commande pour un traitement prioritaire.
        </p>
      </div>
    </div>
  )
}

export default DisputesPage

/* =====================================================================
   CODE ORIGINAL DisputesPage — PHASE FUTURE 3 (décommenter pour réactiver)
   =====================================================================

import { useEffect, useMemo, useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiMessageSquare } from 'react-icons/fi'
import { getVendorDisputes } from '../../../services/disputes'

const statusLabels = {
  OPEN: 'Ouvert',
  UNDER_REVIEW: 'En revue',
  RESOLVED: 'Resolu',
  CLOSED: 'Ferme',
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
              <div>
                <p className="text-white font-semibold">Litige #{dispute.id} · Commande vendeur #{dispute.vendor_order}</p>
                <p className="text-xs text-gray-500">{dispute.buyer_name} · {dispute.reason}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-yellow-900/30 text-yellow-300">
                {statusLabels[dispute.status] || dispute.status}
              </span>
            </div>
            {dispute.description && <p className="text-sm text-gray-400 mt-3">{dispute.description}</p>}
            <p className="text-xs text-gray-600 mt-3">
              Montant gele : {Number(dispute.frozen_amount).toLocaleString('fr-SN')} FCFA
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}

export default DisputesPage

===================================================================== */
