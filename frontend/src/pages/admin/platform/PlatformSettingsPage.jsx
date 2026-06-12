import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok } from 'react-icons/fa'
import { FiGlobe, FiImage, FiMail, FiPhone, FiSave } from 'react-icons/fi'
import { getAdminPlatformSettings, updateAdminPlatformSettings } from '../../../services/platform'

const inputCls = 'w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition'

function Field({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500 mb-1.5 flex items-center gap-2">
        <Icon size={13} /> {label}
      </span>
      {children}
    </label>
  )
}

function PlatformSettingsPage() {
  const [form, setForm] = useState({
    contact_email: '',
    phone_number: '',
    facebook_url: '',
    instagram_url: '',
    tiktok_url: '',
    linkedin_url: '',
    hero_image_url: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAdminPlatformSettings()
      .then(({ data }) => {
        setForm({
          contact_email: data.contact_email || '',
          phone_number: data.phone_number || '',
          facebook_url: data.facebook_url || '',
          instagram_url: data.instagram_url || '',
          tiktok_url: data.tiktok_url || '',
          linkedin_url: data.linkedin_url || '',
          hero_image_url: data.hero_image_url || '',
        })
      })
      .catch(() => toast.error('Impossible de charger les informations plateforme.'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (event) => {
    setForm((state) => ({ ...state, [event.target.name]: event.target.value }))
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await updateAdminPlatformSettings(form)
      toast.success('Informations publiques mises a jour.')
    } catch (err) {
      const data = err.response?.data
      const firstError = data && typeof data === 'object'
        ? Object.values(data).flat().join(' ')
        : null
      toast.error(firstError || 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="h-64 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Plateforme</h1>
        <p className="text-sm text-gray-500 mt-1">Informations publiques affichees dans le footer.</p>
      </div>

      <form onSubmit={save} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5 space-y-5 max-w-3xl">
        <div className="grid md:grid-cols-2 gap-4">
          <Field icon={FiMail} label="Email public">
            <input type="email" name="contact_email" value={form.contact_email} onChange={handleChange} placeholder="contact@naatalfi.com" className={inputCls} />
          </Field>
          <Field icon={FiPhone} label="Numero public">
            <input name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="+221 77 000 00 00" className={inputCls} />
          </Field>
          <Field icon={FaFacebookF} label="Facebook">
            <input name="facebook_url" value={form.facebook_url} onChange={handleChange} placeholder="https://facebook.com/..." className={inputCls} />
          </Field>
          <Field icon={FaInstagram} label="Instagram">
            <input name="instagram_url" value={form.instagram_url} onChange={handleChange} placeholder="https://instagram.com/..." className={inputCls} />
          </Field>
          <Field icon={FaTiktok} label="TikTok">
            <input name="tiktok_url" value={form.tiktok_url} onChange={handleChange} placeholder="https://www.tiktok.com/@..." className={inputCls} />
          </Field>
          <Field icon={FaLinkedinIn} label="LinkedIn">
            <input name="linkedin_url" value={form.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/company/..." className={inputCls} />
          </Field>
          <div className="md:col-span-2">
            <Field icon={FiImage} label="Image du hero de la page d'accueil">
              <input name="hero_image_url" value={form.hero_image_url} onChange={handleChange} placeholder="https://..." className={inputCls} />
            </Field>
            {form.hero_image_url && (
              <div className="mt-3 aspect-[16/6] rounded-lg overflow-hidden border border-[#2a2a3a] bg-[#0B0B0F]">
                <img src={form.hero_image_url} alt="Apercu hero" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-[#2a2a3a]">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <FiGlobe size={14} /> Ces informations sont visibles par tous les visiteurs.
          </p>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold text-sm transition disabled:opacity-50">
            <FiSave size={15} /> Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}

export default PlatformSettingsPage
