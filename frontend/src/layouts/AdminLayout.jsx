import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  FiBarChart2,
  FiBell,
  FiBox,
  FiCreditCard,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiShoppingBag,
  FiTag,
  FiUsers,
  FiX,
  FiZap,
  FiHome,
  FiStar,
  FiGlobe,
} from 'react-icons/fi'
import useAuthStore from '../store/authStore'

const NAV_ITEMS = [
  { to: '/admin',            label: 'Tableau de bord', icon: FiGrid,        end: true },
  { to: '/admin/vendors',    label: 'Vendeurs',         icon: FiHome },
  { to: '/admin/users',      label: 'Utilisateurs',     icon: FiUsers },
  { to: '/admin/orders',     label: 'Commandes',        icon: FiShoppingBag },
  { to: '/admin/products',   label: 'Produits',         icon: FiBox },
  { to: '/admin/payments',   label: 'Paiements',        icon: FiCreditCard },
  { to: '/admin/wallets',    label: 'Wallets',          icon: FiCreditCard },
  { to: '/admin/categories', label: 'Catégories',       icon: FiTag },
  { to: '/admin/reviews',    label: 'Avis',             icon: FiStar },
  { to: '/admin/analytics',  label: 'Analytics',        icon: FiBarChart2 },
  { to: '/admin/platform',   label: 'Plateforme',       icon: FiGlobe },
  { to: '/admin/disputes',   label: 'Litiges',          icon: FiMessageSquare },
  { to: '/admin/ads',        label: 'Publicités',       icon: FiZap },
]

function AdminLayout() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user   = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const currentPage = NAV_ITEMS.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  )

  const userInitial = ((user?.first_name || user?.email || 'A')[0]).toUpperCase()
  const userName    = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.email

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
    <div className="bg-[#0B0B0F] text-white lg:min-h-screen">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-[#111118] border-r border-[#2a2a3a] flex-col z-40">
        <Link to="/admin" className="h-16 px-5 flex items-center gap-2 border-b border-[#2a2a3a]">
          <span className="text-lg font-bold tracking-wide">NaatalFi</span>
          <span className="text-xs font-semibold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">admin</span>
        </Link>
        {nav}
        <div className="p-4 border-t border-[#2a2a3a]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-red-500/30 flex items-center justify-center text-red-300 text-sm font-bold flex-shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Administrateur</p>
              <p className="text-xs text-white truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
          >
            <FiLogOut size={15} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Top header desktop */}
      <header className="hidden lg:flex fixed top-0 left-64 right-0 h-14 z-30 bg-[#111118] border-b border-[#2a2a3a] items-center justify-between px-6">
        <p className="text-sm font-semibold text-white">
          {currentPage?.label ?? 'Administration'}
        </p>
        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition"
          >
            <div className="w-7 h-7 rounded-full bg-red-500/30 flex items-center justify-center text-red-300 text-xs font-bold">
              {userInitial}
            </div>
            <span className="text-sm text-gray-300 max-w-[120px] truncate">{userName}</span>
          </Link>
        </div>
      </header>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-40 h-14 bg-[#111118] border-b border-[#2a2a3a] px-4 flex items-center justify-between">
        <Link to="/admin" className="font-bold flex items-center gap-2">
          NaatalFi
          <span className="text-xs font-semibold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">admin</span>
        </Link>
        <button onClick={() => setOpen(true)} className="p-2 text-gray-300 hover:text-white">
          <FiMenu size={22} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-label="Fermer" />
          <aside className="relative w-72 max-w-[85vw] h-full bg-[#111118] border-r border-[#2a2a3a] flex flex-col">
            <div className="h-14 px-4 flex items-center justify-between border-b border-[#2a2a3a]">
              <span className="font-bold">NaatalFi <span className="text-xs text-red-400">admin</span></span>
              <button onClick={() => setOpen(false)} className="p-2 text-gray-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="lg:pl-64 lg:pt-14 min-w-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-5 pb-3 lg:py-8 min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
