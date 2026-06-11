# Compte Rendu — État Actuel NaatalFi

**Date :** 11 juin 2026  
**État :** Phases 0 à 10 implémentées, déploiement Render/Vercel engagé.

---

## Résumé

La marketplace NaatalFi dispose maintenant d'un socle fonctionnel complet jusqu'à la Phase 9 :

- authentification JWT avec vérification email et reset password ;
- vendeurs, KYC admin, plans vendeur et upload logo Supabase ;
- catégories hiérarchiques avec gestion admin et réordonnancement ;
- produits, galerie, variantes et stock ;
- marketplace publique avec recherche, cache Redis et pagination cursor-based ;
- espace client : commandes, adresses, favoris, paramètres, avatar Supabase ;
- panier persistant multi-vendeurs avec validation stock ;
- commandes multi-vendeurs : `Order` parent + `VendorOrder` par vendeur ;
- paiements PayTech : initiation, webhook, statut, passage commande à `PAID` ;
- wallet vendeur : crédit automatique après paiement (commission selon VendorPlan), transactions, demandes de retrait avec approbation admin.

---

## Déploiement Actuel

| Élément | URL / État |
| :--- | :--- |
| Backend Render | `https://naatalfi-backend.onrender.com` |
| API testée | `https://naatalfi-backend.onrender.com/api/v1/marketplace/categories/` |
| Frontend Vercel | `https://naatalfi.vercel.app` |
| Webhook PayTech | `https://naatalfi-backend.onrender.com/api/v1/payments/webhook/` |
| Worker Celery | Non déployé pour l'instant |
| Mode Celery temporaire | `CELERY_TASK_ALWAYS_EAGER=True` |

Le worker Celery Render est volontairement reporté pour éviter un coût supplémentaire. Les tâches email s'exécutent donc dans le process web via `CELERY_TASK_ALWAYS_EAGER=True`.

---

## Backend

| App | État | Détail |
| :--- | :--- | :--- |
| `users` | Terminé Phase 1 | Register, verify email, login/logout, refresh, forgot/reset password, `/auth/me` |
| `vendors` | Terminé Phase 2 | Boutique, KYC admin, plans, upload logo, emails approbation/suspension |
| `categories` | Terminé Phase 3 | Arbre, CRUD admin, image, reorder |
| `products` | Terminé Phase 4 | CRUD vendeur, images, cover/reorder, variantes, stock |
| `marketplace` | Terminé Phase 5 | Catalogue public, recherche, cache Redis, cursor pagination |
| `account` | Terminé Phase 6 | Profil, avatar, commandes client, adresses, favoris |
| `orders` | Terminé Phases 7-8 | Validation panier, création commande, split multi-vendeurs, statuts vendeur |
| `payments` | Terminé Phase 9 | PayTech initiation, webhook, statut, `Payment`, commande `PAID` |
| `wallet`   | Terminé Phase 10 | `Wallet`, `Transaction`, `PayoutRequest`, crédit auto après vente, retrait + approbation admin |

---

## Frontend

| Zone | État |
| :--- | :--- |
| Auth | Login, register, verify email, forgot/reset password |
| Public | Home, marketplace, recherche, fiche produit, profil vendeur |
| Panier/checkout | Panier persistant, validation stock, checkout PayTech |
| Espace client | Dashboard client, commandes, détail commande, adresses, favoris, paramètres |
| Dashboard vendeur | Boutique, produits, commandes reçues, changement statut, portefeuille (soldes + transactions + retraits) |
| Admin | Vendeurs/KYC, catégories, pages de structure pour modules futurs |

---

## Points Techniques Importants

- `backend/.env` et `frontend/.env` sont ignorés par Git.
- `gunicorn` et `whitenoise` sont ajoutés pour Render.
- `CORS_ALLOWED_ORIGINS` est configurable par variable d'environnement.
- `CELERY_TASK_ALWAYS_EAGER=True` permet de fonctionner sans worker Celery au début.
- L'inscription ne bloque plus si l'envoi email SMTP échoue ; l'API renvoie un `warning`.
- PayTech utilise `BACKEND_URL` pour construire automatiquement `ipn_url`.

---

## Variables Clés En Production

Backend Render :

```env
DEBUG=False
ALLOWED_HOSTS=naatalfi-backend.onrender.com
BACKEND_URL=https://naatalfi-backend.onrender.com
FRONTEND_URL=https://naatalfi.vercel.app
CORS_ALLOWED_ORIGINS=https://naatalfi.vercel.app
CELERY_TASK_ALWAYS_EAGER=True
PAYTECH_ENV=prod
```

Frontend Vercel :

```env
VITE_API_URL=https://naatalfi-backend.onrender.com/api/v1
```

---

## Prochaines Étapes Recommandées

1. Déployer Phase 10 (wallet) sur Render + Vercel et tester avec un vrai paiement PayTech.
2. Démarrer Phase 11 : livraison (ShippingZone, ShippingRate, calcul frais).
3. Phase 12 : Dashboard vendeur complet (KPIs /dashboard, profil, notifications).
4. Ajouter un worker Celery Render quand le volume ou les emails le justifient.
