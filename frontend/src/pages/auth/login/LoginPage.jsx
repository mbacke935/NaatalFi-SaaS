import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login } from '../../../services/auth'
import useAuthStore from '../../../store/authStore'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const loginStore = useAuthStore((s) => s.login)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await login(form.email, form.password)
      loginStore(data.user, data.access, data.refresh)
      toast.success(`Bienvenue, ${data.user.first_name} !`)
      const from = location.state?.from
      const redirectTo = from?.pathname
        ? `${from.pathname}${from.search || ''}${from.hash || ''}`
        : null
      const fallback = data.user.role === 'ADMIN' ? '/admin' : '/dashboard'
      navigate(redirectTo && redirectTo !== '/login' ? redirectTo : fallback, { replace: true })
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Identifiants incorrects.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-white mb-6">Connexion</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Adresse email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
            className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Mot de passe</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
            className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
          />
        </div>
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-[#D4AF37] hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
      <p className="text-center text-gray-400 text-sm mt-6">
        Pas encore de compte ?{' '}
        <Link to="/register" className="text-[#D4AF37] hover:underline">
          Créer un compte
        </Link>
      </p>
    </>
  )
}

export default LoginPage
