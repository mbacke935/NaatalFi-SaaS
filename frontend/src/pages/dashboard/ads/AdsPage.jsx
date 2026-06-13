import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiPause, FiPlay, FiPlus, FiZap } from 'react-icons/fi'
import { createVendorAd, getVendorAds, updateVendorAd } from '../../../services/ads'
import { getMyProducts } from '../../../services/products'

const today = new Date().toISOString().slice(0, 10)

function AdsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    product_id: '',
    budget: '5000',
    cost_per_click: '50',
    start_date: today,
    end_date: today,
  })

  const stats = useMemo(() => ({
    active: campaigns.filter((campaign) => campaign.status === 'ACTIVE').length,
    budget: campaigns.reduce((sum, campaign) => sum + Number(campaign.budget || 0), 0),
    clicks: campaigns.reduce((sum, campaign) => sum + Number(campaign.clicks || 0), 0),
  }), [campaigns])

  const load = () => {
    setLoading(true)
    Promise.allSettled([getVendorAds(), getMyProducts({ status: 'PUBLISHED' })])
      .then(([adsResult, productsResult]) => {
        setCampaigns(adsResult.status === 'fulfilled' ? adsResult.value.data : [])
        setProducts(productsResult.status === 'fulfilled' ? productsResult.value.data : [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await createVendorAd(form)
      toast.success('Campagne creee.')
      setForm((current) => ({ ...current, product_id: '' }))
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.product_id?.[0] || 'Creation impossible.')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (campaign) => {
    const next = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    try {
      await updateVendorAd(campaign.id, { status: next })
      setCampaigns((items) => items.map((item) => item.id === campaign.id ? { ...item, status: next } : item))
    } catch {
      toast.error('Mise a jour impossible.')
    }
  }

  if (loading) {
    return <div className="h-40 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Publicites</h1>
          <p className="text-sm text-gray-500 mt-1">Creation et suivi des campagnes sponsorisees.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Campagnes actives', value: stats.active },
          { label: 'Budget engage', value: `${stats.budget.toLocaleString('fr-SN')} FCFA` },
          { label: 'Clics', value: stats.clicks },
        ].map((item) => (
          <div key={item.label} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{item.label}</p>
            <p className="text-2xl font-bold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FiPlus className="text-[#D4AF37]" />
          <h2 className="text-white font-semibold">Nouvelle campagne</h2>
        </div>
        <div className="grid md:grid-cols-5 gap-3">
          <select
            value={form.product_id}
            onChange={(event) => setForm((current) => ({ ...current, product_id: event.target.value }))}
            required
            className="md:col-span-2 bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">Produit publie</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
          <input
            type="number"
            min="1000"
            value={form.budget}
            onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))}
            className="bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white"
            placeholder="Budget"
          />
          <input
            type="date"
            value={form.start_date}
            onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))}
            className="bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white"
          />
          <input
            type="date"
            value={form.end_date}
            onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))}
            className="bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
        <button disabled={saving} className="mt-4 inline-flex items-center gap-2 bg-[#D4AF37] text-black font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
          <FiZap size={15} />
          {saving ? 'Creation...' : 'Lancer la campagne'}
        </button>
      </form>

      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="p-10 text-center">
            <FiZap size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucune campagne pour le moment.</p>
          </div>
        ) : campaigns.map((campaign) => (
          <div key={campaign.id} className="flex items-center justify-between gap-4 p-4 border-b border-[#2a2a3a] last:border-0">
            <div>
              <p className="text-white font-medium">{campaign.product_name}</p>
              <p className="text-xs text-gray-500">
                {campaign.status} - {Number(campaign.budget).toLocaleString('fr-SN')} FCFA - {campaign.impressions} impressions - {campaign.clicks} clics
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleStatus(campaign)}
              className="p-2 rounded-lg border border-[#2a2a3a] text-gray-300 hover:text-white"
              aria-label={campaign.status === 'ACTIVE' ? 'Pause' : 'Activer'}
            >
              {campaign.status === 'ACTIVE' ? <FiPause size={16} /> : <FiPlay size={16} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdsPage
