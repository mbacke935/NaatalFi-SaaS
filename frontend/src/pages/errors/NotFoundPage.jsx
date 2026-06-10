import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div style={{ backgroundColor: '#0B0B0F', color: '#F5F5F5', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', gap: '1rem' }}>
      <h1 style={{ color: '#D4AF37', fontSize: '4rem', margin: 0 }}>404</h1>
      <p>Cette page n&apos;existe pas.</p>
      <Link to="/" style={{ color: '#D4AF37' }}>Retour à l&apos;accueil</Link>
    </div>
  )
}

export default NotFoundPage
