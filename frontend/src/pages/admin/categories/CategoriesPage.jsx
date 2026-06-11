import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiChevronDown, FiChevronRight, FiMenu } from 'react-icons/fi'
import {
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminUploadCategoryImage,
  adminReorderCategories,
} from '../../../services/categories'

// ── Modal create/edit ─────────────────────────────────────────────
function CategoryModal({ open, onClose, onSave, parents, initial }) {
  const [form, setForm]       = useState({ name: '', parent: '', is_active: true })
  const [imageFile, setImage] = useState(null)
  const [saving, setSaving]   = useState(false)
  const fileRef               = useRef(null)

  useEffect(() => {
    if (open) {
      setForm({
        name:      initial?.name      ?? '',
        parent:    initial?.parent    ?? '',
        is_active: initial?.is_active ?? true,
      })
      setImage(null)
    }
  }, [open, initial])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name:      form.name,
        is_active: form.is_active,
        ...(form.parent ? { parent: form.parent } : {}),
      }
      const saved = await onSave(payload, imageFile)
      if (saved) onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">
            {initial ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <FiX size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nom *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              placeholder="Ex: Électronique"
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Catégorie parente</label>
            <select
              value={form.parent}
              onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition"
            >
              <option value="">— Catégorie racine —</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Image</label>
            {imageFile ? (
              <div className="flex items-center gap-3">
                <img src={URL.createObjectURL(imageFile)} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <button type="button" onClick={() => setImage(null)} className="text-red-400 text-sm hover:underline">Supprimer</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-sm text-[#D4AF37] hover:underline"
              >
                Choisir une image
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => setImage(e.target.files[0] || null)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="accent-[#D4AF37]"
            />
            <label htmlFor="is_active" className="text-sm text-gray-300">Active</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-[#2a2a3a] text-gray-400 hover:text-white rounded-lg transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Draggable row ────────────────────────────────────────────────
function CategoryRow({ category, onEdit, onDelete, onDragStart, onDragOver, onDrop, draggingId }) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = category.children?.length > 0
  const isDragging  = draggingId === category.id

  return (
    <div className={`transition-opacity ${isDragging ? 'opacity-40' : ''}`}>
      {/* Parent row */}
      <div
        draggable
        onDragStart={() => onDragStart(category.id, null)}
        onDragOver={(e) => { e.preventDefault(); onDragOver(category.id, null) }}
        onDrop={() => onDrop(category.id, null)}
        className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a3a] hover:bg-white/5 group cursor-grab active:cursor-grabbing"
      >
        <FiMenu className="text-gray-600 flex-shrink-0" size={14} />
        {category.image
          ? <img src={category.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          : <div className="w-8 h-8 rounded-lg bg-[#2a2a3a] flex-shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <span className="text-white font-medium">{category.name}</span>
          <span className="text-gray-600 text-xs ml-2">/{category.slug}</span>
        </div>
        {!category.is_active && (
          <span className="text-xs text-gray-500 bg-[#2a2a3a] px-2 py-0.5 rounded">Inactive</span>
        )}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => onEdit(category)} className="text-gray-400 hover:text-[#D4AF37]"><FiEdit2 size={14} /></button>
          <button onClick={() => onDelete(category)} className="text-gray-400 hover:text-red-400"><FiTrash2 size={14} /></button>
        </div>
        {hasChildren && (
          <button onClick={() => setExpanded((v) => !v)} className="text-gray-500 hover:text-white ml-1">
            {expanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && category.children.map((child) => (
        <div
          key={child.id}
          draggable
          onDragStart={() => onDragStart(child.id, category.id)}
          onDragOver={(e) => { e.preventDefault(); onDragOver(child.id, category.id) }}
          onDrop={() => onDrop(child.id, category.id)}
          className={`flex items-center gap-3 pl-12 pr-4 py-2.5 border-b border-[#2a2a3a] hover:bg-white/5 group cursor-grab active:cursor-grabbing
            ${draggingId === child.id ? 'opacity-40' : ''}`}
        >
          <FiMenu className="text-gray-700 flex-shrink-0" size={12} />
          {child.image
            ? <img src={child.image} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
            : <div className="w-6 h-6 rounded bg-[#2a2a3a] flex-shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <span className="text-gray-200 text-sm">{child.name}</span>
            <span className="text-gray-600 text-xs ml-2">/{child.slug}</span>
          </div>
          {!child.is_active && (
            <span className="text-xs text-gray-500 bg-[#2a2a3a] px-2 py-0.5 rounded">Inactive</span>
          )}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
            <button onClick={() => onEdit({ ...child, parent: category.id })} className="text-gray-400 hover:text-[#D4AF37]"><FiEdit2 size={13} /></button>
            <button onClick={() => onDelete(child)} className="text-gray-400 hover:text-red-400"><FiTrash2 size={13} /></button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────
function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState({ open: false, initial: null })
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const dragContext                  = useRef({})

  const load = () =>
    adminGetCategories()
      .then(({ data }) => setCategories(data))
      .catch(() => toast.error('Erreur de chargement.'))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  // ── Save (create or update) ──
  const handleSave = async (payload, imageFile) => {
    try {
      let saved
      if (modal.initial?.id) {
        const { data } = await adminUpdateCategory(modal.initial.id, payload)
        saved = data
        if (imageFile) await adminUploadCategoryImage(modal.initial.id, imageFile)
      } else {
        const { data } = await adminCreateCategory(payload)
        saved = data
        if (imageFile) {
          await adminUploadCategoryImage(saved.id, imageFile)
        }
      }
      toast.success(modal.initial ? 'Catégorie mise à jour !' : 'Catégorie créée !')
      load()
      return true
    } catch (err) {
      const msg = err.response?.data?.error
        || Object.values(err.response?.data || {})[0]?.[0]
        || 'Une erreur est survenue.'
      toast.error(msg)
      return false
    }
  }

  // ── Delete ──
  const handleDelete = async (category) => {
    if (!window.confirm(`Supprimer "${category.name}" ?`)) return
    try {
      await adminDeleteCategory(category.id)
      toast.success('Catégorie supprimée.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Impossible de supprimer.')
    }
  }

  // ── Drag & drop (reorder within same level) ──
  const handleDragStart = (id, parentId) => {
    setDraggingId(id)
    dragContext.current = { id, parentId }
  }

  const handleDragOver = (id, parentId) => setDragOverId(id)

  const handleDrop = async (targetId, targetParentId) => {
    const { id: dragId, parentId: dragParentId } = dragContext.current
    setDraggingId(null)
    setDragOverId(null)
    if (dragId === targetId || dragParentId !== targetParentId) return

    // Reorder within the same level
    const reorderItems = (list) => {
      const fromIdx = list.findIndex((c) => c.id === dragId)
      const toIdx   = list.findIndex((c) => c.id === targetId)
      if (fromIdx === -1 || toIdx === -1) return list
      const next = [...list]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next.map((c, i) => ({ ...c, order: i }))
    }

    let reordered
    if (dragParentId === null) {
      reordered = reorderItems(categories)
      setCategories(reordered)
      await adminReorderCategories(reordered.map((c) => ({ id: c.id, order: c.order })))
    } else {
      const updated = categories.map((cat) => {
        if (cat.id !== dragParentId) return cat
        return { ...cat, children: reorderItems(cat.children) }
      })
      setCategories(updated)
      const parent = updated.find((c) => c.id === dragParentId)
      await adminReorderCategories(parent.children.map((c) => ({ id: c.id, order: c.order })))
    }
  }

  const rootCategories = categories.filter((c) => !c.parent_id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Catégories</h1>
        <button
          onClick={() => setModal({ open: true, initial: null })}
          className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold py-2 px-4 rounded-lg transition text-sm"
        >
          <FiPlus size={15} /> Nouvelle catégorie
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Chargement...</p>
      ) : categories.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
          <p className="text-gray-500 mb-3">Aucune catégorie pour l'instant.</p>
          <button
            onClick={() => setModal({ open: true, initial: null })}
            className="text-[#D4AF37] hover:underline text-sm"
          >
            Créer la première catégorie
          </button>
        </div>
      ) : (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#2a2a3a] text-xs text-gray-500 uppercase tracking-wide flex gap-3">
            <span className="w-8" />
            <span className="w-8" />
            <span className="flex-1">Nom</span>
            <span className="text-right">Actions</span>
          </div>
          {categories.map((cat) => (
            <CategoryRow
              key={cat.id}
              category={cat}
              onEdit={(c) => setModal({ open: true, initial: c })}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              draggingId={draggingId}
            />
          ))}
        </div>
      )}

      <CategoryModal
        open={modal.open}
        onClose={() => setModal({ open: false, initial: null })}
        onSave={handleSave}
        parents={categories}
        initial={modal.initial}
      />
    </div>
  )
}

export default CategoriesPage
