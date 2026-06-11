import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { forgotPassword } from '../../../services/auth'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch {
      toast.error('Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="text-xl font-bold text-white mb-2">Email envoyé</h2>
        <p className="text-gray-400 text-sm mb-6">
          Si un compte existe pour <span className="text-white">{email}</span>,
          vous recevrez un lien de réinitialisation sous peu.
        </p>
        <Link to="/login" className="text-[#D4AF37] hover:underline text-sm">
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-white mb-2">Mot de passe oublié</h1>
      <p className="text-gray-400 text-sm mb-6">
        Entrez votre email et nous vous enverrons un lien de réinitialisation.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Adresse email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full bg-[#0B0B0F] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Envoi...' : 'Envoyer le lien'}
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

export default ForgotPasswordPage
