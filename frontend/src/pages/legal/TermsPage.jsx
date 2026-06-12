import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { getPublicPlatformSettings } from '../../services/platform'
import { useMeta } from '../../hooks/useMeta'

const SECTIONS = [
  {
    title: '1. Objet',
    body: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la marketplace NaatalFi, plateforme mettant en relation des vendeurs et des acheteurs au Sénégal. Toute utilisation de la plateforme implique l'acceptation pleine et entière des présentes conditions.`,
  },
  {
    title: '2. Inscription et compte',
    body: `L'inscription est gratuite. L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants. Chaque compte est personnel. NaatalFi se réserve le droit de suspendre tout compte en cas de manquement aux présentes conditions.`,
  },
  {
    title: '3. Vendeurs',
    body: `Les vendeurs sont responsables des produits qu'ils mettent en vente, de leur description, de leur prix, de leur disponibilité et de leur livraison. NaatalFi prélève une commission de 8 % sur chaque vente. Les vendeurs s'interdisent de proposer des produits illicites, contrefaits ou interdits à la vente.`,
  },
  {
    title: '4. Commandes et paiement',
    body: `Les paiements sont traités de manière sécurisée via PayTech (Wave, Orange Money, carte bancaire). Le montant payé par l'acheteur est encaissé par NaatalFi, qui reverse au vendeur le montant net après déduction de la commission, une fois le délai de sécurité écoulé.`,
  },
  {
    title: '5. Livraison',
    body: `Les frais et délais de livraison sont définis par chaque vendeur selon la région et le poids. Le vendeur s'engage à expédier les produits dans les délais annoncés. En cas de litige sur la livraison, l'acheteur peut contacter le support NaatalFi.`,
  },
  {
    title: '6. Responsabilité',
    body: `NaatalFi agit en tant qu'intermédiaire technique. La plateforme ne saurait être tenue responsable de la qualité des produits, des relations contractuelles entre vendeurs et acheteurs, ni des dommages résultant d'une mauvaise utilisation du service.`,
  },
  {
    title: '7. Propriété intellectuelle',
    body: `L'ensemble des éléments de la plateforme (marque, logo, interface, code) est la propriété exclusive de NaatalFi. Toute reproduction non autorisée est interdite.`,
  },
  {
    title: '8. Modification des CGU',
    body: `NaatalFi se réserve le droit de modifier les présentes conditions à tout moment. Les utilisateurs seront informés de toute modification substantielle. La poursuite de l'utilisation vaut acceptation des nouvelles conditions.`,
  },
]

function TermsPage() {
  useMeta({ title: "Conditions Générales d'Utilisation" })
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

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Conditions Générales d'Utilisation</h1>
      <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : juin 2026</p>

      <div className="space-y-7">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-white font-semibold mb-2">{s.title}</h2>
            <p className="text-sm text-gray-400 leading-relaxed">{s.body}</p>
          </section>
        ))}

        <section>
          <h2 className="text-white font-semibold mb-2">9. Contact</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Pour toute question relative aux présentes conditions, vous pouvez nous contacter
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

export default TermsPage
