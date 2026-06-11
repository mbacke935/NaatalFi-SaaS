import { useState } from 'react'
import toast from 'react-hot-toast'
import { FiUser, FiCamera, FiSave } from 'react-icons/fi'
import useAuthStore      from '../../store/authStore'
import { updateProfile } from '../../services/account'
import { useMeta }       from '../../hooks/useMeta'

function AccountSettingsPage() {
  useMeta({ title: 'Paramètres du compte' })

  const { user, setUser }   = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState({
    first_name: user?.first_name ?? '',
    last_name:  user?.last_name  ?? '',
    phone:      user?.phone      ?? '',
    avatar:     user?.avatar     ?? '',
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await updateProfile(form)
      setUser(data)
      toast.success('Profil mis à jour.')
    } catch {
      toast.error('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition'

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Paramètres du compte</h1>

      <form onSubmit={handleSave} className="space-y-6 max-w-lg">

        {/* Avatar */}
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <FiCamera size={15} className="text-[#D4AF37]" /> Photo de profil
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex-shrink-0 overflow-hidden">
              {form.avatar
                ? <img src={form.avatar} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[#D4AF37] font-bold text-xl">
                    {user?.first_name?.[0] ?? '?'}
                  </div>
              }
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">URL de l'avatar</label>
              <input
                type="url"
                value={form.avatar}
                onChange={set('avatar')}
                placeholder="https://..."
                className={inputCls}
              />
              <p className="text-xs text-gray-600 mt-1">Copiez l'URL d'une image hébergée (Supabase, Imgur…)</p>
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <FiUser size={15} className="text-[#D4AF37]" /> Informations personnelles
          </h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Prénom</label>
                <input value={form.first_name} onChange={set('first_name')} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nom</label>
                <input value={form.last_name} onChange={set('last_name')} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
              <input value={form.phone} onChange={set('phone')} placeholder="+221 77 000 00 00" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input value={user?.email ?? ''} disabled className={`${inputCls} opacity-40 cursor-not-allowed`} />
              <p className="text-xs text-gray-600 mt-1">L'email ne peut pas être modifié.</p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#c49e30] text-black text-sm font-semibold rounded-xl transition disabled:opacity-50"
        >
          <FiSave size={15} />
          {saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
        </button>
      </form>
    </div>
  )
}

export default AccountSettingsPage
