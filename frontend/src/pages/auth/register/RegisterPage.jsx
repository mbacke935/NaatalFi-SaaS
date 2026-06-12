import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { register } from '../../../services/auth'

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'CUSTOMER',
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await register(form)
      if (data.warning) toast.error(data.warning, { duration: 7000 })
      else toast.success(data.message || 'Compte créé. Vérifiez votre email pour activer votre compte.')
      navigate('/login')
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const first = Object.values(data)[0]
        toast.error(Array.isArray(first) ? first[0] : first)
      } else {
        toast.error('Une erreur est survenue.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition'

  return (
    <>
      <h1 className="text-2xl font-bold text-white mb-6">Créer un compte</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Prénom</label>
            <input
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              required
              placeholder="Mohamed"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nom</label>
            <input
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              required
              placeholder="Diallo"
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Adresse email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className={`${inputCls} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Je suis</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className={inputCls}
          >
            <option value="CUSTOMER">Acheteur</option>
            <option value="VENDOR">Vendeur</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>
      </form>
      <p className="text-center text-gray-400 text-sm mt-6">
        Déjà inscrit ?{' '}
        <Link to="/login" className="text-[#D4AF37] hover:underline">
          Se connecter
        </Link>
      </p>
    </>
  )
}

export default RegisterPage
