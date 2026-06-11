import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  FiBarChart2,
  FiBell,
  FiBox,
  FiCreditCard,
  FiGrid,
  FiHome,
  FiLogOut,
  FiMapPin,
  FiMenu,
  FiMessageSquare,
  FiShoppingBag,
  FiTruck,
  FiUser,
  FiX,
  FiZap,
} from 'react-icons/fi'
import useAuthStore from '../store/authStore'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Accueil', icon: FiGrid, end: true },
  { to: '/dashboard/products', label: 'Produits', icon: FiBox },
  { to: '/dashboard/orders', label: 'Commandes', icon: FiShoppingBag },
  { to: '/dashboard/wallet', label: 'Wallet', icon: FiCreditCard },
  { to: '/dashboard/analytics', label: 'Analytics', icon: FiBarChart2 },
  { to: '/dashboard/shop', label: 'Boutique', icon: FiHome },
  { to: '/dashboard/delivery', label: 'Livraison', icon: FiTruck },
  { to: '/dashboard/ads', label: 'Publicites', icon: FiZap },
  { to: '/dashboard/disputes', label: 'Litiges', icon: FiMessageSquare },
  { to: '/dashboard/notifications', label: 'Notifications', icon: FiBell },
  { to: '/dashboard/profile', label: 'Profil', icon: FiUser },
]

function DashboardLayout() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const nav = (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                isActive
                  ? 'bg-[#D4AF37] text-black font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={17} />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-[#111118] border-r border-[#2a2a3a] flex-col">
        <Link to="/dashboard" className="h-16 px-5 flex items-center border-b border-[#2a2a3a]">
          <span className="text-lg font-bold tracking-wide">NaatalFi</span>
          <span className="ml-2 text-xs text-[#D4AF37]">vendeur</span>
        </Link>
        {nav}
        <div className="p-4 border-t border-[#2a2a3a]">
          <p className="text-xs text-gray-500 mb-1">Connecte</p>
          <p className="text-sm text-white truncate mb-3">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
          >
            <FiLogOut size={15} />
            Deconnexion
          </button>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-40 h-14 bg-[#111118] border-b border-[#2a2a3a] px-4 flex items-center justify-between">
        <Link to="/dashboard" className="font-bold">NaatalFi <span className="text-[#D4AF37] text-xs">vendeur</span></Link>
        <button onClick={() => setOpen(true)} className="p-2 text-gray-300 hover:text-white">
          <FiMenu size={22} />
        </button>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-label="Fermer" />
          <aside className="relative w-72 max-w-[85vw] h-full bg-[#111118] border-r border-[#2a2a3a] flex flex-col">
            <div className="h-14 px-4 flex items-center justify-between border-b border-[#2a2a3a]">
              <span className="font-bold">NaatalFi</span>
              <button onClick={() => setOpen(false)} className="p-2 text-gray-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
