import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiCheck, FiCreditCard, FiMapPin, FiSmartphone, FiTruck } from 'react-icons/fi'
import { createOrder } from '../../services/orders'
import { initiatePayment } from '../../services/payments'
import { estimateShipping, SENEGAL_REGIONS } from '../../services/shipping'
import { getMarketplaceProduct } from '../../services/marketplace'
import { getAddresses } from '../../services/account'
import useCartStore, { normalizeCartItems } from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import { useMeta } from '../../hooks/useMeta'

const fmt = (n) => Number(n ?? 0).toLocaleString('fr-SN') + ' FCFA'

function CheckoutPage() {
  useMeta({ title: 'Finaliser la commande' })

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)
  const setItem = useCartStore((s) => s.setItem)
  const totalPrice = useCartStore((s) => s.totalPrice)
  const byVendor = useCartStore((s) => s.byVendor)

  const [address, setAddress] = useState('')
  const [region, setRegion] = useState('')
  const [notes, setNotes] = useState('')
  const [guest, setGuest] = useState({ name: '', email: '', phone: '' })
  const [paymentProvider, setPaymentProvider] = useState('WAVE')
  const [loading, setLoading] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [shippingEstimate, setShippingEstimate] = useState({})
  const [estimating, setEstimating] = useState(false)
  const submittingRef = useRef(false)
  const normalizedItems = normalizeCartItems(items)
  const refreshSignature = normalizedItems
    .map((i) => `${i.product_slug}:${i.variant_id ?? 'x'}:${i.quantity}`)
    .join('|')
  const lastRefreshRef = useRef('')

  const groups = byVendor()
  const cartTotal = totalPrice()
  const shippingTotal = Object.values(shippingEstimate).reduce(
    (acc, s) => acc + parseFloat(s.price ?? 0),
    0
  )
  const grandTotal = cartTotal + shippingTotal

  useEffect(() => {
    if (!isAuthenticated) {
      setSavedAddresses([])
      return
    }
    getAddresses()
      .then(({ data }) => setSavedAddresses(Array.isArray(data) ? data : (data?.results ?? [])))
      .catch(() => setSavedAddresses([]))
  }, [isAuthenticated])

  const applyAddress = (addr) => {
    const parts = [addr.street, addr.city].filter(Boolean)
    if (addr.full_name) parts.unshift(addr.full_name)
    setAddress(parts.join(', '))
    if (addr.region) setRegion(addr.region)
  }

  const fetchEstimate = useCallback(async (reg) => {
    if (!reg || items.length === 0) {
      setShippingEstimate({})
      return
    }
    const vendorIds = [...new Set(items.map((i) => i.vendor_id).filter(Boolean))]
    if (!vendorIds.length) return

    setEstimating(true)
    try {
      const { data } = await estimateShipping({ vendor_ids: vendorIds, region: reg })
      setShippingEstimate(data)
    } catch {
      setShippingEstimate({})
    } finally {
      setEstimating(false)
    }
  }, [items])

  useEffect(() => {
    if (region) fetchEstimate(region)
    else setShippingEstimate({})
  }, [region, fetchEstimate])

  useEffect(() => {
    if (!normalizedItems.length || refreshSignature === lastRefreshRef.current) return
    lastRefreshRef.current = refreshSignature

    normalizedItems.forEach((item) => {
      if (!item.product_slug) return
      getMarketplaceProduct(item.product_slug)
        .then(({ data }) => {
          const variant = data.variants?.find((v) => v.id === item.variant_id)
          const unitPrice = Number(data.price) + Number(variant?.price_delta ?? 0)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submittingRef.current) return
    if (!address.trim()) {
      toast.error("L'adresse de livraison est requise.")
      return
    }
    if (!isAuthenticated && (!guest.name.trim() || !guest.email.trim() || !guest.phone.trim())) {
      toast.error('Nom, email et telephone sont requis.')
      return
    }

    submittingRef.current = true
    setLoading(true)
    try {
      const normalizedItems = normalizeCartItems(items)
      const payload = {
        delivery_address: address.trim(),
        region: region || '',
        notes: notes.trim(),
        guest_name: isAuthenticated ? '' : guest.name.trim(),
        guest_email: isAuthenticated ? '' : guest.email.trim(),
        guest_phone: isAuthenticated ? '' : guest.phone.trim(),
        items: normalizedItems.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id ?? null,
          quantity: item.quantity,
        })),
      }
      const { data: order } = await createOrder(payload)
      const { data: payment } = await initiatePayment(order.id, paymentProvider, order.guest_access_token || '')
      clearCart()
      toast.success('Redirection vers le paiement...')
      window.location.assign(payment.payment_url)
    } catch (err) {
      const msg = err.response?.data?.error || 'Une erreur est survenue.'
      toast.error(msg)
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition">
        <FiArrowLeft size={14} /> Retour au panier
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Finaliser la commande</h1>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        <form onSubmit={handleSubmit} className="flex-1 space-y-5">
          {!isAuthenticated && (
            <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">Informations client</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={guest.name}
                  onChange={(e) => setGuest((g) => ({ ...g, name: e.target.value }))}
                  required
                  placeholder="Nom complet"
                  className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition text-sm"
                />
                <input
                  type="tel"
                  value={guest.phone}
                  onChange={(e) => setGuest((g) => ({ ...g, phone: e.target.value }))}
                  required
                  placeholder="+221 77 000 00 00"
                  className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition text-sm"
                />
                <input
                  type="email"
                  value={guest.email}
                  onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))}
                  required
                  placeholder="email@example.com"
                  className="w-full sm:col-span-2 bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition text-sm"
                />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Vous recevrez les confirmations de commande et de paiement par email.
              </p>
            </div>
          )}

          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Adresse de livraison</h2>

            {savedAddresses.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                  <FiMapPin size={11} /> Adresses sauvegardees
                </p>
                <div className="flex flex-col gap-2">
                  {savedAddresses.slice(0, 3).map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => applyAddress(addr)}
                      className="text-left px-3 py-2.5 rounded-lg border border-[#2a2a3a] hover:border-[#D4AF37]/60 text-sm text-gray-300 hover:text-white transition bg-[#0B0B0F]"
                    >
                      <span className="font-medium">{addr.label}</span>
                      {addr.is_default && <span className="ml-2 text-xs text-[#D4AF37]">Par defaut</span>}
                      <span className="block text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {addr.street}, {addr.city}{addr.region ? ` - ${addr.region}` : ''}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-[#2a2a3a] mt-4 mb-3" />
              </div>
            )}

            <div className="space-y-3">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37] transition"
              >
                <option value="">Selectionnez votre region</option>
                {SENEGAL_REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={3}
                placeholder="Quartier, rue, numero - Ville, Senegal"
                className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition resize-none text-sm"
              />
            </div>
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
            <h2 className="text-white font-semibold mb-3">Moyen de paiement</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setPaymentProvider('WAVE')}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
                  paymentProvider === 'WAVE'
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white'
                    : 'border-[#2a2a3a] bg-[#0B0B0F] text-gray-400 hover:text-white'
                }`}
              >
                <FiSmartphone size={18} />
                <span>
                  <span className="block text-sm font-semibold">Wave Business</span>
                  <span className="block text-xs text-gray-500">Validation admin apres paiement</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentProvider('PAYTECH')}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
                  paymentProvider === 'PAYTECH'
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white'
                    : 'border-[#2a2a3a] bg-[#0B0B0F] text-gray-400 hover:text-white'
                }`}
              >
                <FiCreditCard size={18} />
                <span>
                  <span className="block text-sm font-semibold">PayTech</span>
                  <span className="block text-xs text-gray-500">Carte et mobile money</span>
                </span>
              </button>
            </div>
            <p className="flex items-start gap-2">
              <FiCheck size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
              Paiement securise apres confirmation de la commande.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] hover:bg-[#c49e30] text-black font-bold py-3.5 rounded-xl transition disabled:opacity-50 text-sm"
          >
            {loading ? 'Preparation du paiement...' : `Payer avec ${paymentProvider === 'WAVE' ? 'Wave Business' : 'PayTech'} - ${fmt(grandTotal)}`}
          </button>
        </form>

        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5 sticky top-24">
            <h2 className="text-white font-bold mb-4">Recapitulatif</h2>
            <div className="space-y-4 mb-4">
              {groups.map((group) => {
                const shipping = shippingEstimate[group.vendor_id]
                return (
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
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="flex items-center gap-1 text-gray-500">
                        <FiTruck size={11} /> Livraison
                      </span>
                      <span className={estimating ? 'text-gray-600 animate-pulse' : 'text-gray-400'}>
                        {estimating
                          ? '...'
                          : region && shipping
                            ? parseFloat(shipping.price) === 0 ? 'Gratuit' : fmt(shipping.price)
                            : region ? 'Non disponible' : '-'
                        }
                      </span>
                    </div>
                    {region && shipping?.estimated_days && (
                      <p className="text-xs text-gray-600 mt-0.5 text-right">
                        ~{shipping.estimated_days} jour{shipping.estimated_days !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="border-t border-[#2a2a3a] pt-3 space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Sous-total</span>
                <span>{fmt(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Livraison</span>
                <span>{region ? (shippingTotal === 0 ? 'Gratuit' : fmt(shippingTotal)) : '-'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#2a2a3a]">
                <span className="text-white font-semibold text-sm">Total</span>
                <span className="text-[#D4AF37] font-bold">{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
