import { useEffect, useState } from 'react'
import { FiCheck, FiTrash2, FiX, FiUsers } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { deleteAdminUser, getAdminUsers, updateAdminUser } from '../../../services/admin'

const ROLE_COLORS = {
  ADMIN:    'bg-red-900/40 text-red-400',
  VENDOR:   'bg-purple-900/40 text-purple-400',
  CUSTOMER: 'bg-blue-900/40 text-blue-400',
}

const ROLE_LABELS = {
  ADMIN: 'Admin', VENDOR: 'Vendeur', CUSTOMER: 'Client',
}

const FILTERS = [
  { value: '',         label: 'Tous' },
  { value: 'VENDOR',   label: 'Vendeurs' },
  { value: 'CUSTOMER', label: 'Clients' },
  { value: 'ADMIN',    label: 'Admins' },
]

function UsersPage() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [role, setRole]     = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [acting, setActing] = useState(false)

  const load = (r = role) => {
    setLoading(true)
    getAdminUsers(r ? { role: r } : {})
      .then(({ data }) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleFilter = (r) => {
    setRole(r)
    load(r)
  }

  const patchUser = async (id, data) => {
    try {
      await updateAdminUser(id, data)
      toast.success('Utilisateur mis a jour.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur.')
    }
  }

  const removeUser = async () => {
    if (!confirmDelete) return
    setActing(true)
    try {
      await deleteAdminUser(confirmDelete.id)
      toast.success('Utilisateur supprime.')
      setConfirmDelete(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Suppression impossible.')
    } finally {
      setActing(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
        <p className="text-sm text-gray-500 mt-1">Tous les comptes inscrits sur la plateforme.</p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilter(f.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              role === f.value
                ? 'bg-[#D4AF37] text-black'
                : 'bg-[#16161E] text-gray-400 border border-[#2a2a3a] hover:border-[#D4AF37]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-14 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
          <FiUsers className="text-gray-600 mx-auto mb-3" size={32} />
          <p className="text-sm text-gray-500">Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead>
              <tr className="border-b border-[#2a2a3a] text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Nom</th>
                <th className="text-left px-4 py-3">Rôle</th>
                <th className="text-left px-4 py-3">Vérifié</th>
                <th className="text-left px-4 py-3">Actif</th>
                <th className="text-left px-4 py-3">Inscription</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#2a2a3a] last:border-0 hover:bg-white/5">
                  <td className="px-4 py-3 text-white font-medium">{u.email}</td>
                  <td className="px-4 py-3 text-gray-300">{u.full_name || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => patchUser(u.id, { role: e.target.value })}
                      className={`text-xs px-2 py-1 rounded bg-[#0B0B0F] border border-[#2a2a3a] ${ROLE_COLORS[u.role] ?? 'text-gray-400'}`}
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_verified
                      ? <FiCheck className="text-green-400" size={15} />
                      : <FiX className="text-red-400" size={15} />}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active
                      ? <FiCheck className="text-green-400" size={15} />
                      : <FiX className="text-red-400" size={15} />}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.date_joined).toLocaleDateString('fr-SN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => patchUser(u.id, { is_active: !u.is_active })}
                        className={`text-xs px-2 py-1 rounded border transition ${
                          u.is_active
                            ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                            : 'border-green-500/40 text-green-400 hover:bg-green-500/10'
                        }`}
                      >
                        {u.is_active ? 'Desactiver' : 'Activer'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(u)}
                        className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                        title="Supprimer"
                        aria-label="Supprimer utilisateur"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="px-4 py-2.5 border-t border-[#2a2a3a] text-xs text-gray-600">
            {users.length} utilisateur{users.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold mb-2">Supprimer cet utilisateur ?</h3>
            <p className="text-gray-400 text-sm mb-1">
              Cette action supprimera definitivement :
            </p>
            <p className="text-white text-sm font-medium break-all mb-5">{confirmDelete.email}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={acting}
                className="flex-1 px-4 py-2 border border-[#2a2a3a] text-gray-400 hover:text-white rounded-lg text-sm transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={removeUser}
                disabled={acting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50"
              >
                {acting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage
