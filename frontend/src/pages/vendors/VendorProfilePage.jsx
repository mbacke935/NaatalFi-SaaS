import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiStar, FiPackage, FiMapPin, FiPhone } from 'react-icons/fi'
import { getMarketplaceVendor, getVendorReviews } from '../../services/marketplace'
import { useMeta } from '../../hooks/useMeta'

function VendorProfilePage() {
  const { slug }              = useParams()
  const [vendor, setVendor]   = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useMeta({
    title:       vendor ? `Boutique ${vendor.name}` : undefined,
    description: vendor?.description?.slice(0, 160),
    image:       vendor?.logo,
  })

  useEffect(() => {
    setLoading(true)
    getMarketplaceVendor(slug)
      .then(({ data }) => setVendor(data))
      .catch((err) => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
    getVendorReviews(slug)
      .then(({ data }) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
  }, [slug])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-xl bg-[#16161E]" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-[#16161E] rounded" />
            <div className="h-4 w-32 bg-[#16161E] rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-[#16161E] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (notFound || !vendor) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-gray-500 text-lg mb-4">Boutique introuvable.</p>
        <Link to="/marketplace" className="text-[#D4AF37] hover:underline">← Retour à la marketplace</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Vendor header */}
      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <div className="w-20 h-20 rounded-xl bg-[#2a2a3a] overflow-hidden flex-shrink-0">
            {vendor.logo
              ? <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-gray-600 text-3xl">🏪</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{vendor.name}</h1>
              {Number(vendor.trust_score) > 0 && (
                <div className="flex items-center gap-1 text-[#D4AF37] text-sm bg-[#D4AF37]/10 px-2 py-0.5 rounded">
                  <FiStar size={12} />
                  <span>{vendor.trust_score}</span>
                </div>
              )}
            </div>
            {vendor.description && (
              <p className="text-gray-400 text-sm mt-1 line-clamp-2">{vendor.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-gray-500 text-sm">
                <FiPackage size={14} />
                {vendor.product_count} produit{vendor.product_count !== 1 ? 's' : ''}
              </span>
              {vendor.address && (
                <span className="flex items-center gap-1.5 text-gray-500 text-sm">
                  <FiMapPin size={14} />
                  {vendor.address}
                </span>
              )}
              {vendor.phone && (
                <span className="flex items-center gap-1.5 text-gray-500 text-sm">
                  <FiPhone size={14} />
                  {vendor.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <h2 className="text-lg font-bold text-white mb-5">Produits de la boutique</h2>
      {vendor.products.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
          <p className="text-gray-500">Cette boutique n'a pas encore de produits.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {vendor.products.map((p) => (
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
              </div>
            </Link>
          ))}
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-bold text-white mb-5">Avis clients</h2>
        {reviews.length === 0 ? (
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-8 text-center">
            <p className="text-sm text-gray-500">Aucun avis pour cette boutique.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {reviews.slice(0, 8).map((review) => (
              <article key={review.id} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="text-white font-medium">{review.author_name}</p>
                    <p className="text-xs text-gray-500">{review.product_name}</p>
                  </div>
                  <div className="flex items-center gap-0.5 text-[#D4AF37]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <FiStar key={index} size={14} fill={index < review.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="text-sm text-gray-400 line-clamp-3">{review.comment}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default VendorProfilePage
