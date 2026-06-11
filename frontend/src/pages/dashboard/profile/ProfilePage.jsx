import { useState } from 'react'
import toast from 'react-hot-toast'
import { FiCamera, FiMail, FiSave, FiShield, FiUser } from 'react-icons/fi'
import ImageUpload from '../../../components/ui/ImageUpload'
import { updateProfile, uploadAvatar } from '../../../services/account'
import useAuthStore from '../../../store/authStore'

function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    phone: user?.phone ?? '',
  })

  const inputCls = 'w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition'
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await updateProfile(form)
      let nextUser = data
      if (avatarFile) {
        const { data: avatarData } = await uploadAvatar(avatarFile)
        nextUser = { ...data, avatar: avatarData.avatar }
        setAvatarFile(null)
      }
      setUser(nextUser)
      toast.success('Profil mis a jour.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Profil vendeur</h1>
        <p className="text-sm text-gray-500 mt-1">Informations personnelles utilisees par votre compte vendeur.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <FiCamera className="text-[#D4AF37]" size={16} />
            Photo de profil
          </h2>
          <ImageUpload
            currentUrl={user?.avatar}
            onFile={setAvatarFile}
            label="Ajouter une photo"
            previewClassName="rounded-full"
          />
        </div>

        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <FiUser className="text-[#D4AF37]" size={16} />
            Informations personnelles
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prenom</label>
              <input value={form.first_name} onChange={set('first_name')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nom</label>
              <input value={form.last_name} onChange={set('last_name')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Telephone</label>
              <input value={form.phone} onChange={set('phone')} placeholder="+221 77 000 00 00" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-gray-600" size={15} />
                <input value={user?.email ?? ''} disabled className={`${inputCls} pl-9 opacity-50 cursor-not-allowed`} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5 flex items-start gap-3">
          <FiShield className="text-green-400 mt-0.5" size={18} />
          <div>
            <p className="text-sm text-white font-medium">Compte {user?.is_verified ? 'verifie' : 'non verifie'}</p>
            <p className="text-xs text-gray-500 mt-1">Le role et l'email sont controles par le compte principal.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#c49e30] text-black text-sm font-semibold rounded-xl transition disabled:opacity-50"
        >
          <FiSave size={15} />
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </button>
      </form>
    </div>
  )
}

export default ProfilePage
