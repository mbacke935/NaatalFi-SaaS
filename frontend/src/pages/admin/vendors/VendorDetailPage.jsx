import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiCheck, FiSlash } from 'react-icons/fi'
import {
  adminGetVendor,
  adminApproveVendor,
  adminSuspendVendor,
} from '../../../services/vendors'

function VendorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vendor, setVendor]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing]   = useState(false)
  const [reason, setReason]   = useState('')

  useEffect(() => {
    adminGetVendor(id)
      .then(({ data }) => setVendor(data))
      .catch(() => { toast.error('Vendeur introuvable.'); navigate('/admin/vendors') })
      .finally(() => setLoading(false))
  }, [id])

  const handleApprove = async () => {
    setActing(true)
    try {
      const { data } = await adminApproveVendor(id)
      setVendor(data)
      toast.success('Vendeur approuvé. Email envoyé.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur.')
    } finally {
      setActing(false)
    }
  }

  const handleSuspend = async () => {
    if (!reason.trim()) { toast.error('Indiquez un motif de suspension.'); return }
    setActing(true)
    try {
      const { data } = await adminSuspendVendor(id, reason)
      setVendor(data)
      setReason('')
      toast.success('Vendeur suspendu.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur.')
    } finally {
      setActing(false)
    }
  }

  if (loading) return <p className="text-gray-400 text-sm">Chargement...</p>
  if (!vendor) return null

  const statusColor = {
    PENDING:   'text-yellow-400',
    APPROVED:  'text-green-400',
    SUSPENDED: 'text-red-400',
  }[vendor.status]

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate('/admin/vendors')}
        className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-6"
      >
        <FiArrowLeft size={14} /> Retour aux vendeurs
      </button>

      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {vendor.logo ? (
            <img src={vendor.logo} alt="" className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[#2a2a3a] flex items-center justify-center text-2xl font-bold text-gray-400">
              {vendor.name[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">{vendor.name}</h1>
            <p className="text-gray-400 text-sm">{vendor.user_email} · {vendor.user_name}</p>
            <p className={`text-sm font-medium mt-1 ${statusColor}`}>{vendor.status}</p>
          </div>
        </div>

        {vendor.description && (
          <p className="text-gray-400 text-sm mt-4">{vendor.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#2a2a3a]">
          <div>
            <p className="text-xs text-gray-500">Plan</p>
            <p className="text-white font-medium">{vendor.plan?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Trust score</p>
            <p className="text-white font-medium">{vendor.trust_score} / 5</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Inscrit le</p>
            <p className="text-white font-medium">
              {new Date(vendor.created_at).toLocaleDateString('fr-SN')}
            </p>
          </div>
          {vendor.phone && (
            <div>
              <p className="text-xs text-gray-500">Téléphone</p>
              <p className="text-white font-medium">{vendor.phone}</p>
            </div>
          )}
          {vendor.address && (
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500">Adresse</p>
              <p className="text-white font-medium">{vendor.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-6 space-y-4">
        <h2 className="text-white font-semibold">Actions KYC</h2>

        {vendor.status !== 'APPROVED' && (
          <button
            onClick={handleApprove}
            disabled={acting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            <FiCheck size={15} />
            {acting ? 'Traitement...' : 'Approuver ce vendeur'}
          </button>
        )}

        {vendor.status !== 'SUSPENDED' && (
          <div className="space-y-2">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motif de suspension (obligatoire)..."
              rows={2}
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-red-500 transition resize-none"
            />
            <button
              onClick={handleSuspend}
              disabled={acting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              <FiSlash size={15} />
              {acting ? 'Traitement...' : 'Suspendre ce vendeur'}
            </button>
          </div>
        )}

        {vendor.status === 'SUSPENDED' && (
          <p className="text-gray-500 text-sm">Ce vendeur est suspendu. Approuvez-le pour le réactiver.</p>
        )}
      </div>
    </div>
  )
}

export default VendorDetailPage
