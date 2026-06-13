import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiMail, FiRefreshCw } from 'react-icons/fi'
import { getAdminEmailLogs, retryAdminEmailLog } from '../../../services/admin'

const FILTERS = ['', 'PENDING', 'SENDING', 'SENT', 'FAILED']

const STATUS_COLORS = {
  PENDING: 'bg-yellow-900/40 text-yellow-400',
  SENDING: 'bg-blue-900/40 text-blue-400',
  SENT: 'bg-green-900/40 text-green-400',
  FAILED: 'bg-red-900/40 text-red-400',
}

const STATUS_LABELS = {
  PENDING: 'En attente',
  SENDING: 'Envoi',
  SENT: 'Envoye',
  FAILED: 'Echoue',
}

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

function EmailsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || ''
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(initialStatus)
  const [retryingId, setRetryingId] = useState(null)

  const load = (nextStatus = status) => {
    setLoading(true)
    getAdminEmailLogs(nextStatus ? { status: nextStatus } : {})
      .then(({ data }) => setEmails(Array.isArray(data) ? data : []))
      .catch(() => setEmails([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const nextStatus = searchParams.get('status') || ''
    setStatus(nextStatus)
    load(nextStatus)
  }, [searchParams])

  const handleFilter = (nextStatus) => {
    setStatus(nextStatus)
    setSearchParams(nextStatus ? { status: nextStatus } : {})
  }

  const handleRetry = async (email) => {
    if (!window.confirm(`Relancer l'email vers ${email.to_email} ?`)) return
    setRetryingId(email.id)
    try {
      await retryAdminEmailLog(email.id)
      toast.success('Email remis en file. Le cron va le traiter.')
      load(status)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Impossible de relancer cet email.')
    } finally {
      setRetryingId(null)
    }
  }

  const failedCount = emails.filter((email) => email.status === 'FAILED').length

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Emails</h1>
          <p className="text-sm text-gray-500 mt-1">Suivi des emails transactionnels envoyes par le cron.</p>
        </div>
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Echecs affiches</p>
          <p className="text-lg text-red-400 font-bold">{failedCount}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map((filter) => (
          <button
            key={filter || 'ALL'}
            type="button"
            onClick={() => handleFilter(filter)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              status === filter
                ? 'bg-[#D4AF37] text-black'
                : 'bg-[#16161E] text-gray-400 border border-[#2a2a3a] hover:border-[#D4AF37]'
            }`}
          >
            {filter ? STATUS_LABELS[filter] : 'Tous'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-16 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : emails.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
          <FiMail className="text-gray-600 mx-auto mb-3" size={32} />
          <p className="text-sm text-gray-500">Aucun email trouve.</p>
        </div>
      ) : (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1080px]">
              <thead>
                <tr className="border-b border-[#2a2a3a] text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Destinataire</th>
                  <th className="text-left px-4 py-3">Sujet</th>
                  <th className="text-left px-4 py-3">Statut</th>
                  <th className="text-left px-4 py-3">Tentatives</th>
                  <th className="text-left px-4 py-3">Planifie</th>
                  <th className="text-left px-4 py-3">Envoye</th>
                  <th className="text-left px-4 py-3">Erreur</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((email) => (
                  <tr key={email.id} className="border-b border-[#2a2a3a] last:border-0 hover:bg-white/5">
                    <td className="px-4 py-3 text-white">{email.to_email}</td>
                    <td className="px-4 py-3 text-gray-300">
                      <div className="font-medium">{email.subject}</div>
                      <div className="text-xs text-gray-600 max-w-[300px] truncate" title={email.message_preview}>
                        {email.message_preview || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[email.status] ?? 'bg-gray-800 text-gray-400'}`}>
                        {STATUS_LABELS[email.status] || email.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{email.attempts}/{email.max_attempts}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(email.scheduled_at)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(email.sent_at)}</td>
                    <td className="px-4 py-3 text-red-300 max-w-[340px] truncate" title={email.last_error || '-'}>
                      {email.last_error || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {email.status === 'FAILED' ? (
                        <button
                          type="button"
                          onClick={() => handleRetry(email)}
                          disabled={retryingId === email.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF37]/15 px-3 py-1.5 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/25 disabled:opacity-50"
                        >
                          <FiRefreshCw size={13} /> Relancer
                        </button>
                      ) : (
                        <span className="text-gray-700">-</span>
                      )}
                    </td>
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

export default EmailsPage
