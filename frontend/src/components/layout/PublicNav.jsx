import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX } from 'react-icons/fi'
import useAuthStore from '../../store/authStore'

function PublicNav() {
  const navigate          = useNavigate()
  const { user, token }   = useAuthStore()
  const [q, setQ]         = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#0B0B0F]/95 backdrop-blur border-b border-[#2a2a3a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">

        {/* Logo */}
        <Link to="/" className="flex-shrink-0 text-[#D4AF37] font-bold text-xl tracking-tight">
          NaatalFi
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:flex">
          <div className="relative w-full">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit, une boutique..."
              className="w-full bg-[#16161E] border border-[#2a2a3a] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
            />
          </div>
        </form>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-5 text-sm">
          <Link to="/marketplace" className="text-gray-400 hover:text-white transition">Marketplace</Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Cart placeholder */}
          <button className="relative text-gray-400 hover:text-white transition p-1">
            <FiShoppingCart size={20} />
          </button>

          {token ? (
            <Link
              to="/dashboard"
              className="hidden sm:flex items-center gap-2 text-sm bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold px-3 py-1.5 rounded-lg transition"
            >
              <FiUser size={14} /> Dashboard
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="text-sm text-gray-400 hover:text-white transition px-3 py-1.5">
                Connexion
              </Link>
              <Link
                to="/register"
                className="text-sm bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold px-3 py-1.5 rounded-lg transition"
              >
                S'inscrire
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden text-gray-400 hover:text-white transition p-1"
          >
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-[#2a2a3a] bg-[#0B0B0F] px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-[#16161E] border border-[#2a2a3a] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
            />
          </form>
          <Link to="/marketplace" className="block text-gray-300 py-1" onClick={() => setMenuOpen(false)}>Marketplace</Link>
          {token ? (
            <Link to="/dashboard" className="block text-[#D4AF37] py-1" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="block text-gray-300 py-1" onClick={() => setMenuOpen(false)}>Connexion</Link>
              <Link to="/register" className="block text-[#D4AF37] py-1" onClick={() => setMenuOpen(false)}>S'inscrire</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

export default PublicNav
