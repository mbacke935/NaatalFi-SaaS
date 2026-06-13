import { useEffect, useState } from 'react'
import { FiActivity, FiFilter, FiShield } from 'react-icons/fi'
import { getAdminAuditLogs } from '../../../services/admin'

const ACTION_LABELS = {
  PLATFORM_SETTINGS_UPDATED: 'Parametres plateforme',
  PLATFORM_COMMISSION_UPDATED: 'Commission modifiee',
  PLATFORM_PAYOUT_ACCOUNT_UPDATED: 'Coordonnees versement',
  USER_UPDATED: 'Utilisateur modifie',
  USER_DELETED: 'Utilisateur supprime',
  VENDOR_APPROVED: 'Vendeur approuve',
  VENDOR_SUSPENDED: 'Vendeur suspendu',
  PAYOUT_APPROVED: 'Retrait approuve',
  PAYOUT_REJECTED: 'Retrait rejete',
  EMAIL_RETRY_REQUESTED: 'Email relance',
}

const ACTION_FILTERS = [
  '',
  'PLATFORM_COMMISSION_UPDATED',
  'PLATFORM_PAYOUT_ACCOUNT_UPDATED',
  'USER_UPDATED',
  'USER_DELETED',
  'VENDOR_APPROVED',
  'VENDOR_SUSPENDED',
  'PAYOUT_APPROVED',
  'PAYOUT_REJECTED',
  'EMAIL_RETRY_REQUESTED',
]

const TARGET_FILTERS = ['', 'PlatformSettings', 'PlatformPayoutAccount', 'CustomUser', 'Vendor', 'PayoutRequest', 'EmailLog']

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('fr-SN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function metadataSummary(metadata = {}) {
  if (!metadata || Object.keys(metadata).length === 0) return '-'
  if (metadata.before !== undefined && metadata.after !== undefined) {
    return `${metadata.before} -> ${metadata.after}`
  }
  if (Array.isArray(metadata.changed_fields)) {
    return metadata.changed_fields.join(', ')
  }
  return Object.entries(metadata)
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
    .join(' | ')
}

function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [targetType, setTargetType] = useState('')

  const load = () => {
    setLoading(true)
    const params = {
      ...(action ? { action } : {}),
      ...(targetType ? { target_type: targetType } : {}),
    }
    getAdminAuditLogs(params)
      .then(({ data }) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [action, targetType])

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit admin</h1>
          <p className="text-sm text-gray-500 mt-1">Journal des actions sensibles effectuees par les administrateurs.</p>
        </div>
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Entrees affichees</p>
          <p className="text-lg text-[#D4AF37] font-bold">{logs.length}</p>
        </div>
      </div>

      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-4 mb-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
          <FiFilter size={15} /> Filtres
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-gray-500 mb-1.5 block">Action</span>
            <select
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            >
              {ACTION_FILTERS.map((item) => (
                <option key={item || 'ALL'} value={item}>{item ? (ACTION_LABELS[item] || item) : 'Toutes les actions'}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-gray-500 mb-1.5 block">Cible</span>
            <select
              value={targetType}
              onChange={(event) => setTargetType(event.target.value)}
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            >
              {TARGET_FILTERS.map((item) => (
                <option key={item || 'ALL'} value={item}>{item || 'Toutes les cibles'}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-16 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
          <FiShield className="text-gray-600 mx-auto mb-3" size={32} />
          <p className="text-sm text-gray-500">Aucune entree d'audit trouvee.</p>
        </div>
      ) : (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[980px]">
              <thead>
                <tr className="border-b border-[#2a2a3a] text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Admin</th>
                  <th className="text-left px-4 py-3">Action</th>
                  <th className="text-left px-4 py-3">Cible</th>
                  <th className="text-left px-4 py-3">Details</th>
                  <th className="text-left px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#2a2a3a] last:border-0 hover:bg-white/5">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3 text-white">{log.actor_email || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D4AF37]/10 px-2 py-1 text-xs font-semibold text-[#D4AF37]">
                        <FiActivity size={12} /> {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      <div className="font-medium">{log.target_repr || log.target_type || '-'}</div>
                      {(log.target_type || log.target_id) && (
                        <div className="text-xs text-gray-600">{log.target_type} #{log.target_id}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-[320px] truncate" title={metadataSummary(log.metadata)}>
                      {metadataSummary(log.metadata)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditLogsPage
