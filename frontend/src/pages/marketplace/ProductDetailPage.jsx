import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiStar, FiShoppingCart, FiPackage, FiCheck, FiMinus, FiPlus, FiHeart } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getMarketplaceProduct, getProductReviews } from '../../services/marketplace'
import { addFavorite, removeFavorite, getFavorites } from '../../services/account'
import { useMeta } from '../../hooks/useMeta'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import ProductPhoto from '../../components/ProductPhoto'

function ProductDetailPage() {
  const { slug }               = useParams()
  const [product, setProduct]  = useState(null)
  const [loading, setLoading]  = useState(true)
  const [notFound, setNotFound]= useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [selectedVariantId, setSelectedVariantId] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState([])
  const setItem = useCartStore((s) => s.setItem)
  const [added, setAdded] = useState(false)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  useMeta({
    title:       product?.name,
    description: product?.description?.slice(0, 160),
    image:       product?.images?.[0]?.image_url,
  })

  useEffect(() => {
    setLoading(true)
    setActiveImage(0)
    setSelectedVariantId(null)
    setQuantity(1)
    setIsFavorited(false)
    getMarketplaceProduct(slug)
      .then(({ data }) => {
        setProduct(data)
        const defaultVariant = data.variants?.find((variant) => variant.stock > 0) ?? data.variants?.[0]
        if (defaultVariant) {
          setSelectedVariantId(defaultVariant.id)
        }
        if (isAuthenticated) {
          getFavorites().then(({ data: favs }) => {
            const list = Array.isArray(favs) ? favs : (favs?.results ?? [])
            setIsFavorited(list.some((f) => f.product?.id === data.id))
          }).catch(() => {})
        }
      })
      .catch((err) => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
    getProductReviews(slug)
      .then(({ data }) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
  }, [slug, isAuthenticated])

  useEffect(() => {
    if (!product?.images || product.images.length <= 1) return undefined
    const timer = window.setInterval(() => {
      setActiveImage((index) => (index + 1) % product.images.length)
    }, 3200)
    return () => window.clearInterval(timer)
  }, [product?.images])

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

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? null
  const basePrice = Number(product.price)
  const variantPrice = Number(selectedVariant?.price_delta ?? 0)
  const finalPrice = selectedVariant && variantPrice > 0 ? variantPrice : basePrice
  const canAddToCart = product.variants.length === 0 || Boolean(selectedVariant)

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) { toast.error('Connectez-vous pour gérer vos favoris.'); return }
    setFavLoading(true)
    try {
      if (isFavorited) {
        await removeFavorite(product.id)
        setIsFavorited(false)
        toast.success('Retiré des favoris.')
      } else {
        await addFavorite(product.id)
        setIsFavorited(true)
        toast.success('Ajouté aux favoris !')
      }
    } catch {
      toast.error('Impossible de modifier les favoris.')
    } finally {
      setFavLoading(false)
    }
  }

  const handleAddToCart = () => {
    const primaryVariant = selectedVariant
    const variantLabel = primaryVariant ? `${primaryVariant.name}: ${primaryVariant.value}` : ''

    setItem({
      product_id:   product.id,
      product_name: product.name,
      product_slug: product.slug,
      cover_image:  product.images[0]?.image_url ?? null,
      vendor_id:    product.vendor,
      vendor_name:  product.vendor_name,
      vendor_slug:  product.vendor_slug,
      variant_id:   primaryVariant?.id ?? null,
      variant_label: variantLabel,
      unit_price:   finalPrice,
      quantity,
    })
    toast.success(`${product.name} ajouté au panier !`)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

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
          <div className="relative mb-3">
            <ProductPhoto
              src={product.images[activeImage]?.image_url}
              alt={product.name}
              className="aspect-[4/3] max-h-[440px] border border-[#2a2a3a] rounded-xl"
              fallback={<FiPackage size={48} />}
            />
            {product.images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {product.images.map((img, index) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`h-1.5 rounded-full transition-all ${index === activeImage ? 'w-5 bg-[#D4AF37]' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                    aria-label={`Image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg flex-shrink-0 border-2 transition ${i === activeImage ? 'border-[#D4AF37]' : 'border-transparent'}`}
                >
                  <ProductPhoto src={img.image_url} alt="" className="w-full h-full rounded-md" fallback="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category_name && <p className="text-sm text-gray-500 mb-2">{product.category_name}</p>}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">{product.name}</h1>

          {Number(product.total_reviews) > 0 && (
            <div className="flex items-center gap-2 text-sm mb-4">
              <div className="flex items-center gap-1 text-[#D4AF37]">
                <FiStar size={15} fill="currentColor" />
                <span className="font-semibold">{product.average_rating}</span>
              </div>
              <span className="text-gray-500">
                {product.total_reviews} avis vérifié{product.total_reviews > 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-[#D4AF37]">{finalPrice.toLocaleString('fr-SN')} FCFA</span>
          </div>

          {product.description && (
            <p className="text-gray-400 text-sm leading-relaxed mb-6 whitespace-pre-line">{product.description}</p>
          )}

          {/* Variantes */}
          {product.variants.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2 font-medium">Option</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((opt) => (
                  <button key={opt.id}
                    onClick={() => setSelectedVariantId(opt.id)}
                    disabled={opt.stock === 0}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                      selectedVariantId === opt.id
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white'
                        : opt.stock === 0
                        ? 'border-[#2a2a3a] text-gray-600 cursor-not-allowed line-through'
                        : 'border-[#2a2a3a] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {opt.name === opt.value ? opt.value : `${opt.name}: ${opt.value}`}
                    {Number(opt.price_delta) > 0 && <span className="text-gray-500 ml-1 text-xs">{Number(opt.price_delta).toLocaleString('fr-SN')} FCFA</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedVariant && (
            <p className={`text-sm mb-4 ${selectedVariant.stock === 0 ? 'text-red-400' : 'text-green-400'}`}>
              {selectedVariant.stock === 0 ? 'Rupture de stock' : `${selectedVariant.stock} en stock`}
            </p>
          )}

          {/* Quantity selector */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-400">Quantité</span>
            <div className="flex items-center gap-2 bg-[#16161E] border border-[#2a2a3a] rounded-lg px-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition"
              >
                <FiMinus size={13} />
              </button>
              <span className="text-white font-semibold w-6 text-center text-sm">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition"
              >
                <FiPlus size={13} />
              </button>
            </div>
          </div>

          {/* Add to cart */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`flex-1 flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl text-sm transition ${
                canAddToCart
                  ? added
                    ? 'bg-green-600 text-white'
                    : 'bg-[#D4AF37] hover:bg-[#c49e30] text-black'
                  : 'bg-[#D4AF37]/20 text-[#D4AF37]/50 border border-[#D4AF37]/20 cursor-not-allowed'
              }`}
            >
              {added ? <><FiCheck size={18} /> Ajouté au panier</> : <><FiShoppingCart size={18} /> Ajouter au panier</>}
            </button>
            <button
              onClick={handleToggleFavorite}
              disabled={favLoading}
              aria-label={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              className={`w-14 flex items-center justify-center rounded-xl border transition ${
                isFavorited
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
                  : 'border-[#2a2a3a] text-gray-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10'
              }`}
            >
              <FiHeart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
            </button>
          </div>

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
      <section className="mb-14">
        <h2 className="text-lg font-bold text-white mb-5">Avis clients</h2>
        {reviews.length === 0 ? (
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-8 text-center">
            <p className="text-sm text-gray-500">Aucun avis pour ce produit.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <article key={review.id} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="text-white font-medium">{review.author_name}</p>
                    <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex items-center gap-0.5 text-[#D4AF37]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <FiStar key={index} size={14} fill={index < review.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="text-sm text-gray-400">{review.comment}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      {product.related?.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-5">Produits similaires</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {product.related.map((p) => (
              <Link key={p.id} to={`/marketplace/${p.slug}`}
                className="group bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden hover:border-[#D4AF37]/50 transition-all hover:-translate-y-0.5"
              >
                <ProductPhoto src={p.cover_image} alt={p.name} className="aspect-[4/3]" fallback="IMG" />
                <div className="hidden">
                  {p.cover_image
                    ? <div className="product-image-bg" role="img" aria-label={p.name} style={{ backgroundImage: `url("${p.cover_image}")` }} />
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
