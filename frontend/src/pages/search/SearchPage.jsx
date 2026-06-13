import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import { searchMarketplace } from '../../services/marketplace'
import { useMeta } from '../../hooks/useMeta'

function ProductResultCard({ product }) {
  return (
    <Link
      to={`/marketplace/${product.slug}`}
      className="group bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden hover:border-[#D4AF37]/50 transition-all hover:-translate-y-0.5"
    >
      <div className="aspect-[4/3] bg-[#0B0B0F] overflow-hidden">
        {product.cover_image ? (
          <img src={product.cover_image} alt={product.name} className="w-full h-full object-contain p-2" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs font-semibold">IMG</div>
        )}
      </div>
      <div className="p-3">
        {product.category_name && <p className="text-xs text-gray-500 mb-0.5">{product.category_name}</p>}
        <h3 className="text-white text-sm font-medium line-clamp-2 leading-snug">{product.name}</h3>
        <p className="text-[#D4AF37] font-bold mt-1 text-sm">{Number(product.price).toLocaleString('fr-SN')} FCFA</p>
        <p className="text-gray-600 text-xs mt-0.5">{product.vendor_name}</p>
      </div>
    </Link>
  )
}

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [input, setInput] = useState(q)

  useMeta({ title: q ? `Recherche : ${q}` : 'Recherche' })

  const load = useCallback((cursor = null, append = false) => {
    if (!q) {
      setResult(null)
      return
    }

    append ? setLoadingMore(true) : setLoading(true)
    const params = { q }
    if (cursor) params.cursor = cursor

    searchMarketplace(params)
      .then(({ data }) => {
        setResult((prev) => append && prev
          ? { ...data, results: [...prev.results, ...data.results] }
          : data
        )
      })
      .catch(() => {})
      .finally(() => append ? setLoadingMore(false) : setLoading(false))
  }, [q])

  useEffect(() => {
    setInput(q)
    load()
  }, [q, load])

  const handleSearch = (e) => {
    e.preventDefault()
    const next = new URLSearchParams()
    if (input.trim()) next.set('q', input.trim())
    setSearchParams(next)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Rechercher un produit, une boutique..."
            autoFocus
            className="w-full bg-[#16161E] border border-[#2a2a3a] rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
          />
        </div>
        <button
          type="submit"
          className="bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold px-6 py-3.5 rounded-xl transition whitespace-nowrap"
        >
          Rechercher
        </button>
      </form>

      {q && !loading && result && (
        <p className="text-sm text-gray-500 mb-5">
          {result.count} resultat{result.count !== 1 ? 's' : ''} pour <span className="text-white">"{q}"</span>
        </p>
      )}

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
      )}

      {!q && !loading && (
        <div className="text-center py-16 text-gray-500">
          <FiSearch size={40} className="mx-auto mb-4 opacity-40" />
          <p>Tapez un mot-cle pour rechercher des produits.</p>
        </div>
      )}

      {q && !loading && result?.results.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">Aucun resultat pour "{q}"</p>
          <p className="text-sm mb-6">Essayez avec d'autres termes ou parcourez la marketplace.</p>
          <Link to="/marketplace" className="text-[#D4AF37] hover:underline text-sm">Voir tous les produits</Link>
        </div>
      )}

      {!loading && result?.results.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {result.results.map((product) => <ProductResultCard key={product.id} product={product} />)}
          </div>

          {result.has_next && (
            <div className="flex justify-center mt-10">
              <button
                type="button"
                onClick={() => load(result.next_cursor, true)}
                disabled={loadingMore}
                className="px-5 py-2.5 border border-[#2a2a3a] text-gray-300 hover:text-white hover:border-[#D4AF37] rounded-lg transition disabled:opacity-50"
              >
                {loadingMore ? 'Chargement...' : 'Voir plus'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SearchPage
