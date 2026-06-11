import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiCheck, FiClock, FiAlertTriangle, FiEye } from 'react-icons/fi'
import { adminGetVendors } from '../../../services/vendors'

const STATUS = {
  PENDING:   { label: 'En attente', color: 'bg-yellow-500/20 text-yellow-400', icon: FiClock },
  APPROVED:  { label: 'Approuvé',   color: 'bg-green-500/20 text-green-400',   icon: FiCheck },
  SUSPENDED: { label: 'Suspendu',   color: 'bg-red-500/20 text-red-400',       icon: FiAlertTriangle },
}

function VendorsPage() {
  const [vendors, setVendors]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('')

  const load = (f = filter) => {
    setLoading(true)
    adminGetVendors(f)
      .then(({ data }) => setVendors(data))
      .catch(() => toast.error('Erreur lors du chargement.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleFilter = (f) => {
    setFilter(f)
    load(f)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Vendeurs</h1>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {['', 'PENDING', 'APPROVED', 'SUSPENDED'].map((f) => (
          <button
            key={f}
            onClick={() => handleFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition
              ${filter === f
                ? 'bg-[#D4AF37] text-black'
                : 'bg-[#16161E] text-gray-400 border border-[#2a2a3a] hover:border-[#D4AF37]'}`}
          >
            {f === ''          ? 'Tous'        :
             f === 'PENDING'   ? 'En attente'  :
             f === 'APPROVED'  ? 'Approuvés'   : 'Suspendus'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Chargement...</p>
      ) : vendors.length === 0 ? (
        <p className="text-gray-400 text-sm">Aucun vendeur trouvé.</p>
      ) : (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a] text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Boutique</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Plan</th>
                <th className="text-left px-4 py-3">Statut</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => {
                const s = STATUS[vendor.status]
                const Icon = s.icon
                return (
                  <tr key={vendor.id} className="border-b border-[#2a2a3a] hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {vendor.logo ? (
                          <img src={vendor.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[#2a2a3a] flex items-center justify-center text-gray-500 text-xs font-bold">
                            {vendor.name[0].toUpperCase()}
                          </div>
                        )}
                        <span className="text-white font-medium">{vendor.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{vendor.user_email}</td>
                    <td className="px-4 py-3 text-gray-300">{vendor.plan?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
                        <Icon size={11} /> {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(vendor.created_at).toLocaleDateString('fr-SN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/vendors/${vendor.id}`}
                        className="inline-flex items-center gap-1 text-[#D4AF37] hover:underline text-xs"
                      >
                        <FiEye size={13} /> Voir
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default VendorsPage
