import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok } from 'react-icons/fa'
import { FiMail, FiPhone } from 'react-icons/fi'
import { getPublicPlatformSettings } from '../../services/platform'

const socials = [
  ['facebook_url', 'Facebook', FaFacebookF],
  ['instagram_url', 'Instagram', FaInstagram],
  ['tiktok_url', 'TikTok', FaTiktok],
  ['linkedin_url', 'LinkedIn', FaLinkedinIn],
]

function PublicFooter() {
  const year = new Date().getFullYear()
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    getPublicPlatformSettings()
      .then(({ data }) => setSettings(data))
      .catch(() => setSettings(null))
  }, [])

  return (
    <footer className="border-t border-[#2a2a3a] bg-[#0B0B0F] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="sm:col-span-2 md:col-span-1">
            <Link to="/" className="text-[#D4AF37] font-bold text-lg tracking-tight">
              NaatalFi
            </Link>
            <p className="text-gray-500 text-sm mt-3 leading-relaxed">
              La marketplace des boutiques senegalaises - achetez local, payez mobile.
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
              <li><Link to="/account/settings" className="hover:text-white transition">Parametres</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Contact</h3>
            <ul className="space-y-2.5 text-sm text-gray-500">
              {settings?.contact_email && (
                <li>
                  <a href={`mailto:${settings.contact_email}`} className="inline-flex items-center gap-2 hover:text-white transition break-all">
                    <FiMail size={14} /> {settings.contact_email}
                  </a>
                </li>
              )}
              {settings?.phone_number && (
                <li>
                  <a href={`tel:${settings.phone_number}`} className="inline-flex items-center gap-2 hover:text-white transition">
                    <FiPhone size={14} /> {settings.phone_number}
                  </a>
                </li>
              )}
              {!settings?.contact_email && !settings?.phone_number && (
                <li className="text-gray-500">PayTech · Wave · Orange Money</li>
              )}
            </ul>
            <div className="flex gap-2 mt-4">
              {socials.map(([key, label, Icon]) => settings?.[key] ? (
                <a
                  key={key}
                  href={settings[key]}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-lg border border-[#2a2a3a] text-gray-500 hover:text-white hover:border-[#D4AF37] transition flex items-center justify-center"
                >
                  <Icon size={14} />
                </a>
              ) : null)}
            </div>
          </div>
        </div>

        <div className="border-t border-[#2a2a3a] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>© {year} NaatalFi. Tous droits reserves.</p>
          <p>Fait au Senegal</p>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
