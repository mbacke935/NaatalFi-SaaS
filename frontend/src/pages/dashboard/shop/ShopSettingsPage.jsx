import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiAlertTriangle, FiCheck, FiClock } from 'react-icons/fi'
import {
  createVendor,
  getMyVendor,
  updateMyVendor,
  uploadLogo,
} from '../../../services/vendors'
import ImageUpload from '../../../components/ui/ImageUpload'

const STATUS_CONFIG = {
  PENDING: { label: 'En attente de validation', icon: FiClock, color: 'text-yellow-400' },
  APPROVED: { label: 'Boutique approuvee', icon: FiCheck, color: 'text-green-400' },
  SUSPENDED: { label: 'Boutique suspendue', icon: FiAlertTriangle, color: 'text-red-400' },
}

const EMPTY_FORM = {
  name: '',
  description: '',
  phone: '',
  whatsapp: '',
  contact_email: '',
  address: '',
  city: '',
  region: '',
  facebook_url: '',
  instagram_url: '',
  tiktok_url: '',
  website_url: '',
}

const inputCls = 'w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition'

function ShopSettingsPage() {
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    getMyVendor()
      .then(({ data }) => {
        setVendor(data)
        setForm({
          name: data.name || '',
          description: data.description || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          contact_email: data.contact_email || '',
          address: data.address || '',
          city: data.city || '',
          region: data.region || '',
          facebook_url: data.facebook_url || '',
          instagram_url: data.instagram_url || '',
          tiktok_url: data.tiktok_url || '',
          website_url: data.website_url || '',
        })
      })
      .catch((err) => {
        if (err.response?.status !== 404) toast.error('Erreur lors du chargement.')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (vendor) {
        const { data } = await updateMyVendor(form)
        setVendor(data)
      } else {
        const { data } = await createVendor(form)
        setVendor(data)
      }

      if (logoFile) {
        const { data: logoData } = await uploadLogo(logoFile)
        setVendor((current) => ({ ...current, logo: logoData.logo }))
        setLogoFile(null)
      }

      toast.success(vendor ? 'Boutique mise a jour.' : 'Boutique creee. En attente de validation.')
    } catch (err) {
      const data = err.response?.data
      const msg = data?.error || data?.contact_email?.[0] || data?.website_url?.[0] || 'Une erreur est survenue.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-gray-400 text-sm">Chargement...</div>
  }

  const StatusBadge = vendor ? STATUS_CONFIG[vendor.status] : null

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">Ma boutique</h1>
        {StatusBadge && (
          <div className={`flex items-center gap-2 text-sm font-medium ${StatusBadge.color}`}>
            <StatusBadge.icon size={16} />
            {StatusBadge.label}
          </div>
        )}
      </div>

      {vendor?.plan && (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Plan actuel</p>
            <p className="text-white font-semibold">{vendor.plan.name}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-gray-500">Commission</p>
            <p className="text-[#D4AF37] font-bold">{vendor.plan.commission_rate}%</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-gray-500">Produits max</p>
            <p className="text-white font-medium">{vendor.plan.max_products ?? 'illimite'}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-gray-400 mb-3">Logo de la boutique</label>
          <ImageUpload currentUrl={vendor?.logo} onFile={setLogoFile} label="Ajouter un logo" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Nom de la boutique *</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Ma boutique"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="Decrivez votre boutique..."
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Telephone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+221 77 000 00 00" />
          <Field label="WhatsApp" name="whatsapp" type="tel" value={form.whatsapp} onChange={handleChange} placeholder="+221 77 000 00 00" />
          <Field label="Email de contact" name="contact_email" type="email" value={form.contact_email} onChange={handleChange} placeholder="boutique@example.com" />
          <Field label="Ville" name="city" value={form.city} onChange={handleChange} placeholder="Dakar" />
        </div>

        <Field label="Adresse" name="address" value={form.address} onChange={handleChange} placeholder="Adresse de la boutique" />
        <Field label="Region / zone principale" name="region" value={form.region} onChange={handleChange} placeholder="Dakar, Thies, Saint-Louis..." />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Facebook" name="facebook_url" type="url" value={form.facebook_url} onChange={handleChange} placeholder="https://facebook.com/..." />
          <Field label="Instagram" name="instagram_url" type="url" value={form.instagram_url} onChange={handleChange} placeholder="https://instagram.com/..." />
          <Field label="TikTok" name="tiktok_url" type="url" value={form.tiktok_url} onChange={handleChange} placeholder="https://www.tiktok.com/@..." />
          <Field label="Site web" name="website_url" type="url" value={form.website_url} onChange={handleChange} placeholder="https://..." />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : vendor ? 'Mettre a jour' : 'Creer ma boutique'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, name, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  )
}

export default ShopSettingsPage
