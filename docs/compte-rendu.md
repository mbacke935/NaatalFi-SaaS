# Compte Rendu - Etat Actuel NaatalFi

**Date :** 13 juin 2026

NaatalFi est une marketplace multi-vendeurs senegalaise avec frontend Vercel, backend Render, base Supabase PostgreSQL, stockage Supabase Storage et emails transactionnels Brevo via `EmailLog` + cron GitHub Actions.

## Etat General

Les phases 0 a 18 sont implementees sur le plan fonctionnel. La partie paiement automatique reel reste volontairement en pause jusqu'a activation fiable d'un fournisseur compatible webhook/API serveur. Le fallback Wave Business existe, mais il est manuel et temporaire.

URLs actuelles :

| Element | URL / Etat |
| :--- | :--- |
| Backend Render | `https://naatalfi-backend.onrender.com` |
| Frontend Vercel | `https://naatalfi.vercel.app` |
| API publique categories | `https://naatalfi-backend.onrender.com/api/v1/marketplace/categories/` |
| Webhook PayTech | `https://naatalfi-backend.onrender.com/api/v1/payments/webhook/` |
| Cron interne | `POST /api/v1/internal/cron/run/` avec `X-CRON-SECRET` |

## Fonctionnalites Actives

| Zone | Etat |
| :--- | :--- |
| Auth | Inscription, verification email, connexion, reset password, JWT |
| Marketplace | Accueil configurable, catalogue, recherche, categories, fiche produit, vendeurs publics |
| Compte client | Profil, avatar Supabase, adresses, commandes, favoris, avis |
| Panier | Panier persistant, validation stock, groupement vendeur |
| Checkout | Checkout invite possible sans connexion, informations de livraison saisies au paiement |
| Commandes | 1 `Order` parent par checkout + N `VendorOrder`, suivi client et vendeur |
| Vendeur | Produits, images, variantes, stock, commandes, livraison, wallet, boutique, profil, notifications |
| Publicites vendeur | Creation de campagnes, debit wallet, liste, pause/reprise |
| Litiges | Ouverture client, gel wallet, suivi vendeur, resolution admin |
| Analytics vendeur | Revenus, commandes, articles vendus, panier moyen, taux litiges, top produits |
| Admin | Vendeurs, utilisateurs, suppression utilisateur, produits, commandes, paiements, wallets, retraits, categories, avis, publicites, litiges, analytics, parametres plateforme |
| Plateforme | Footer public, contacts, reseaux sociaux, image hero et categories populaires modifiables par admin |

## Paiement

Etat actuel :

- PayTech est integre cote code : initiation, parsing robuste des reponses, webhook signe, statut paiement.
- Le paiement automatique reel reste en pause car il depend de l'activation/fiabilite du fournisseur.
- Wave Business est disponible comme fallback manuel temporaire.
- L'admin peut valider un paiement Wave manuel depuis l'admin frontend.
- Une vraie validation automatique de paiement necessite un fournisseur avec webhook/API serveur fiable.

Flux financier prevu quand paiement confirme automatiquement :

```text
Client paie le montant total
  -> webhook fournisseur confirme le paiement
  -> commande marquee PAID
  -> wallet vendeur credite en pending
  -> commission plateforme 8% tracee en Transaction.COMMISSION
  -> apres delai, pending devient available
```

## Regles Business Actuelles

- Un seul plan vendeur gratuit.
- Produits illimites pour tous les vendeurs.
- Commission plateforme fixe : 8% sur chaque vente.
- Le taux de commission est centralise dans `apps/wallet/services.py`.
- Les coordonnees de versement de la plateforme sont modifiables par l'admin.
- Les vendeurs peuvent modifier leurs informations publiques et leurs coordonnees.

## Emails Et Taches

- Celery worker payant non requis pour le MVP.
- Les emails sont stockes dans `EmailLog`.
- GitHub Actions appelle le cron securise toutes les 10 minutes.
- Brevo est le fournisseur email actif.
- Redis reste utile pour le cache, pas comme queue obligatoire.

## Tests Recents

Derniere verification du 13 juin 2026 :

```powershell
cd C:\NaatalFi-SaaS\frontend
npm.cmd run build
npm.cmd test -- --run

cd C:\NaatalFi-SaaS\backend
venv\Scripts\python manage.py test apps.disputes apps.analytics apps.ads --settings=config.test_settings --verbosity 1
```

Resultats :

- Build frontend OK.
- Tests frontend : 21 OK.
- Tests backend cibles `disputes`, `analytics`, `ads` : 9 OK.

## Points Restants Prioritaires

1. Continuer les tests manuels production sur inscription, vendeur, produit, panier, checkout invite, commandes et admin.
2. Ajouter des tests end-to-end navigateur sur les parcours critiques.
3. Garder le paiement automatique en pause jusqu'a validation PayTech ou Wave API.
4. Acheter/configurer le domaine officiel quand le produit est pret.
5. Remplacer les URLs temporaires par le domaine final et renforcer la delivrabilite email.
