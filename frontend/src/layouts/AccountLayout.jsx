import { NavLink, Outlet } from 'react-router-dom'
import { FiUser, FiShoppingBag, FiMapPin, FiHeart, FiSettings } from 'react-icons/fi'
import useAuthStore from '../store/authStore'

const NAV = [
  { to: '/account',           label: 'Tableau de bord', icon: FiUser,        end: true },
  { to: '/account/orders',    label: 'Mes commandes',   icon: FiShoppingBag, end: false },
  { to: '/account/addresses', label: 'Mes adresses',    icon: FiMapPin,      end: false },
  { to: '/account/favorites', label: 'Mes favoris',     icon: FiHeart,       end: false },
  { to: '/account/settings',  label: 'Paramètres',      icon: FiSettings,    end: false },
]

function AccountLayout() {
  const { user } = useAuthStore()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row gap-6">

        {/* Sidebar */}
        <aside className="sm:w-56 flex-shrink-0">
          {/* Avatar + nom */}
          <div className="flex items-center gap-3 mb-5 p-3 bg-[#16161E] border border-[#2a2a3a] rounded-xl">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex-shrink-0 overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : <span className="w-full h-full flex items-center justify-center text-[#D4AF37] font-bold text-sm">
                    {user?.first_name?.[0] ?? '?'}
                  </span>
              }
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-sm truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                    isActive
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Contenu */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AccountLayout
