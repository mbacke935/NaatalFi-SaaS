import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { resetPassword } from '../../../services/auth'

function ResetPasswordPage() {
  const { uid, token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(uid, token, password)
      toast.success('Mot de passe mis à jour !')
      navigate('/login')
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.new_password?.[0] ||
        'Lien invalide ou expiré.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-white mb-6">Nouveau mot de passe</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Nouveau mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Confirmer le mot de passe</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Mise à jour...' : 'Réinitialiser le mot de passe'}
        </button>
      </form>
      <p className="text-center mt-6">
        <Link to="/login" className="text-sm text-gray-400 hover:text-[#D4AF37]">
          Retour à la connexion
        </Link>
      </p>
    </>
  )
}

export default ResetPasswordPage
