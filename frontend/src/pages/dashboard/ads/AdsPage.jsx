import { Link } from 'react-router-dom'
import { FiBarChart2, FiPlus, FiZap } from 'react-icons/fi'

function AdsPage() {
  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Publicites</h1>
          <p className="text-sm text-gray-500 mt-1">Suivi des campagnes sponsorisees de votre boutique.</p>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-2 bg-[#D4AF37]/40 text-black/60 font-semibold px-4 py-2 rounded-lg text-sm cursor-not-allowed"
        >
          <FiPlus size={15} />
          Nouvelle campagne
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Campagnes actives', value: 0 },
          { label: 'Budget engage', value: '0 FCFA' },
          { label: 'Clics', value: 0 },
        ].map((item) => (
          <div key={item.label} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{item.label}</p>
            <p className="text-2xl font-bold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
        <FiZap size={36} className="text-[#D4AF37] mx-auto mb-4" />
        <h2 className="text-white font-semibold mb-2">Campagnes publicitaires a venir</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
          La page est prete dans le dashboard vendeur. La creation, le budget et la facturation par wallet seront branches avec le module publicite.
        </p>
        <Link to="/dashboard/analytics" className="inline-flex items-center gap-2 text-[#D4AF37] text-sm hover:underline">
          <FiBarChart2 size={15} />
          Voir les performances actuelles
        </Link>
      </div>
    </div>
  )
}

export default AdsPage
