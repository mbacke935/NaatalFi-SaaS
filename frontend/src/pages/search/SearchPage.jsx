import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { searchMarketplace } from '../../services/marketplace'
import { useMeta } from '../../hooks/useMeta'

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q    = searchParams.get('q') || ''
  const page = Number(searchParams.get('page') || 1)

  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [input, setInput]     = useState(q)

  useMeta({ title: q ? `Recherche : ${q}` : 'Recherche' })

  useEffect(() => {
    setInput(q)
    if (!q) { setResult(null); return }
    setLoading(true)
    searchMarketplace({ q, page })
      .then(({ data }) => setResult(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [q, page])

  const handleSearch = (e) => {
    e.preventDefault()
    const next = new URLSearchParams()
    if (input.trim()) next.set('q', input.trim())
    next.set('page', '1')
    setSearchParams(next)
  }

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(p))
    setSearchParams(next)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Search bar */}
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

      {/* Results header */}
      {q && !loading && result && (
        <p className="text-sm text-gray-500 mb-5">
          {result.count} résultat{result.count !== 1 ? 's' : ''} pour <span className="text-white">"{q}"</span>
        </p>
      )}

      {/* Loading skeleton */}
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

      {/* No query */}
      {!q && !loading && (
        <div className="text-center py-16 text-gray-500">
          <FiSearch size={40} className="mx-auto mb-4 opacity-40" />
          <p>Tapez un mot-clé pour rechercher des produits.</p>
        </div>
      )}

      {/* No results */}
      {q && !loading && result?.results.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">Aucun résultat pour "{q}"</p>
          <p className="text-sm mb-6">Essayez avec d'autres termes ou parcourez la marketplace.</p>
          <Link to="/marketplace" className="text-[#D4AF37] hover:underline text-sm">Voir tous les produits →</Link>
        </div>
      )}

      {/* Results grid */}
      {!loading && result?.results.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {result.results.map((p) => (
              <Link key={p.id} to={`/marketplace/${p.slug}`}
                className="group bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden hover:border-[#D4AF37]/50 transition-all hover:-translate-y-0.5"
              >
                <div className="aspect-square bg-[#2a2a3a] overflow-hidden">
                  {p.cover_image
                    ? <img src={p.cover_image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-700 text-4xl">📦</div>
                  }
                </div>
                <div className="p-3">
                  {p.category_name && <p className="text-xs text-gray-500 mb-0.5">{p.category_name}</p>}
                  <h3 className="text-white text-sm font-medium line-clamp-2 leading-snug">{p.name}</h3>
                  <p className="text-[#D4AF37] font-bold mt-1 text-sm">{Number(p.price).toLocaleString('fr-SN')} FCFA</p>
                  <p className="text-gray-600 text-xs mt-0.5">{p.vendor_name}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {result.total_pages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-10">
              <button onClick={() => setPage(page - 1)} disabled={!result.has_prev}
                className="p-2 rounded-lg border border-[#2a2a3a] text-gray-400 hover:text-white disabled:opacity-30 transition"
              >
                <FiChevronLeft size={16} />
              </button>
              {Array.from({ length: result.total_pages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2)
                .map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${p === page ? 'bg-[#D4AF37] text-black' : 'border border-[#2a2a3a] text-gray-400 hover:text-white'}`}
                  >
                    {p}
                  </button>
                ))
              }
              <button onClick={() => setPage(page + 1)} disabled={!result.has_next}
                className="p-2 rounded-lg border border-[#2a2a3a] text-gray-400 hover:text-white disabled:opacity-30 transition"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SearchPage
