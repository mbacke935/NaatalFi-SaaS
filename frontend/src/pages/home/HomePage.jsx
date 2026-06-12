import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiSearch, FiArrowRight, FiShield, FiTruck, FiUsers } from 'react-icons/fi'
import { getFeaturedProducts, getMarketplaceCategories } from '../../services/marketplace'
import { useMeta } from '../../hooks/useMeta'

// ── Product card ──────────────────────────────────────────────────────
function ProductCard({ product }) {
  return (
    <Link
      to={`/marketplace/${product.slug}`}
      className="group bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden hover:border-[#D4AF37]/50 transition-all hover:-translate-y-0.5"
    >
      <div className="aspect-square bg-[#2a2a3a] overflow-hidden">
        {product.cover_image ? (
          <img
            src={product.cover_image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 text-4xl">📦</div>
        )}
      </div>
      <div className="p-3">
        {product.category_name && (
          <p className="text-xs text-gray-500 mb-1">{product.category_name}</p>
        )}
        <h3 className="text-white text-sm font-medium line-clamp-2 leading-snug">{product.name}</h3>
        <p className="text-[#D4AF37] font-bold mt-1 text-sm">
          {Number(product.price).toLocaleString('fr-SN')} FCFA
        </p>
        <p className="text-gray-600 text-xs mt-0.5">{product.vendor_name}</p>
      </div>
    </Link>
  )
}

function HomePage() {
  useMeta({
    title: 'NaatalFi — Marketplace sénégalaise',
    description: 'Découvrez les meilleures boutiques et produits du Sénégal sur NaatalFi.',
  })

  const navigate               = useNavigate()
  const [q, setQ]              = useState('')
  const [featured, setFeatured]= useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    getFeaturedProducts().then(({ data }) => setFeatured(data)).catch(() => {})
    getMarketplaceCategories().then(({ data }) => setCategories(data)).catch(() => {})
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
          <p className="text-[#D4AF37] text-sm font-semibold tracking-widest uppercase mb-4">
            Marketplace sénégalaise
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Découvrez les meilleures<br />
            <span className="text-[#D4AF37]">boutiques du Sénégal</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
            Achetez directement auprès de vendeurs locaux vérifiés — mode, artisanat, électronique, alimentation et bien plus.
          </p>

          <form onSubmit={handleSearch} className="max-w-lg mx-auto flex gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un produit ou une boutique..."
                className="w-full bg-[#16161E] border border-[#2a2a3a] rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold px-6 py-3.5 rounded-xl transition text-sm whitespace-nowrap"
            >
              Rechercher
            </button>
          </form>

          {/* Trust stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <FiUsers size={15} className="text-[#D4AF37]" />
              500+ vendeurs vérifiés
            </span>
            <span className="hidden sm:block text-[#2a2a3a]">|</span>
            <span className="flex items-center gap-2">
              <FiTruck size={15} className="text-[#D4AF37]" />
              Livraison dans tout le Sénégal
            </span>
            <span className="hidden sm:block text-[#2a2a3a]">|</span>
            <span className="flex items-center gap-2">
              <FiShield size={15} className="text-[#D4AF37]" />
              Paiement 100% sécurisé
            </span>
          </div>
        </div>
      </section>

      {/* ── Catégories ── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Catégories</h2>
            <Link to="/marketplace" className="text-sm text-[#D4AF37] hover:underline flex items-center gap-1">
              Tout voir <FiArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                to={`/marketplace?category=${cat.slug}`}
                className="group bg-[#16161E] border border-[#2a2a3a] rounded-xl p-4 text-center hover:border-[#D4AF37]/50 transition-all hover:-translate-y-0.5"
              >
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-10 h-10 rounded-lg object-cover mx-auto mb-2" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#2a2a3a] mx-auto mb-2" />
                )}
                <p className="text-white text-xs font-medium line-clamp-2 leading-snug">{cat.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Produits vedettes ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Produits vedettes</h2>
          <Link to="/marketplace" className="text-sm text-[#D4AF37] hover:underline flex items-center gap-1">
            Voir tout <FiArrowRight size={14} />
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
            <p className="text-gray-500">Aucun produit disponible pour l'instant.</p>
            <Link to="/register" className="text-[#D4AF37] hover:underline text-sm mt-3 block">
              Devenir vendeur →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* ── CTA Vendeur ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Vous vendez des produits ?
          </h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            Rejoignez NaatalFi et vendez à des milliers de clients à travers le Sénégal. Inscription gratuite.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold px-8 py-3.5 rounded-xl transition"
          >
            Créer ma boutique <FiArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
