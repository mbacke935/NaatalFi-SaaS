import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiArrowLeft, FiUpload, FiX, FiTrash2, FiStar, FiPlus, FiCheck,
} from 'react-icons/fi'
import {
  getMyProduct,
  updateProduct,
  uploadProductImage,
  deleteProductImage,
  setProductImageCover,
  reorderProductImages,
  createVariant,
  updateVariant,
  deleteVariant,
} from '../../../services/products'
import { getCategories } from '../../../services/categories'

// ── Image Gallery with drag & drop reorder ───────────────────────────
function ImageGallery({ productId, images: initialImages, onUpdate }) {
  const [images, setImages]     = useState(initialImages)
  const [uploading, setUploading] = useState(false)
  const [draggingId, setDraggingId] = useState(null)
  const fileRef = useRef(null)

  // Keep local images in sync when product reloads
  useEffect(() => { setImages(initialImages) }, [initialImages])

  const handleFiles = async (files) => {
    const remaining = 5 - images.length
    const toUpload  = Array.from(files).slice(0, remaining)
    if (toUpload.length === 0) {
      toast.error('Maximum 5 images par produit.')
      return
    }
    setUploading(true)
    try {
      for (const file of toUpload) {
        await uploadProductImage(productId, file)
      }
      toast.success(`${toUpload.length} image(s) ajoutée(s).`)
      onUpdate()
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'upload.")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (imageId) => {
    try {
      await deleteProductImage(productId, imageId)
      onUpdate()
    } catch {
      toast.error('Impossible de supprimer cette image.')
    }
  }

  const handleSetCover = async (imageId) => {
    try {
      await setProductImageCover(productId, imageId)
      toast.success('Image de couverture mise à jour.')
      onUpdate()
    } catch {
      toast.error('Erreur.')
    }
  }

  // Drag & drop reorder
  const handleDragStart = (id) => setDraggingId(id)

  const handleDragOver = (e, targetId) => {
    e.preventDefault()
    if (draggingId === null || draggingId === targetId) return
    setImages((prev) => {
      const fromIdx = prev.findIndex((i) => i.id === draggingId)
      const toIdx   = prev.findIndex((i) => i.id === targetId)
      if (fromIdx === -1 || toIdx === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next
    })
  }

  const handleDragEnd = async () => {
    setDraggingId(null)
    try {
      await reorderProductImages(
        productId,
        images.map((img, i) => ({ id: img.id, order: i }))
      )
      onUpdate()
    } catch {
      toast.error('Erreur lors du réordonnancement.')
      onUpdate()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold">Images</h3>
          <p className="text-xs text-gray-500 mt-0.5">Glissez pour réordonner · étoile = couverture</p>
        </div>
        <span className="text-xs text-gray-500">{images.length}/5</span>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-3">
        {images.map((img) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => handleDragStart(img.id)}
            onDragOver={(e) => handleDragOver(e, img.id)}
            onDragEnd={handleDragEnd}
            className={`relative group aspect-square rounded-lg overflow-hidden bg-[#2a2a3a] cursor-grab active:cursor-grabbing transition-opacity ${
              draggingId === img.id ? 'opacity-40' : ''
            }`}
          >
            <img src={img.image_url} alt="" className="w-full h-full object-cover pointer-events-none" />
            {img.is_cover && (
              <div className="absolute top-1 left-1 bg-[#D4AF37] rounded text-black p-0.5">
                <FiStar size={10} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
              {!img.is_cover && (
                <button
                  onClick={() => handleSetCover(img.id)}
                  className="text-yellow-400 hover:text-yellow-300"
                  title="Définir comme couverture"
                >
                  <FiStar size={14} />
                </button>
              )}
              <button
                onClick={() => handleDelete(img.id)}
                className="text-red-400 hover:text-red-300"
                title="Supprimer"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {images.length < 5 && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-[#2a2a3a] hover:border-[#D4AF37] flex flex-col items-center justify-center text-gray-600 hover:text-[#D4AF37] transition disabled:opacity-40"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <FiUpload size={18} />
                <span className="text-xs mt-1">Ajouter</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-xs text-gray-600">JPG, PNG ou WebP · max 5 Mo</p>
    </div>
  )
}

// ── Variants Manager ─────────────────────────────────────────────────
function VariantsManager({ productId, variants, onUpdate }) {
  const [newRow, setNewRow] = useState({ name: '', value: '', stock: '', price_delta: '0' })
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editRow, setEditRow] = useState({})

  const handleAdd = async (e) => {
    e.preventDefault()
    setAdding(true)
    try {
      await createVariant(productId, {
        name:        newRow.name,
        value:       newRow.value,
        stock:       Number(newRow.stock),
        price_delta: Number(newRow.price_delta),
      })
      setNewRow({ name: '', value: '', stock: '', price_delta: '0' })
      onUpdate()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur.')
    } finally {
      setAdding(false)
    }
  }

  const handleSaveEdit = async (variantId) => {
    try {
      await updateVariant(productId, variantId, {
        name:        editRow.name,
        value:       editRow.value,
        stock:       Number(editRow.stock),
        price_delta: Number(editRow.price_delta),
      })
      setEditId(null)
      onUpdate()
    } catch {
      toast.error('Erreur lors de la mise à jour.')
    }
  }

  const handleDelete = async (variantId) => {
    try {
      await deleteVariant(productId, variantId)
      onUpdate()
    } catch {
      toast.error('Impossible de supprimer cette variante.')
    }
  }

  const inputCls = 'bg-[#0B0B0F] border border-[#2a2a3a] rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#D4AF37] transition w-full'

  return (
    <div>
      <h3 className="text-white font-semibold mb-3">Variantes</h3>

      {variants.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-[1fr_1fr_80px_100px_60px] gap-2 text-xs text-gray-500 uppercase px-1 mb-1">
            <span>Attribut</span><span>Valeur</span><span>Stock</span><span>+Prix (FCFA)</span><span />
          </div>
          {variants.map((v) =>
            editId === v.id ? (
              <div key={v.id} className="grid grid-cols-[1fr_1fr_80px_100px_60px] gap-2 mb-2">
                <input className={inputCls} value={editRow.name}        onChange={(e) => setEditRow((r) => ({ ...r, name: e.target.value }))} />
                <input className={inputCls} value={editRow.value}       onChange={(e) => setEditRow((r) => ({ ...r, value: e.target.value }))} />
                <input className={inputCls} type="number" value={editRow.stock} onChange={(e) => setEditRow((r) => ({ ...r, stock: e.target.value }))} />
                <input className={inputCls} type="number" value={editRow.price_delta} onChange={(e) => setEditRow((r) => ({ ...r, price_delta: e.target.value }))} />
                <div className="flex gap-1">
                  <button onClick={() => handleSaveEdit(v.id)} className="text-green-400 hover:text-green-300"><FiCheck size={14} /></button>
                  <button onClick={() => setEditId(null)} className="text-gray-500 hover:text-white"><FiX size={14} /></button>
                </div>
              </div>
            ) : (
              <div key={v.id} className="grid grid-cols-[1fr_1fr_80px_100px_60px] gap-2 mb-2 group items-center">
                <span className="text-white text-sm px-2 py-1.5 bg-[#0B0B0F] rounded border border-[#2a2a3a]">{v.name}</span>
                <span className="text-white text-sm px-2 py-1.5 bg-[#0B0B0F] rounded border border-[#2a2a3a]">{v.value}</span>
                <span className="text-white text-sm px-2 py-1.5 bg-[#0B0B0F] rounded border border-[#2a2a3a]">{v.stock}</span>
                <span className="text-white text-sm px-2 py-1.5 bg-[#0B0B0F] rounded border border-[#2a2a3a]">
                  {Number(v.price_delta) >= 0 ? '+' : ''}{Number(v.price_delta).toLocaleString('fr-SN')}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => { setEditId(v.id); setEditRow({ name: v.name, value: v.value, stock: v.stock, price_delta: v.price_delta }) }}
                    className="text-gray-400 hover:text-[#D4AF37]"
                  >
                    <FiPlus size={13} className="rotate-45" />
                  </button>
                  <button onClick={() => handleDelete(v.id)} className="text-gray-400 hover:text-red-400">
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Add row */}
      <form onSubmit={handleAdd} className="grid grid-cols-[1fr_1fr_80px_100px_auto] gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Attribut</label>
          <input className={inputCls} placeholder="Taille" value={newRow.name} onChange={(e) => setNewRow((r) => ({ ...r, name: e.target.value }))} required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Valeur</label>
          <input className={inputCls} placeholder="XL" value={newRow.value} onChange={(e) => setNewRow((r) => ({ ...r, value: e.target.value }))} required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Stock</label>
          <input className={inputCls} type="number" min="0" placeholder="10" value={newRow.stock} onChange={(e) => setNewRow((r) => ({ ...r, stock: e.target.value }))} required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">+Prix FCFA</label>
          <input className={inputCls} type="number" placeholder="0" value={newRow.price_delta} onChange={(e) => setNewRow((r) => ({ ...r, price_delta: e.target.value }))} />
        </div>
        <button
          type="submit"
          disabled={adding}
          className="flex items-center gap-1 bg-[#2a2a3a] hover:bg-[#3a3a4a] text-white text-sm px-3 py-1.5 rounded transition disabled:opacity-50 whitespace-nowrap"
        >
          <FiPlus size={13} /> Ajouter
        </button>
      </form>
    </div>
  )
}

// ── Main Edit Page ───────────────────────────────────────────────────
function EditProductPage() {
  const { id }                  = useParams()
  const navigate                = useNavigate()
  const [product, setProduct]   = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [form, setForm]         = useState(null)

  const STATUS_OPTIONS = [
    { value: 'DRAFT',        label: 'Brouillon' },
    { value: 'PUBLISHED',    label: 'Publié' },
    { value: 'OUT_OF_STOCK', label: 'Rupture de stock' },
    { value: 'ARCHIVED',     label: 'Archivé' },
  ]

  const loadProduct = () =>
    getMyProduct(id).then(({ data }) => {
      setProduct(data)
      setForm({
        name:        data.name,
        description: data.description,
        price:       data.price,
        category:    data.category ?? '',
        status:      data.status,
      })
    })

  useEffect(() => {
    Promise.all([
      loadProduct(),
      getCategories().then(({ data }) => setCategories(data)),
    ])
      .catch(() => toast.error('Erreur de chargement.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSaveInfo = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name:        form.name,
        description: form.description,
        price:       form.price,
        status:      form.status,
        category:    form.category ? Number(form.category) : null,
      }
      const { data } = await updateProduct(id, payload)
      setProduct(data)
      toast.success('Produit mis à jour.')
    } catch (err) {
      const msg = err.response?.data?.error
        || Object.values(err.response?.data || {})[0]?.[0]
        || 'Erreur.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const allCategories = categories.flatMap((c) => [c, ...(c.children || [])])

  if (loading) {
    return <div className="text-gray-400 text-sm">Chargement...</div>
  }

  if (!product || !form) {
    return <div className="text-red-400">Produit introuvable.</div>
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/dashboard/products')}
          className="text-gray-400 hover:text-white transition"
        >
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{product.name}</h1>
          <p className="text-gray-500 text-sm">/{product.slug}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── Informations de base ── */}
        <section className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Informations</h2>
          <form onSubmit={handleSaveInfo} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nom *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition resize-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Prix (FCFA) *</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition"
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
                  <option value="">— Aucune —</option>
                  {allCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parent_id ? `   ↳ ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Statut</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold py-2 px-5 rounded-lg transition disabled:opacity-50 text-sm"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </section>

        {/* ── Images ── */}
        <section className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-6">
          <ImageGallery
            productId={product.id}
            images={product.images}
            onUpdate={() => loadProduct()}
          />
        </section>

        {/* ── Variantes ── */}
        <section className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-6">
          <VariantsManager
            productId={product.id}
            variants={product.variants}
            onUpdate={() => loadProduct()}
          />
        </section>
      </div>
    </div>
  )
}

export default EditProductPage
