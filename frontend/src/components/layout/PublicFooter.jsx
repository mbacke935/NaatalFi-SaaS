import { Link } from 'react-router-dom'

function PublicFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[#2a2a3a] bg-[#0B0B0F] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-[#D4AF37] font-bold text-lg tracking-tight">
              NaatalFi
            </Link>
            <p className="text-gray-500 text-sm mt-3 leading-relaxed">
              La marketplace des boutiques sénégalaises — achetez local, payez mobile.
            </p>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Marketplace</h3>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li><Link to="/marketplace" className="hover:text-white transition">Tous les produits</Link></li>
              <li><Link to="/search" className="hover:text-white transition">Recherche</Link></li>
              <li><Link to="/register?role=VENDOR" className="hover:text-white transition">Devenir vendeur</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Mon compte</h3>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li><Link to="/account/orders" className="hover:text-white transition">Mes commandes</Link></li>
              <li><Link to="/account/favorites" className="hover:text-white transition">Mes favoris</Link></li>
              <li><Link to="/account/settings" className="hover:text-white transition">Paramètres</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Paiement</h3>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li className="text-gray-500">PayTech</li>
              <li className="text-gray-500">Wave</li>
              <li className="text-gray-500">Orange Money</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2a2a3a] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>© {year} NaatalFi. Tous droits réservés.</p>
          <p>Fait avec ❤️ au Sénégal</p>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
