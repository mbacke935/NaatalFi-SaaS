import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiFilter, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { getMarketplaceProducts, getMarketplaceCategories } from '../../services/marketplace'
import { useMeta } from '../../hooks/useMeta'

const STATUS_LABEL = { PUBLISHED: 'Publié', DRAFT: 'Brouillon' }

function ProductCard({ product }) {
  return (
    <Link
      to={`/marketplace/${product.slug}`}
      className="group bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden hover:border-[#D4AF37]/50 transition-all hover:-translate-y-0.5"
    >
      <div className="aspect-square bg-[#2a2a3a] overflow-hidden">
        {product.cover_image ? (
          <img src={product.cover_image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 text-4xl">📦</div>
        )}
      </div>
      <div className="p-3">
        {product.category_name && (
          <p className="text-xs text-gray-500 mb-0.5">{product.category_name}</p>
        )}
        <h3 className="text-white text-sm font-medium line-clamp-2 leading-snug">{product.name}</h3>
        <p className="text-[#D4AF37] font-bold mt-1">{Number(product.price).toLocaleString('fr-SN')} FCFA</p>
        <p className="text-gray-600 text-xs mt-0.5">{product.vendor_name}</p>
      </div>
    </Link>
  )
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = []
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pages.push(i)

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg border border-[#2a2a3a] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <FiChevronLeft size={16} />
      </button>
      {pages[0] > 1 && <span className="text-gray-600 px-1">…</span>}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
            p === page
              ? 'bg-[#D4AF37] text-black'
              : 'border border-[#2a2a3a] text-gray-400 hover:text-white'
          }`}
        >
          {p}
        </button>
      ))}
      {pages[pages.length - 1] < totalPages && <span className="text-gray-600 px-1">…</span>}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-lg border border-[#2a2a3a] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <FiChevronRight size={16} />
      </button>
    </div>
  )
}

function MarketplacePage() {
  useMeta({ title: 'Marketplace', description: 'Parcourez les produits des boutiques sénégalaises.' })

  const [searchParams, setSearchParams] = useSearchParams()
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [categories, setCategories] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const page     = Number(searchParams.get('page') || 1)
  const category = searchParams.get('category') || ''
  const sort     = searchParams.get('sort') || 'recent'
  const minPrice = searchParams.get('min_price') || ''
  const maxPrice = searchParams.get('max_price') || ''

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value); else next.delete(key)
    if (key !== 'page') next.set('page', '1')
    setSearchParams(next)
  }

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, sort }
    if (category) params.category = category
    if (minPrice) params.min_price = minPrice
    if (maxPrice) params.max_price = maxPrice
    getMarketplaceProducts(params)
      .then(({ data }) => setResult(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, category, sort, minPrice, maxPrice])

  useEffect(() => { load() }, [load])
  useEffect(() => { getMarketplaceCategories().then(({ data }) => setCategories(data)).catch(() => {}) }, [])

  const SORTS = [
    { value: 'recent',     label: 'Plus récents' },
    { value: 'price_asc',  label: 'Prix croissant' },
    { value: 'price_desc', label: 'Prix décroissant' },
    { value: 'trust',      label: 'Mieux notés' },
  ]

  const SidebarContent = () => (
    <div className="space-y-6">
      {/* Catégories */}
      <div>
        <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Catégories</h3>
        <div className="space-y-1">
          <button
            onClick={() => setParam('category', '')}
            className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition ${
              !category ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-gray-400 hover:text-white'
            }`}
          >
            Toutes les catégories
          </button>
          {categories.map((cat) => (
            <div key={cat.id}>
              <button
                onClick={() => setParam('category', cat.slug)}
                className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition ${
                  category === cat.slug ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-gray-400 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
              {(cat.children || []).map((child) => (
                <button
                  key={child.id}
                  onClick={() => setParam('category', child.slug)}
                  className={`w-full text-left text-sm pl-6 pr-2 py-1.5 rounded-lg transition ${
                    category === child.slug ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  ↳ {child.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Prix */}
      <div>
        <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Prix (FCFA)</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setParam('min_price', e.target.value)}
            className="bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setParam('max_price', e.target.value)}
            className="bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
          />
        </div>
      </div>

      {(category || minPrice || maxPrice) && (
        <button
          onClick={() => { setParam('category', ''); setParam('min_price', ''); setParam('max_price', '') }}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition"
        >
          <FiX size={14} /> Effacer les filtres
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketplace</h1>
          {result && (
            <p className="text-sm text-gray-500 mt-0.5">{result.count} produit{result.count !== 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Mobile filter button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center gap-2 text-sm border border-[#2a2a3a] text-gray-400 hover:text-white px-3 py-2 rounded-lg transition"
          >
            <FiFilter size={14} /> Filtres
          </button>
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
            className="bg-[#16161E] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition"
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5 sticky top-24">
            <SidebarContent />
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#16161E] p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-bold">Filtres</h2>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
              </div>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-[#2a2a3a]" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-[#2a2a3a] rounded w-3/4" />
                    <div className="h-4 bg-[#2a2a3a] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !result || result.results.length === 0 ? (
            <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
              <p className="text-gray-500">Aucun produit trouvé.</p>
              {(category || minPrice || maxPrice) && (
                <button
                  onClick={() => { setParam('category', ''); setParam('min_price', ''); setParam('max_price', '') }}
                  className="text-[#D4AF37] hover:underline text-sm mt-3 block mx-auto"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {result.results.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              <Pagination
                page={page}
                totalPages={result.total_pages}
                onChange={(p) => setParam('page', String(p))}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default MarketplacePage
