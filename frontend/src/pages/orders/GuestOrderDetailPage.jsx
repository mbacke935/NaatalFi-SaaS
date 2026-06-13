import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiPackage } from 'react-icons/fi'
import { getGuestOrder } from '../../services/orders'
import { useMeta } from '../../hooks/useMeta'

const fmt = (n) => Number(n ?? 0).toLocaleString('fr-SN') + ' FCFA'

function GuestOrderDetailPage() {
  useMeta({ title: 'Suivi commande' })
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const storageKey = `naatalfi-guest-order-${id}`
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const hashToken = hashParams.get('token') || ''
    const queryToken = new URLSearchParams(window.location.search).get('token') || ''
    const token = hashToken || queryToken || window.sessionStorage.getItem(storageKey) || ''

    if (hashToken || queryToken) {
      window.sessionStorage.setItem(storageKey, token)
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('token')
      cleanUrl.hash = ''
      window.history.replaceState(null, '', `${cleanUrl.pathname}${cleanUrl.search}`)
    }

    getGuestOrder(id, token)
      .then(({ data }) => setOrder(data))
      .catch(() => setError('Commande introuvable ou lien invalide.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-gray-400 text-sm">Chargement...</div>
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-gray-400 mb-4">{error}</p>
        <Link to="/marketplace" className="text-[#D4AF37] hover:underline text-sm">Retour a la marketplace</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition">
        <FiArrowLeft size={14} /> Marketplace
      </Link>

      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Commande #{order.id}</h1>
            <p className="text-sm text-gray-500 mt-1">{order.buyer_name} - {order.buyer_email}</p>
          </div>
          <span className="text-xs font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded">
            {order.status}
          </span>
        </div>
        <div className="mt-4 pt-4 border-t border-[#2a2a3a]">
          <p className="text-xs text-gray-500 mb-1">Adresse de livraison</p>
          <p className="text-sm text-white whitespace-pre-line">{order.delivery_address}</p>
        </div>
      </div>

      <div className="space-y-4">
        {order.vendor_orders.map((vendorOrder) => (
          <section key={vendorOrder.id} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-white font-semibold">{vendorOrder.vendor_name}</h2>
              <span className="text-xs text-gray-400">{vendorOrder.status}</span>
            </div>
            <div className="space-y-3">
              {vendorOrder.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#2a2a3a] overflow-hidden flex items-center justify-center text-gray-600">
                    {item.cover_image ? <img src={item.cover_image} alt="" className="product-image-contain p-1" /> : <FiPackage />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.product_name}</p>
                    {item.variant_label && <p className="text-xs text-gray-500">{item.variant_label}</p>}
                    <p className="text-xs text-gray-400">x {item.quantity}</p>
                  </div>
                  <p className="text-sm text-white">{fmt(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#2a2a3a] flex justify-between text-sm">
              <span className="text-gray-400">Livraison incluse</span>
              <span className="text-white font-semibold">{fmt(Number(vendorOrder.subtotal) + Number(vendorOrder.shipping_cost))}</span>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-5 bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5 flex justify-between">
        <span className="text-white font-semibold">Total</span>
        <span className="text-[#D4AF37] font-bold">{fmt(order.total)}</span>
      </div>
    </div>
  )
}

export default GuestOrderDetailPage
