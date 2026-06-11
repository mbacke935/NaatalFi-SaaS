import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
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

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await register(form)
      if (data.warning) toast.error(data.warning, { duration: 7000 })
      else toast.success(data.message || 'Compte cree. Verifiez votre email pour activer votre compte.')
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

  return (
    <>
      <h1 className="text-2xl font-bold text-white mb-6">Creer un compte</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Prenom</label>
            <input
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              required
              placeholder="Mohamed"
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
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
              className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
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
            placeholder="********"
            className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Je suis</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] transition"
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
          {loading ? 'Creation...' : 'Creer mon compte'}
        </button>
      </form>
      <p className="text-center text-gray-400 text-sm mt-6">
        Deja inscrit ?{' '}
        <Link to="/login" className="text-[#D4AF37] hover:underline">
          Se connecter
        </Link>
      </p>
    </>
  )
}

export default RegisterPage
