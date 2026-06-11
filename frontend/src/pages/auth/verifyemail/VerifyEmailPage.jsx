import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { verifyEmail } from '../../../services/auth'

function VerifyEmailPage() {
  const { uid, token } = useParams()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    verifyEmail(uid, token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [uid, token])

  if (status === 'loading') {
    return (
      <div className="text-center">
        <div className="text-gray-400 text-sm">Vérification en cours...</div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-white mb-2">Email vérifié !</h2>
        <p className="text-gray-400 text-sm mb-6">
          Votre compte est maintenant activé. Vous pouvez vous connecter.
        </p>
        <Link
          to="/login"
          className="bg-[#D4AF37] hover:bg-[#c49e30] text-black font-semibold py-2.5 px-6 rounded-lg transition inline-block"
        >
          Se connecter
        </Link>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="text-4xl mb-4">❌</div>
      <h2 className="text-xl font-bold text-white mb-2">Lien invalide</h2>
      <p className="text-gray-400 text-sm mb-6">
        Ce lien de vérification est invalide ou a expiré.
      </p>
      <Link to="/login" className="text-[#D4AF37] hover:underline text-sm">
        Retour à la connexion
      </Link>
    </div>
  )
}

export default VerifyEmailPage
