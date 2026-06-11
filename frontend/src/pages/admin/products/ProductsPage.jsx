import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiBox, FiToggleLeft, FiToggleRight } from 'react-icons/fi'
import { getAdminProducts, updateAdminProduct } from '../../../services/admin'

const fmt = (n) => Number(n ?? 0).toLocaleString('fr-SN') + ' FCFA'

const STATUS_COLORS = {
  PUBLISHED:    'bg-green-900/40 text-green-400',
  DRAFT:        'bg-gray-800 text-gray-400',
  OUT_OF_STOCK: 'bg-yellow-900/40 text-yellow-400',
  ARCHIVED:     'bg-red-900/40 text-red-400',
}

const STATUS_LABELS = {
  PUBLISHED: 'Publié', DRAFT: 'Brouillon',
  OUT_OF_STOCK: 'Rupture', ARCHIVED: 'Archivé',
}

const FILTERS = [
  { value: '',             label: 'Tous' },
  { value: 'PUBLISHED',    label: 'Publiés' },
  { value: 'DRAFT',        label: 'Brouillons' },
  { value: 'OUT_OF_STOCK', label: 'Rupture' },
  { value: 'ARCHIVED',     label: 'Archivés' },
]

function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [status, setStatus]     = useState('')

  const load = (s = status) => {
    setLoading(true)
    getAdminProducts(s ? { status: s } : {})
      .then(({ data }) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleFilter = (s) => { setStatus(s); load(s) }

  const toggleProduct = async (product) => {
    const nextStatus = product.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED'
    try {
      await updateAdminProduct(product.id, { status: nextStatus })
      toast.success(nextStatus === 'PUBLISHED' ? 'Produit publie.' : 'Produit archive.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur.')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Produits</h1>
        <p className="text-sm text-gray-500 mt-1">Catalogue complet de la marketplace.</p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilter(f.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              status === f.value
                ? 'bg-[#D4AF37] text-black'
                : 'bg-[#16161E] text-gray-400 border border-[#2a2a3a] hover:border-[#D4AF37]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-14 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
          <FiBox className="text-gray-600 mx-auto mb-3" size={32} />
          <p className="text-sm text-gray-500">Aucun produit trouvé.</p>
        </div>
      ) : (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a] text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Produit</th>
                <th className="text-left px-4 py-3">Vendeur</th>
                <th className="text-left px-4 py-3">Catégorie</th>
                <th className="text-left px-4 py-3">Prix</th>
                <th className="text-left px-4 py-3">Statut</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-[#2a2a3a] last:border-0 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#2a2a3a] overflow-hidden flex-shrink-0">
                        {p.cover_image
                          ? <img src={p.cover_image} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">📦</div>
                        }
                      </div>
                      <span className="text-white font-medium line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{p.vendor_name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.category_name || '—'}</td>
                  <td className="px-4 py-3 text-white font-semibold whitespace-nowrap">{fmt(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] ?? 'bg-gray-800 text-gray-400'}`}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(p.created_at).toLocaleDateString('fr-SN')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleProduct(p)}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#D4AF37]"
                    >
                      {p.status === 'PUBLISHED' ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                      {p.status === 'PUBLISHED' ? 'Archiver' : 'Publier'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-[#2a2a3a] text-xs text-gray-600">
            {products.length} produit{products.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProductsPage
