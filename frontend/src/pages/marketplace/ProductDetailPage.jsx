import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiStar, FiShoppingCart, FiPackage } from 'react-icons/fi'
import { getMarketplaceProduct } from '../../services/marketplace'
import { useMeta } from '../../hooks/useMeta'

function ProductDetailPage() {
  const { slug }               = useParams()
  const [product, setProduct]  = useState(null)
  const [loading, setLoading]  = useState(true)
  const [notFound, setNotFound]= useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [selectedVariants, setSelectedVariants] = useState({})

  useMeta({
    title:       product?.name,
    description: product?.description?.slice(0, 160),
    image:       product?.images?.[0]?.image_url,
  })

  useEffect(() => {
    setLoading(true)
    setActiveImage(0)
    setSelectedVariants({})
    getMarketplaceProduct(slug)
      .then(({ data }) => setProduct(data))
      .catch((err) => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-2 gap-10 animate-pulse">
          <div className="aspect-square bg-[#16161E] rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-[#16161E] rounded w-3/4" />
            <div className="h-6 bg-[#16161E] rounded w-1/3" />
            <div className="h-24 bg-[#16161E] rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-gray-500 text-lg mb-4">Produit introuvable.</p>
        <Link to="/marketplace" className="text-[#D4AF37] hover:underline">← Retour à la marketplace</Link>
      </div>
    )
  }

  const variantGroups = product.variants.reduce((acc, v) => {
    if (!acc[v.name]) acc[v.name] = []
    acc[v.name].push(v)
    return acc
  }, {})

  const getVariantForType = (typeName) =>
    product.variants.find((v) => v.name === typeName && v.value === selectedVariants[typeName])

  const totalDelta = Object.keys(selectedVariants).reduce((sum, name) => {
    const v = getVariantForType(name)
    return sum + (v ? Number(v.price_delta) : 0)
  }, 0)
  const finalPrice = Number(product.price) + totalDelta
  const selectedVariantObjects = Object.keys(selectedVariants).map(getVariantForType).filter(Boolean)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
        <Link to="/marketplace" className="hover:text-white transition">Marketplace</Link>
        {product.category_name && (
          <><span>/</span>
          <Link to={`/marketplace?category=${product.category_slug}`} className="hover:text-white transition">
            {product.category_name}
          </Link></>
        )}
        <span>/</span>
        <span className="text-gray-300 line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10 mb-16">
        {/* Images */}
        <div>
          <div className="aspect-square bg-[#16161E] rounded-xl overflow-hidden mb-3">
            {product.images.length > 0 ? (
              <img src={product.images[activeImage]?.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-700"><FiPackage size={48} /></div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${i === activeImage ? 'border-[#D4AF37]' : 'border-transparent'}`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category_name && <p className="text-sm text-gray-500 mb-2">{product.category_name}</p>}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">{product.name}</h1>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-[#D4AF37]">{finalPrice.toLocaleString('fr-SN')} FCFA</span>
            {totalDelta !== 0 && (
              <span className="text-sm text-gray-500 line-through">{Number(product.price).toLocaleString('fr-SN')} FCFA</span>
            )}
          </div>

          {product.description && (
            <p className="text-gray-400 text-sm leading-relaxed mb-6 whitespace-pre-line">{product.description}</p>
          )}

          {/* Variantes */}
          {Object.entries(variantGroups).map(([name, options]) => (
            <div key={name} className="mb-4">
              <p className="text-sm text-gray-400 mb-2 font-medium">{name}</p>
              <div className="flex flex-wrap gap-2">
                {options.map((opt) => (
                  <button key={opt.id}
                    onClick={() => setSelectedVariants((s) => ({ ...s, [name]: opt.value }))}
                    disabled={opt.stock === 0}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                      selectedVariants[name] === opt.value
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white'
                        : opt.stock === 0
                        ? 'border-[#2a2a3a] text-gray-600 cursor-not-allowed line-through'
                        : 'border-[#2a2a3a] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {opt.value}
                    {opt.price_delta > 0 && <span className="text-gray-500 ml-1 text-xs">+{Number(opt.price_delta).toLocaleString('fr-SN')}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {selectedVariantObjects.length > 0 && (
            <p className={`text-sm mb-4 ${selectedVariantObjects.some((v) => v.stock === 0) ? 'text-red-400' : 'text-green-400'}`}>
              {selectedVariantObjects.some((v) => v.stock === 0)
                ? 'Rupture de stock'
                : `${Math.min(...selectedVariantObjects.map((v) => v.stock))} en stock`}
            </p>
          )}

          {/* Add to cart — Phase 7 */}
          <button disabled
            className="w-full flex items-center justify-center gap-2 bg-[#D4AF37]/20 text-[#D4AF37]/50 font-semibold py-3.5 rounded-xl border border-[#D4AF37]/20 cursor-not-allowed text-sm mb-6"
          >
            <FiShoppingCart size={18} /> Ajouter au panier (bientôt disponible)
          </button>

          {/* Vendor card */}
          <Link to={`/vendors/${product.vendor_slug || ''}`}
            className="flex items-center gap-3 p-4 bg-[#16161E] border border-[#2a2a3a] rounded-xl hover:border-[#D4AF37]/40 transition"
          >
            <div className="w-10 h-10 rounded-lg bg-[#2a2a3a] flex-shrink-0 overflow-hidden">
              {product.vendor_logo && <img src={product.vendor_logo} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">{product.vendor_name}</p>
              <p className="text-gray-500 text-xs">Voir la boutique →</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Produits similaires */}
      {product.related?.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-5">Produits similaires</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {product.related.map((p) => (
              <Link key={p.id} to={`/marketplace/${p.slug}`}
                className="group bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden hover:border-[#D4AF37]/50 transition-all hover:-translate-y-0.5"
              >
                <div className="aspect-square bg-[#2a2a3a] overflow-hidden">
                  {p.cover_image
                    ? <img src={p.cover_image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-700">📦</div>
                  }
                </div>
                <div className="p-2.5">
                  <p className="text-white text-xs font-medium line-clamp-2">{p.name}</p>
                  <p className="text-[#D4AF37] text-xs font-bold mt-1">{Number(p.price).toLocaleString('fr-SN')} FCFA</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default ProductDetailPage
