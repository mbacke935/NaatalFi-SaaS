import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiPackage, FiToggleLeft, FiToggleRight } from 'react-icons/fi'
import { getMyProducts, deleteProduct, updateProduct } from '../../../services/products'

const STATUS_MAP = {
  DRAFT:        { label: 'Brouillon',          cls: 'bg-gray-700 text-gray-300' },
  PUBLISHED:    { label: 'Publié',              cls: 'bg-green-900/50 text-green-400' },
  OUT_OF_STOCK: { label: 'Rupture',             cls: 'bg-orange-900/50 text-orange-400' },
  ARCHIVED:     { label: 'Archivé',             cls: 'bg-red-900/50 text-red-400' },
}

const TABS = [
  { key: '',            label: 'Tous' },
  { key: 'PUBLISHED',   label: 'Publiés' },
  { key: 'DRAFT',       label: 'Brouillons' },
  { key: 'OUT_OF_STOCK',label: 'Rupture' },
  { key: 'ARCHIVED',    label: 'Archivés' },
]

function ProductsPage() {
  const navigate               = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = (statusFilter) =>
    getMyProducts(statusFilter ? { status: statusFilter } : {})
      .then(({ data }) => setProducts(data))
      .catch(() => toast.error('Erreur de chargement.'))
      .finally(() => setLoading(false))

  useEffect(() => { load(tab) }, [tab])

  const handleDelete = async (p) => {
    try {
      await deleteProduct(p.id)
      toast.success('Produit supprimé.')
      setConfirmDelete(null)
      load(tab)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Impossible de supprimer.')
    }
  }

  const handleToggleStatus = async (p) => {
    const status = p.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED'
    try {
      await updateProduct(p.id, { status })
      toast.success(status === 'PUBLISHED' ? 'Produit publie.' : 'Produit archive.')
      load(tab)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Impossible de modifier le statut.')
    }
  }

  const stats = {
    total:     products.length,
    published: products.filter((p) => p.status === 'PUBLISHED').length,
    draft:     products.filter((p) => p.status === 'DRAFT').length,
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">Mes produits</h1>
        <Link
          to="/dashboard/products/new"
          className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold py-2 px-4 rounded-lg transition text-sm"
        >
          <FiPlus size={15} /> Nouveau produit
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total',     value: stats.total },
          { label: 'Publiés',   value: stats.published },
          { label: 'Brouillons',value: stats.draft },
        ].map((s) => (
          <div key={s.label} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#16161E] border border-[#2a2a3a] rounded-xl p-1 w-full sm:w-fit max-w-full overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setLoading(true); setTab(t.key) }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              tab === t.key
                ? 'bg-[#D4AF37] text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-400 text-sm">Chargement...</p>
      ) : products.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
          <FiPackage size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 mb-3">Aucun produit pour l'instant.</p>
          <Link to="/dashboard/products/new" className="text-[#D4AF37] hover:underline text-sm">
            Créer mon premier produit
          </Link>
        </div>
      ) : (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a] text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 w-12" />
                <th className="text-left px-4 py-3">Produit</th>
                <th className="text-left px-4 py-3">Catégorie</th>
                <th className="text-right px-4 py-3">Prix</th>
                <th className="text-left px-4 py-3">Statut</th>
                <th className="text-center px-4 py-3">Images</th>
                <th className="text-center px-4 py-3">Variantes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const st = STATUS_MAP[p.status] || STATUS_MAP.DRAFT
                return (
                  <tr key={p.id} className="border-b border-[#2a2a3a] last:border-0 hover:bg-white/5 group">
                    <td className="px-4 py-3">
                      {p.cover_image ? (
                        <img src={p.cover_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#2a2a3a] flex items-center justify-center">
                          <FiImage size={14} className="text-gray-600" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{p.name}</span>
                      <span className="block text-gray-600 text-xs">/{p.slug}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{p.category_name ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-white font-medium">
                      {Number(p.price).toLocaleString('fr-SN')} FCFA
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">{p.image_count}</td>
                    <td className="px-4 py-3 text-center text-gray-400">{p.variant_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className="text-gray-400 hover:text-green-400"
                          title={p.status === 'PUBLISHED' ? 'Archiver' : 'Publier'}
                        >
                          {p.status === 'PUBLISHED' ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/products/${p.id}/edit`)}
                          className="text-gray-400 hover:text-[#D4AF37]"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(p)}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation suppression produit */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-white font-semibold mb-2">Supprimer ce produit ?</h3>
            <p className="text-gray-400 text-sm mb-5">
              "<span className="text-white">{confirmDelete.name}</span>" sera définitivement supprimé.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-[#2a2a3a] text-gray-400 hover:text-white rounded-lg text-sm transition">
                Annuler
              </button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsPage
