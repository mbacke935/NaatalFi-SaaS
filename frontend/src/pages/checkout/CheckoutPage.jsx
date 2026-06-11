import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiCheck } from 'react-icons/fi'
import { createOrder } from '../../services/orders'
import { initiatePayment } from '../../services/payments'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import { useMeta } from '../../hooks/useMeta'

function CheckoutPage() {
  useMeta({ title: 'Finaliser la commande' })

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)
  const totalPrice = useCartStore((s) => s.totalPrice)
  const byVendor = useCartStore((s) => s.byVendor)

  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h1 className="text-xl font-bold text-white mb-3">Connexion requise</h1>
        <p className="text-gray-400 text-sm mb-6">Vous devez etre connecte pour passer une commande.</p>
        <Link to="/login" className="bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold px-6 py-3 rounded-xl transition inline-block">
          Se connecter
        </Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-gray-500 mb-4">Votre panier est vide.</p>
        <Link to="/marketplace" className="text-[#D4AF37] hover:underline text-sm">
          Retour a la marketplace
        </Link>
      </div>
    )
  }

  const groups = byVendor()
  const total = totalPrice()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!address.trim()) {
      toast.error("L'adresse de livraison est requise.")
      return
    }

    setLoading(true)
    try {
      const payload = {
        delivery_address: address.trim(),
        notes: notes.trim(),
        items: items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id ?? null,
          quantity: item.quantity,
        })),
      }
      const { data: order } = await createOrder(payload)
      const { data: payment } = await initiatePayment(order.id)
      clearCart()
      toast.success('Redirection vers le paiement...')
      window.location.assign(payment.payment_url)
    } catch (err) {
      const msg = err.response?.data?.error || 'Une erreur est survenue.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition">
        <FiArrowLeft size={14} /> Retour au panier
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Finaliser la commande</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="flex-1 space-y-5">
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Adresse de livraison</h2>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              rows={3}
              placeholder="Quartier, rue, numero - Ville, Senegal"
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition resize-none text-sm"
            />
          </div>

          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Instructions (optionnel)</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Instructions particulieres pour la livraison..."
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition resize-none text-sm"
            />
          </div>

          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-4 text-sm text-gray-400">
            <p className="flex items-start gap-2">
              <FiCheck size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
              Paiement securise via PayTech apres confirmation de la commande.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] hover:bg-[#c49e30] text-black font-bold py-3.5 rounded-xl transition disabled:opacity-50 text-sm"
          >
            {loading ? 'Preparation du paiement...' : `Payer avec PayTech - ${total.toLocaleString('fr-SN')} FCFA`}
          </button>
        </form>

        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5 sticky top-24">
            <h2 className="text-white font-bold mb-4">Recapitulatif</h2>
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.vendor_id}>
                  <p className="text-xs text-[#D4AF37] font-medium mb-2">{group.vendor_name}</p>
                  {group.items.map((item) => (
                    <div key={`${item.product_id}-${item.variant_id ?? 'x'}`} className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-[#2a2a3a] overflow-hidden flex-shrink-0">
                        {item.cover_image ? (
                          <img src={item.cover_image} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs font-semibold">IMG</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs line-clamp-1">{item.product_name}</p>
                        {item.variant_label && <p className="text-gray-500 text-xs">{item.variant_label}</p>}
                        <p className="text-gray-400 text-xs">x {item.quantity}</p>
                      </div>
                      <p className="text-white text-xs whitespace-nowrap">
                        {(item.unit_price * item.quantity).toLocaleString('fr-SN')}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="border-t border-[#2a2a3a] mt-4 pt-3 flex justify-between">
              <span className="text-white font-semibold text-sm">Total</span>
              <span className="text-[#D4AF37] font-bold">{total.toLocaleString('fr-SN')} FCFA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
