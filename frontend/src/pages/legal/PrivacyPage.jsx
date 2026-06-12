import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { getPublicPlatformSettings } from '../../services/platform'
import { useMeta } from '../../hooks/useMeta'

const SECTIONS = [
  {
    title: '1. Données collectées',
    body: `NaatalFi collecte les données nécessaires au fonctionnement du service : nom, adresse email, numéro de téléphone, adresses de livraison, et — pour les vendeurs — informations de boutique et coordonnées de versement. Les données de paiement sont traitées directement par PayTech et ne sont pas stockées par NaatalFi.`,
  },
  {
    title: '2. Utilisation des données',
    body: `Les données sont utilisées pour gérer les comptes, traiter les commandes et paiements, assurer la livraison, communiquer avec les utilisateurs (emails de confirmation, notifications) et améliorer le service. NaatalFi ne vend jamais vos données à des tiers.`,
  },
  {
    title: '3. Partage des données',
    body: `Les données de livraison sont partagées avec le vendeur concerné pour permettre l'expédition. Les prestataires techniques (hébergement, paiement, email) accèdent aux données strictement nécessaires à leur mission, dans le respect de la confidentialité.`,
  },
  {
    title: '4. Conservation',
    body: `Les données sont conservées le temps nécessaire à la fourniture du service et au respect des obligations légales et comptables. Un compte supprimé entraîne l'anonymisation ou la suppression des données associées, hors obligations de conservation.`,
  },
  {
    title: '5. Sécurité',
    body: `NaatalFi met en œuvre des mesures techniques pour protéger vos données : chiffrement des mots de passe, authentification sécurisée, communications chiffrées (HTTPS) et limitation des accès. Aucun système n'étant infaillible, NaatalFi s'engage à notifier toute violation significative.`,
  },
  {
    title: '6. Vos droits',
    body: `Vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Vous pouvez gérer la plupart de ces informations depuis votre espace compte, ou nous contacter pour toute demande spécifique.`,
  },
  {
    title: '7. Cookies',
    body: `La plateforme utilise des cookies et technologies similaires strictement nécessaires au fonctionnement (session, authentification). Aucun cookie publicitaire de tiers n'est utilisé.`,
  },
]

function PrivacyPage() {
  useMeta({ title: 'Politique de confidentialité' })
  const [email, setEmail] = useState(null)

  useEffect(() => {
    getPublicPlatformSettings()
      .then(({ data }) => setEmail(data?.contact_email ?? null))
      .catch(() => setEmail(null))
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition">
        <FiArrowLeft size={14} /> Retour à l'accueil
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Politique de confidentialité</h1>
      <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : juin 2026</p>

      <div className="space-y-7">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-white font-semibold mb-2">{s.title}</h2>
            <p className="text-sm text-gray-400 leading-relaxed">{s.body}</p>
          </section>
        ))}

        <section>
          <h2 className="text-white font-semibold mb-2">8. Contact</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Pour exercer vos droits ou pour toute question relative à vos données, contactez-nous
            {email ? (
              <> à l'adresse <a href={`mailto:${email}`} className="text-[#D4AF37] hover:underline">{email}</a>.</>
            ) : (
              <> via la page de contact de la plateforme.</>
            )}
          </p>
        </section>
      </div>
    </div>
  )
}

export default PrivacyPage
