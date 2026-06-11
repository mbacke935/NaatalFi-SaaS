import { Link } from 'react-router-dom'
import { FiAlertCircle, FiCheckCircle, FiMessageSquare } from 'react-icons/fi'

function DisputesPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Litiges</h1>
        <p className="text-sm text-gray-500 mt-1">Suivi des reclamations et arbitrages vendeur.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Ouverts', value: 0, icon: FiAlertCircle, tone: 'text-yellow-400' },
          { label: 'En revue', value: 0, icon: FiMessageSquare, tone: 'text-blue-400' },
          { label: 'Resolus', value: 0, icon: FiCheckCircle, tone: 'text-green-400' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
                <Icon className={item.tone} size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{item.value}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
        <FiMessageSquare size={36} className="text-gray-600 mx-auto mb-4" />
        <h2 className="text-white font-semibold mb-2">Aucun litige en cours</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
          Les litiges seront alimentes par le module de protection acheteur/vendeur. Les commandes restent gerables depuis la page commandes.
        </p>
        <Link to="/dashboard/orders" className="text-[#D4AF37] text-sm hover:underline">
          Voir les commandes
        </Link>
      </div>
    </div>
  )
}

export default DisputesPage
