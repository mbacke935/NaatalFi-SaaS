import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  FiTruck, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck,
  FiMapPin, FiToggleLeft, FiToggleRight,
} from 'react-icons/fi'
import {
  SENEGAL_REGIONS,
  getShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
} from '../../../services/shipping'

const fmt = (n) => Number(n ?? 0).toLocaleString('fr-SN') + ' FCFA'

const EMPTY_FORM = {
  name: '',
  regions: [],
  price: '',
  estimated_days: '2',
  min_weight: '',
  max_weight: '',
}

function ZoneModal({ zone, onClose, onSave }) {
  const editing = !!zone
  const [form, setForm] = useState(
    zone
      ? {
          name: zone.name,
          regions: zone.regions ?? [],
          price: zone.rates?.[0]?.price ?? '',
          estimated_days: String(zone.rates?.[0]?.estimated_days ?? 2),
          min_weight: zone.rates?.[0]?.min_weight ?? '',
          max_weight: zone.rates?.[0]?.max_weight ?? '',
        }
      : { ...EMPTY_FORM }
  )
  const [saving, setSaving] = useState(false)

  const toggle = (r) =>
    setForm((f) => ({
      ...f,
      regions: f.regions.includes(r) ? f.regions.filter((x) => x !== r) : [...f.regions, r],
    }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Nom de zone requis.')
    if (!form.regions.length) return toast.error('Sélectionnez au moins une région.')
    const price = parseFloat(form.price)
    if (isNaN(price) || price < 0) return toast.error('Tarif invalide.')
    const days = parseInt(form.estimated_days)
    const minWeight = form.min_weight === '' ? null : parseFloat(form.min_weight)
    const maxWeight = form.max_weight === '' ? null : parseFloat(form.max_weight)
    if (minWeight !== null && (isNaN(minWeight) || minWeight < 0)) return toast.error('Poids minimum invalide.')
    if (maxWeight !== null && (isNaN(maxWeight) || maxWeight < 0)) return toast.error('Poids maximum invalide.')
    if (minWeight !== null && maxWeight !== null && maxWeight < minWeight) {
      return toast.error('Le poids maximum doit etre superieur au poids minimum.')
    }
    if (isNaN(days) || days < 1) return toast.error('Délai invalide.')

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        regions: form.regions,
        price,
        estimated_days: days,
        min_weight: minWeight,
        max_weight: maxWeight,
      }
      if (editing) {
        const { data } = await updateShippingZone(zone.id, payload)
        onSave(data, true)
      } else {
        const { data } = await createShippingZone(payload)
        onSave(data, false)
      }
      toast.success(editing ? 'Zone mise à jour.' : 'Zone créée.')
      onClose()
    } catch {
      toast.error('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold text-white">
            {editing ? 'Modifier la zone' : 'Nouvelle zone de livraison'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Nom de la zone</label>
            <input
              type="text" required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="ex: Livraison Dakar, Hors Dakar…"
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">
              Régions couvertes <span className="text-gray-600 normal-case">({form.regions.length} sélectionnée{form.regions.length !== 1 ? 's' : ''})</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SENEGAL_REGIONS.map((r) => {
                const selected = form.regions.includes(r)
                return (
                  <button
                    key={r} type="button"
                    onClick={() => toggle(r)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${
                      selected
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                        : 'border-[#2a2a3a] text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {selected && <FiCheck className="inline mr-1" size={10} />}
                    {r}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Tarif (FCFA)</label>
              <input
                type="number" min="0" step="100" required
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="ex: 2000"
                className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Délai (jours)</label>
              <input
                type="number" min="1" max="60" required
                value={form.estimated_days}
                onChange={(e) => setForm((f) => ({ ...f, estimated_days: e.target.value }))}
                className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Poids min. (kg)</label>
              <input
                type="number" min="0" step="0.1"
                value={form.min_weight}
                onChange={(e) => setForm((f) => ({ ...f, min_weight: e.target.value }))}
                placeholder="optionnel"
                className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Poids max. (kg)</label>
              <input
                type="number" min="0" step="0.1"
                value={form.max_weight}
                onChange={(e) => setForm((f) => ({ ...f, max_weight: e.target.value }))}
                placeholder="optionnel"
                className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <button
            type="submit" disabled={saving}
            className="w-full bg-[#D4AF37] hover:bg-[#c49e30] disabled:opacity-50 text-black font-semibold py-2.5 rounded-lg transition mt-2"
          >
            {saving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer la zone'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function DeliveryPage() {
  const [zones,   setZones]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = () => {
    setLoading(true)
    getShippingZones()
      .then(({ data }) => setZones(data))
      .catch(() => toast.error('Impossible de charger les zones.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSave = (zone, isEdit) => {
    if (isEdit) {
      setZones((prev) => prev.map((z) => (z.id === zone.id ? zone : z)))
    } else {
      setZones((prev) => [...prev, zone])
    }
  }

  const handleDelete = async (zone) => {
    try {
      await deleteShippingZone(zone.id)
      setZones((prev) => prev.filter((z) => z.id !== zone.id))
      setConfirmDelete(null)
      toast.success('Zone supprimée.')
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  const handleToggle = async (zone) => {
    try {
      const { data } = await updateShippingZone(zone.id, { is_active: !zone.is_active })
      setZones((prev) => prev.map((z) => (z.id === zone.id ? data : z)))
      toast.success(data.is_active ? 'Zone activée.' : 'Zone désactivée.')
    } catch {
      toast.error('Erreur.')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
            <FiTruck className="text-[#D4AF37]" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Livraison</h1>
            <p className="text-xs text-gray-500">Configurez vos zones et tarifs de livraison</p>
          </div>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold px-5 py-2.5 rounded-lg transition text-sm"
        >
          <FiPlus size={16} />
          Nouvelle zone
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : zones.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-16 text-center">
          <FiMapPin size={40} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 font-medium mb-1">Aucune zone configurée</p>
          <p className="text-gray-600 text-sm mb-6">
            Créez vos zones de livraison pour définir vos tarifs par région.
          </p>
          <button
            onClick={() => setModal('new')}
            className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold px-5 py-2.5 rounded-lg transition text-sm"
          >
            <FiPlus size={15} />
            Créer ma première zone
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zone) => {
            const rate = zone.rates?.[0]
            return (
              <div
                key={zone.id}
                className={`bg-[#16161E] border rounded-xl p-5 transition ${
                  zone.is_active ? 'border-[#2a2a3a]' : 'border-[#2a2a3a] opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-white">{zone.name}</h3>
                      {!zone.is_active && (
                        <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                          Désactivée
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(zone.regions ?? []).map((r) => (
                        <span key={r} className="text-xs bg-[#0B0B0F] border border-[#2a2a3a] text-gray-300 px-2 py-0.5 rounded-full">
                          {r}
                        </span>
                      ))}
                    </div>
                    {rate && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-[#D4AF37] font-semibold">{fmt(rate.price)}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">{rate.estimated_days} jour{rate.estimated_days !== 1 ? 's' : ''}</span>
                        {(rate.min_weight || rate.max_weight) && (
                          <>
                            <span className="text-gray-500">-</span>
                            <span className="text-gray-400">
                              {rate.min_weight ?? 0} - {rate.max_weight ?? 'max'} kg
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(zone)}
                      className="text-gray-400 hover:text-white transition p-1"
                      title={zone.is_active ? 'Désactiver' : 'Activer'}
                    >
                      {zone.is_active
                        ? <FiToggleRight size={22} className="text-green-400" />
                        : <FiToggleLeft size={22} />
                      }
                    </button>
                    <button
                      onClick={() => setModal(zone)}
                      className="text-gray-400 hover:text-white transition p-1"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(zone)}
                      className="text-gray-400 hover:text-red-400 transition p-1"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal !== null && (
        <ZoneModal
          zone={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold mb-2">Supprimer la zone de livraison ?</h3>
            <p className="text-gray-400 text-sm mb-5">
              "<span className="text-white">{confirmDelete.name}</span>" sera définitivement supprimée.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-[#2a2a3a] text-gray-400 hover:text-white rounded-lg text-sm transition">Annuler</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
