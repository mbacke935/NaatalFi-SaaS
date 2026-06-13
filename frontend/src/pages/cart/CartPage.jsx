import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiTrash2, FiMinus, FiPlus, FiShoppingCart, FiArrowRight, FiAlertCircle } from 'react-icons/fi'
import useCartStore, { normalizeCartItems } from '../../store/cartStore'
import { validateCart } from '../../services/orders'
import { getMarketplaceProduct } from '../../services/marketplace'
import { useMeta } from '../../hooks/useMeta'

function CartPage() {
  useMeta({ title: 'Mon panier' })
  const navigate = useNavigate()

  const items          = useCartStore((s) => s.items)
  const removeItem     = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const setItem         = useCartStore((s) => s.setItem)
  const totalPrice     = useCartStore((s) => s.totalPrice)
  const byVendor       = useCartStore((s) => s.byVendor)
  const countItems     = useCartStore((s) => s.countItems)

  const total  = totalPrice()
  const count  = countItems()
  const groups = byVendor()
  const normalizedItems = useMemo(() => normalizeCartItems(items), [items])
  const refreshSignature = normalizedItems
    .map((i) => `${i.product_slug}:${i.variant_id ?? 'x'}:${i.quantity}`)
    .join('|')
  const lastRefreshRef = useRef('')

  const [validating,   setValidating]   = useState(false)
  const [stockErrors,  setStockErrors]  = useState([])

  useEffect(() => {
    if (!normalizedItems.length || refreshSignature === lastRefreshRef.current) return
    lastRefreshRef.current = refreshSignature

    normalizedItems.forEach((item) => {
      if (!item.product_slug) return
      getMarketplaceProduct(item.product_slug)
        .then(({ data }) => {
          const variant = data.variants?.find((v) => v.id === item.variant_id)
          const variantPrice = Number(variant?.price_delta ?? 0)
          const unitPrice = variant && variantPrice > 0 ? variantPrice : Number(data.price)
          if (Number(item.unit_price) !== unitPrice) {
            setItem({
              ...item,
              product_name: data.name,
              vendor_id: data.vendor,
              vendor_name: data.vendor_name,
              vendor_slug: data.vendor_slug,
              cover_image: data.images?.[0]?.image_url ?? item.cover_image ?? null,
              variant_label: variant ? `${variant.name}: ${variant.value}` : '',
              unit_price: unitPrice,
              quantity: item.quantity,
            })
          }
        })
        .catch(() => {})
    })
  }, [normalizedItems, refreshSignature, setItem])

  const handleCheckout = async () => {
    setStockErrors([])
    setValidating(true)
    try {
      const payload = normalizeCartItems(items).map((i) => ({
        product_id: i.product_id,
        variant_id: i.variant_id ?? null,
        quantity:   i.quantity,
      }))
      await validateCart(payload)
      navigate('/checkout')
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors?.length) {
        setStockErrors(errors)
        toast.error('Certains articles ne sont plus disponibles.')
      } else {
        toast.error('Erreur lors de la validation du panier.')
      }
    } finally {
      setValidating(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <FiShoppingCart size={48} className="text-gray-700 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Votre panier est vide</h1>
        <p className="text-gray-500 text-sm mb-8">
          Parcourez la marketplace et ajoutez des produits à votre panier.
        </p>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold px-6 py-3 rounded-xl transition"
        >
          Voir la marketplace <FiArrowRight size={16} />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">
        Mon panier <span className="text-gray-500 font-normal text-base">({count} article{count !== 1 ? 's' : ''})</span>
      </h1>

      {/* Erreurs de stock */}
      {stockErrors.length > 0 && (
        <div className="mb-5 bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiAlertCircle size={16} className="text-red-400" />
            <p className="text-red-400 text-sm font-medium">Articles insuffisants en stock :</p>
          </div>
          <ul className="space-y-1">
            {stockErrors.map((e, i) => (
              <li key={i} className="text-red-300 text-xs">
                {e.product_name} ({e.variant_label}) — demandé : {e.requested}, disponible : {e.available}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items */}
        <div className="flex-1 space-y-6">
          {groups.map((group) => (
            <div key={group.vendor_id} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2a3a] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <Link
                  to={`/vendors/${group.vendor_slug}`}
                  className="text-sm font-medium text-[#D4AF37] hover:underline"
                >
                  {group.vendor_name}
                </Link>
                <span className="text-xs text-gray-500">
                  {group.items.reduce((s, i) => s + i.quantity, 0)} article{group.items.length !== 1 ? 's' : ''}
                </span>
              </div>

              {group.items.map((item) => {
                const hasStockError = stockErrors.some(
                  (e) => e.product_id === item.product_id && e.variant_id === item.variant_id
                )
                return (
                  <div
                    key={`${item.product_id}-${item.variant_id ?? 'x'}`}
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 px-4 py-4 border-b border-[#2a2a3a] last:border-0 ${hasStockError ? 'bg-red-900/10' : ''}`}
                  >
                    {/* Image */}
                    <Link to={`/marketplace/${item.product_slug}`} className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-lg bg-[#2a2a3a] overflow-hidden">
                        {item.cover_image ? (
                          <img src={item.cover_image} alt={item.product_name} className="product-image-contain p-1" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700 text-xl">📦</div>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/marketplace/${item.product_slug}`}
                        className="text-white text-sm font-medium hover:text-[#D4AF37] transition line-clamp-1"
                      >
                        {item.product_name}
                      </Link>
                      {item.variant_label && (
                        <p className="text-gray-500 text-xs mt-0.5">{item.variant_label}</p>
                      )}
                      <p className="text-[#D4AF37] font-bold text-sm mt-1">
                        {(item.unit_price * item.quantity).toLocaleString('fr-SN')} FCFA
                      </p>
                      {hasStockError && (
                        <p className="text-red-400 text-xs mt-0.5 flex items-center gap-1">
                          <FiAlertCircle size={10} /> Stock insuffisant
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg border border-[#2a2a3a] text-gray-400 hover:text-white hover:border-gray-500 transition flex items-center justify-center"
                      >
                        <FiMinus size={12} />
                      </button>
                      <span className="text-white text-sm w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg border border-[#2a2a3a] text-gray-400 hover:text-white hover:border-gray-500 transition flex items-center justify-center"
                      >
                        <FiPlus size={12} />
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeItem(item.product_id, item.variant_id)}
                      className="text-gray-600 hover:text-red-400 transition flex-shrink-0 ml-auto sm:ml-0"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5 sticky top-24">
            <h2 className="text-white font-bold mb-4">Récapitulatif</h2>

            <div className="space-y-2 mb-4">
              {groups.map((g) => {
                const sub = g.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
                return (
                  <div key={g.vendor_id} className="flex justify-between text-sm">
                    <span className="text-gray-400 truncate mr-2">{g.vendor_name}</span>
                    <span className="text-white whitespace-nowrap">{sub.toLocaleString('fr-SN')} FCFA</span>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-[#2a2a3a] pt-3 mb-5">
              <div className="flex justify-between">
                <span className="text-white font-semibold">Total</span>
                <span className="text-[#D4AF37] font-bold text-lg">{total.toLocaleString('fr-SN')} FCFA</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={validating}
              className="w-full bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {validating ? 'Vérification...' : <>Commander <FiArrowRight size={16} /></>}
            </button>
            <Link
              to="/marketplace"
              className="block text-center text-sm text-gray-500 hover:text-gray-300 mt-3 transition"
            >
              Continuer mes achats
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
