import { useEffect, useState } from 'react'
import { FiZap } from 'react-icons/fi'
import { getAdminAds } from '../../../services/admin'

function AdminAdsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminAds()
      .then(({ data }) => setCampaigns(Array.isArray(data) ? data : []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-40 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Publicites</h1>
        <p className="text-sm text-gray-500 mt-1">Suivi global des campagnes sponsorisees.</p>
      </div>

      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <FiZap size={36} className="text-gray-600 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Aucune campagne pour le moment.</p>
          </div>
        ) : campaigns.map((campaign) => (
          <div key={campaign.id} className="grid md:grid-cols-5 gap-3 p-4 border-b border-[#2a2a3a] last:border-0">
            <div className="md:col-span-2">
              <p className="text-white font-medium">{campaign.product_name}</p>
              <p className="text-xs text-gray-500">{campaign.vendor_name}</p>
            </div>
            <p className="text-sm text-gray-400">{campaign.status}</p>
            <p className="text-sm text-gray-400">{Number(campaign.budget).toLocaleString('fr-SN')} FCFA</p>
            <p className="text-sm text-gray-400">{campaign.impressions} impr. · {campaign.clicks} clics</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminAdsPage
