import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiPlus, FiMapPin, FiEdit2, FiTrash2, FiCheck, FiX, FiAlertTriangle } from 'react-icons/fi'
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../../services/account'
import { useMeta } from '../../hooks/useMeta'

const EMPTY = { label: 'Maison', full_name: '', phone: '', street: '', city: '', region: '', is_default: false }

function AddressForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.phone || !form.street || !form.city) {
      toast.error('Remplissez tous les champs obligatoires.')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  const field = (label, key, placeholder, required = true) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}{required && ' *'}</label>
      <input
        value={form[key]}
        onChange={set(key)}
        placeholder={placeholder}
        className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Étiquette</label>
        <select value={form.label} onChange={set('label')}
          className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition"
        >
          {['Maison', 'Travail', 'Famille', 'Autre'].map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>
      {field('Nom complet', 'full_name', 'Prénom et nom du destinataire')}
      {field('Téléphone', 'phone', '+221 77 000 00 00')}
      {field('Adresse', 'street', 'Rue, quartier, point de repère')}
      <div className="grid grid-cols-2 gap-3">
        {field('Ville', 'city', 'Dakar')}
        {field('Région', 'region', 'Dakar', false)}
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
        <input type="checkbox" checked={form.is_default} onChange={set('is_default')} className="accent-[#D4AF37]" />
        Définir comme adresse par défaut
      </label>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#c49e30] text-black text-sm font-semibold rounded-lg transition disabled:opacity-50"
        >
          <FiCheck size={14} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button type="button" onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 border border-[#2a2a3a] text-gray-400 hover:text-white text-sm rounded-lg transition"
        >
          <FiX size={14} /> Annuler
        </button>
      </div>
    </form>
  )
}

function AccountAddressesPage() {
  useMeta({ title: 'Mes adresses' })

  const [addresses, setAddresses] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = () => {
    setLoading(true)
    getAddresses()
      .then(({ data }) => setAddresses(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (form) => {
    await createAddress(form)
    toast.success('Adresse ajoutée.')
    setShowForm(false)
    load()
  }

  const handleUpdate = async (form) => {
    await updateAddress(editing.id, form)
    toast.success('Adresse mise à jour.')
    setEditing(null)
    load()
  }

  const handleDelete = async (id) => {
    try {
      await deleteAddress(id)
      toast.success('Adresse supprimée.')
      setConfirmDelete(null)
      load()
    } catch {
      toast.error('Impossible de supprimer cette adresse.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Mes adresses</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37] hover:bg-[#c49e30] text-black text-sm font-semibold rounded-lg transition"
          >
            <FiPlus size={14} /> Ajouter
          </button>
        )}
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="bg-[#16161E] border border-[#D4AF37]/30 rounded-xl p-5 mb-5">
          <h2 className="text-sm font-semibold text-white mb-4">Nouvelle adresse</h2>
          <AddressForm initial={EMPTY} onSave={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Confirmation suppression */}
      {confirmDelete && (
        <div className="bg-red-900/15 border border-red-500/30 rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <FiAlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-sm text-red-300 flex-1">Supprimer cette adresse ? Cette action est irréversible.</p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 text-sm border border-[#2a2a3a] text-gray-400 hover:text-white rounded-lg transition">
              Annuler
            </button>
            <button onClick={() => handleDelete(confirmDelete)} className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
              Supprimer
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-16 text-center">
          <FiMapPin size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">Aucune adresse enregistrée.</p>
          <button onClick={() => setShowForm(true)} className="text-[#D4AF37] hover:underline text-sm">
            Ajouter une adresse →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-4">
              {editing?.id === addr.id ? (
                <AddressForm
                  initial={{ label: addr.label, full_name: addr.full_name, phone: addr.phone, street: addr.street, city: addr.city, region: addr.region, is_default: addr.is_default }}
                  onSave={handleUpdate}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <FiMapPin size={16} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white font-medium text-sm">{addr.label}</span>
                        {addr.is_default && (
                          <span className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-1.5 py-0.5 rounded">Par défaut</span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm">{addr.full_name} · {addr.phone}</p>
                      <p className="text-gray-500 text-xs">{addr.street}, {addr.city}{addr.region ? `, ${addr.region}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setEditing(addr)} className="p-1.5 text-gray-500 hover:text-white transition">
                      <FiEdit2 size={14} />
                    </button>
                    <button onClick={() => setConfirmDelete(addr.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AccountAddressesPage
