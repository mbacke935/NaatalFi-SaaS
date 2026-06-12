import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft } from 'react-icons/fi'
import { createProduct } from '../../../services/products'
import { getCategories } from '../../../services/categories'

function NewProductPage() {
  const navigate               = useNavigate()
  const [categories, setCategories] = useState([])
  const [saving, setSaving]    = useState(false)
  const [form, setForm]        = useState({
    name:        '',
    description: '',
    price:       '',
    category:    '',
    status:      'DRAFT',
  })

  useEffect(() => {
    getCategories()
      .then(({ data }) => setCategories(data))
      .catch(() => {})
  }, [])

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name:        form.name,
        description: form.description,
        price:       form.price,
        status:      form.status,
        ...(form.category ? { category: Number(form.category) } : {}),
      }
      const { data } = await createProduct(payload)
      toast.success('Produit créé ! Ajoutez maintenant vos images et variantes.')
      navigate(`/dashboard/products/${data.id}/edit`)
    } catch (err) {
      const msg = err.response?.data?.error
        || Object.values(err.response?.data || {})[0]?.[0]
        || 'Une erreur est survenue.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // Flatten categories tree for select
  const allCategories = categories.flatMap((c) => [
    c,
    ...(c.children || []),
  ])

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/dashboard/products')}
          className="text-gray-400 hover:text-white transition"
        >
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white">Nouveau produit</h1>
      </div>

      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nom */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nom du produit *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Ex: Boubou brodé en bazin"
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Décrivez votre produit..."
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition resize-none"
            />
          </div>

          {/* Prix + Catégorie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Prix (FCFA) *</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
                min="1"
                placeholder="5000"
                className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Catégorie</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition"
              >
                <option value="">— Sans catégorie —</option>
                {allCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parent_id ? `   ↳ ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Statut initial</label>
            <div className="flex flex-col sm:flex-row gap-3">
              {[
                { value: 'DRAFT',     label: 'Brouillon',  desc: 'Non visible au public' },
                { value: 'PUBLISHED', label: 'Publié',     desc: 'Visible immédiatement' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex-1 cursor-pointer border rounded-lg p-3 transition ${
                    form.status === opt.value
                      ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                      : 'border-[#2a2a3a] hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    checked={form.status === opt.value}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <p className="text-white font-medium text-sm">{opt.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Création...' : 'Créer le produit'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/products')}
              className="px-6 py-2.5 border border-[#2a2a3a] text-gray-400 hover:text-white rounded-lg transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewProductPage
