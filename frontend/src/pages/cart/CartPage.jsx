import { Link, useNavigate } from 'react-router-dom'
import { FiTrash2, FiMinus, FiPlus, FiShoppingCart, FiArrowRight } from 'react-icons/fi'
import useCartStore from '../../store/cartStore'
import { useMeta } from '../../hooks/useMeta'

function CartPage() {
  useMeta({ title: 'Mon panier' })
  const navigate = useNavigate()

  const items         = useCartStore((s) => s.items)
  const removeItem    = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const totalPrice    = useCartStore((s) => s.totalPrice)
  const byVendor      = useCartStore((s) => s.byVendor)
  const countItems    = useCartStore((s) => s.countItems)

  const total  = totalPrice()
  const count  = countItems()
  const groups = byVendor()

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

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items */}
        <div className="flex-1 space-y-6">
          {groups.map((group) => (
            <div key={group.vendor_id} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2a3a] flex items-center justify-between">
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

              {group.items.map((item) => (
                <div
                  key={`${item.product_id}-${item.variant_id ?? 'x'}`}
                  className="flex items-center gap-4 px-4 py-4 border-b border-[#2a2a3a] last:border-0"
                >
                  {/* Image */}
                  <Link to={`/marketplace/${item.product_slug}`} className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg bg-[#2a2a3a] overflow-hidden">
                      {item.cover_image ? (
                        <img src={item.cover_image} alt={item.product_name} className="w-full h-full object-cover" />
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
                    className="text-gray-600 hover:text-red-400 transition flex-shrink-0"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
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
              onClick={() => navigate('/checkout')}
              className="w-full bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              Commander <FiArrowRight size={16} />
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
