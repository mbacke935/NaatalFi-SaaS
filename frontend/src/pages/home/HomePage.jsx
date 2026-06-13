import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiShoppingBag } from 'react-icons/fi'
import { getFeaturedProducts, getMarketplaceCategories, getMarketplaceVendors } from '../../services/marketplace'
import { getPublicPlatformSettings } from '../../services/platform'
import { useMeta } from '../../hooks/useMeta'

const fallbackHeroImage = 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=1800&q=85'

const defaultCategoryPosters = [
  {
    title: 'Mode & vetements',
    query: 'mode vetements',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
    keywords: ['mode', 'vetement', 'vêtement', 'fashion', 'habit'],
  },
  {
    title: 'Beaute',
    query: 'beaute',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80',
    keywords: ['beaute', 'beauté', 'cosmetique', 'cosmétique', 'soin'],
  },
  {
    title: 'Accessoires',
    query: 'accessoires',
    image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=900&q=80',
    keywords: ['accessoire', 'bijou', 'sac'],
  },
  {
    title: 'Maison & deco',
    query: 'maison deco',
    image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=900&q=80',
    keywords: ['maison', 'deco', 'déco', 'decoration', 'décoration'],
  },
  {
    title: 'Artisanat',
    query: 'artisanat',
    image: 'https://images.unsplash.com/photo-1590845947698-8924d7409b56?auto=format&fit=crop&w=900&q=80',
    keywords: ['artisanat', 'artisan', 'fait main', 'handmade'],
  },
  {
    title: 'Electronique',
    query: 'electronique',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    keywords: ['electronique', 'électronique', 'tech', 'telephone', 'téléphone'],
  },
]

function ProductCard({ product }) {
  const images = product.images?.length ? product.images : (product.cover_image ? [product.cover_image] : [])
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return undefined
    const timer = window.setInterval(() => {
      setImageIndex((index) => (index + 1) % images.length)
    }, 2600)
    return () => window.clearInterval(timer)
  }, [images.length])

  return (
    <Link
      to={`/marketplace/${product.slug}`}
      className="group bg-[#16161E] border border-[#2a2a3a] rounded-lg overflow-hidden hover:border-[#D4AF37]/50 transition-all hover:-translate-y-0.5"
    >
      <div className="product-image-frame aspect-[4/3] relative">
        {images.length > 0 ? (
          <div
            className="product-image-bg transition-opacity duration-500"
            role="img"
            aria-label={product.name}
            style={{ backgroundImage: `url("${images[imageIndex]}")` }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 text-sm">Image</div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {images.map((_, index) => (
              <span key={index} className={`h-1 w-1.5 rounded-full ${index === imageIndex ? 'bg-[#D4AF37]' : 'bg-white/30'}`} />
            ))}
          </div>
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

function VendorCard({ vendor }) {
  return (
    <Link
      to={`/vendors/${vendor.slug}`}
      className="group bg-[#16161E] border border-[#2a2a3a] rounded-lg p-4 flex items-center gap-3 hover:border-[#D4AF37]/50 transition-all hover:-translate-y-0.5"
    >
      <div className="w-12 h-12 rounded-lg bg-[#2a2a3a] flex-shrink-0 overflow-hidden flex items-center justify-center">
        {vendor.logo
          ? <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover" />
          : <FiShoppingBag className="text-gray-600" size={18} />}
      </div>
      <div className="min-w-0">
        <p className="text-white text-sm font-medium truncate group-hover:text-[#D4AF37] transition">{vendor.name}</p>
        <p className="text-gray-500 text-xs mt-0.5">
          {vendor.product_count ?? 0} produit{(vendor.product_count ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>
    </Link>
  )
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function HomePage() {
  useMeta({
    title: 'NaatalFi - Marketplace senegalaise',
    description: 'Achetez local et decouvrez les boutiques senegalaises sur NaatalFi.',
  })

  const [featured, setFeatured] = useState([])
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [vendors, setVendors] = useState([])
  const [loadingVendors, setLoadingVendors] = useState(true)
  const [categories, setCategories] = useState([])
  const [platformSettings, setPlatformSettings] = useState(null)

  useEffect(() => {
    getFeaturedProducts()
      .then(({ data }) => setFeatured(Array.isArray(data) ? data : (data?.results ?? [])))
      .catch(() => {})
      .finally(() => setLoadingFeatured(false))
    getMarketplaceVendors()
      .then(({ data }) => setVendors(Array.isArray(data) ? data : (data?.results ?? [])))
      .catch(() => {})
      .finally(() => setLoadingVendors(false))
    getMarketplaceCategories().then(({ data }) => setCategories(data)).catch(() => {})
    getPublicPlatformSettings().then(({ data }) => setPlatformSettings(data)).catch(() => {})
  }, [])

  const posters = useMemo(() => {
    const configured = Array.isArray(platformSettings?.popular_categories)
      ? platformSettings.popular_categories.filter((item) => item?.title && item?.image)
      : []
    const source = configured.length > 0 ? configured : defaultCategoryPosters

    return source.map((poster) => {
      if (poster.href) {
        return poster
      }

      const match = categories.find((cat) => {
        const haystack = `${normalize(cat.name)} ${normalize(cat.slug)}`
        const keywords = poster.keywords || [poster.title, poster.query]
        return keywords.some((keyword) => haystack.includes(normalize(keyword)))
      })
      return {
        ...poster,
        href: match?.slug
          ? `/marketplace?category=${match.slug}`
          : `/search?q=${encodeURIComponent(poster.query || poster.title)}`,
      }
    })
  }, [categories, platformSettings])

  const heroImage = platformSettings?.hero_image_url || fallbackHeroImage
  const commissionRate = platformSettings?.commission_rate || '8.00'

  return (
    <div>
      <section className="relative min-h-[560px] sm:min-h-[640px] lg:min-h-[680px] overflow-hidden">
        <img
          src={heroImage}
          alt="Selection de produits locaux"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0B0B0F] to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 min-h-[560px] sm:min-h-[640px] lg:min-h-[680px] flex items-center">
          <div className="max-w-3xl py-16 sm:py-20">
            <p className="text-[#D4AF37] text-sm font-semibold tracking-widest uppercase mb-4">
              Marketplace senegalaise
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 max-w-[12ch] sm:max-w-none">
              Achetez local. Vendez partout au Senegal.
            </h1>
            <p className="text-gray-200 text-lg sm:text-xl max-w-2xl leading-relaxed mb-9">
              NaatalFi connecte les boutiques senegalaises aux clients, avec paiement securise,
              suivi des commandes et livraison organisee.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold px-6 py-3 rounded-lg transition"
              >
                Explorer la marketplace <FiArrowRight size={16} />
              </Link>
              <Link
                to="/register?role=VENDOR"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                Devenir vendeur
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="bg-[#16161E] border border-[#D4AF37]/30 rounded-lg px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-white text-sm sm:text-base font-medium">
            Lancement NaatalFi : inscription vendeur gratuite, produits illimites, commission fixe de {commissionRate}%.
          </p>
          <Link
            to="/register?role=VENDOR"
            className="inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold px-4 py-2.5 rounded-lg transition text-sm whitespace-nowrap"
          >
            Creer ma boutique <FiArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 overflow-hidden">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Categories populaires</h2>
            <p className="text-sm text-gray-500 mt-1">Des affiches pour trouver rapidement ce que vous cherchez.</p>
          </div>
          <Link to="/marketplace" className="hidden sm:inline-flex text-sm text-[#D4AF37] hover:underline items-center gap-1">
            Tout voir <FiArrowRight size={14} />
          </Link>
        </div>

        <div className="home-category-track flex gap-4">
          {[...posters, ...posters].map((cat, index) => (
            <Link
              key={`${cat.title}-${index}`}
              to={cat.href}
              className="group relative min-h-[220px] w-[78vw] max-w-[340px] sm:w-[320px] lg:w-[360px] xl:w-[390px] shrink-0 rounded-lg overflow-hidden border border-[#2a2a3a] hover:border-[#D4AF37]/60 transition will-change-transform"
              style={{ animationDelay: `${(index % posters.length) * 80}ms` }}
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-white text-xl font-bold">{cat.title}</h3>
                <p className="text-gray-300 text-sm mt-1 inline-flex items-center gap-1">
                  Decouvrir <FiArrowRight size={14} />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-bold text-white">Produits vedettes</h2>
          <Link to="/marketplace" className="text-sm text-[#D4AF37] hover:underline flex items-center gap-1">
            Voir tout <FiArrowRight size={14} />
          </Link>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#16161E] border border-[#2a2a3a] rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-square bg-[#2a2a3a]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-[#2a2a3a] rounded w-3/4" />
                  <div className="h-4 bg-[#2a2a3a] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-lg p-12 text-center">
            <p className="text-gray-500">Aucun produit disponible pour l'instant.</p>
            <Link to="/register?role=VENDOR" className="text-[#D4AF37] hover:underline text-sm mt-3 block">
              Devenir vendeur
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>

      {/* Boutiques à découvrir */}
      {(loadingVendors || vendors.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-xl font-bold text-white">Boutiques à découvrir</h2>
            <Link to="/marketplace" className="text-sm text-[#D4AF37] hover:underline flex items-center gap-1">
              Voir tout <FiArrowRight size={14} />
            </Link>
          </div>

          {loadingVendors ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[76px] bg-[#16161E] border border-[#2a2a3a] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {vendors.slice(0, 8).map((vendor) => <VendorCard key={vendor.id} vendor={vendor} />)}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default HomePage
