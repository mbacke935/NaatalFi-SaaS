# Compte Rendu - Etat Actuel NaatalFi

**Date :** 12 juin 2026
**Etat :** phases 0 a 18 completement implementees + MVP simplifie deploye. 77 tests backend OK + 12 tests frontend (Vitest). Pret pour deploiement production.

---

## Resume Executif

NaatalFi est une marketplace multi-vendeurs senegalaise. Le socle technique est complet et stabilise. Une simplification MVP a ete appliquee le 12 juin 2026 pour permettre un lancement rapide : monetisation par commission flat 8%, fonctionnalites avancees differees avec code conserve en commentaire.

---

## Strategie MVP (appliquee le 12 juin 2026)

### Monetisation

- **Un seul plan** : inscription gratuite pour tous les vendeurs.
- Produits illimites pour tous les vendeurs.
- **Commission flat 8%** deduire automatiquement de chaque vente (`PLATFORM_COMMISSION_RATE = Decimal('8.00')`).
- Aucun abonnement mensuel, aucun frais d'inscription.
- Les coordonnees de versement de la plateforme sont configurables par l'admin dans `/admin/wallets`.
- La constante `PLATFORM_COMMISSION_RATE` est dans `apps/wallet/services.py` et importee par les serializers — un seul endroit a modifier pour ajuster le taux.

### Fonctionnalites actives au lancement

Auth, catalogue, recherche, panier, commandes multi-vendeurs, paiement PayTech, historique/suivi commandes, gestion boutique/produits/stock/commandes/livraison/wallet vendeur, admin KYC/vendeurs/produits/commandes/wallets/retraits/categories/analytics.
Le footer public, l'image hero et les categories populaires de l'accueil sont configurables par l'admin : email, telephone, Facebook, Instagram, TikTok, LinkedIn, URL de l'image hero et affiches de categories.

### Fonctionnalites differees (code conserve en commentaire)

| Fonctionnalite | Phase Future | Etat frontend | Etat backend |
| :--- | :--- | :--- | :--- |
| Favoris produit | 1 | ✅ **Reactive** : bouton coeur sur `ProductDetailPage`, page `AccountFavoritesPage` complete | Endpoints actifs, modele intact |
| Avis / notes | 1 | ✅ **Reactive** : avis sur fiche produit + page `AccountReviewsPage` complete | Endpoints actifs, modele intact |
| Trust Score / Badges | 1 | — (reste differe) | Calcul desactive en surface |
| Analytics avancees vendeur | 1 | Cards "Articles vendus", "Panier moyen", "Taux litiges", "Top produits" commente dans `AnalyticsPage` | Endpoint complet, champs disponibles |
| Publicites sponsorisees | 2 | `AdsPage` affiche ComingSoon, badge Sponsorise masque | Backend complet |
| Litiges | 3 | `DisputesPage` vendeur = page contact WhatsApp/Email | Backend complet |
| Notifications temps reel | 3 | Email uniquement, polling desactive | — |
| Features IA | 3 | — | — |

**Principe** : aucune page supprimee. Le code original est conserve dans des blocs `/* PHASE_FUTURE_X ... */`. Pour reactiver, decommenter le bloc et supprimer le composant actif.

---

## Deploiement Actuel

| Element | URL / Etat |
| :--- | :--- |
| Backend Render | `https://naatalfi-backend.onrender.com` |
| Frontend Vercel | `https://naatalfi.vercel.app` |
| Webhook PayTech | `https://naatalfi-backend.onrender.com/api/v1/payments/webhook/` |
| Worker Celery | Non deploye ; remplace par EmailLog + cron GitHub Actions |
| Base de donnees | Supabase PostgreSQL |
| Stockage fichiers | Supabase Storage |
| Emails transactionnels | AWS SES via API HTTPS + EmailLog |

### Taches planifiees sans worker payant

- Les emails transactionnels sont enregistres dans `EmailLog` avec le statut `PENDING`.
- L'endpoint securise `POST /api/v1/internal/cron/run/` traite les emails pending et les taches periodiques.
- GitHub Actions appelle cet endpoint toutes les 10 minutes via `.github/workflows/cron.yml`.
- L'envoi email utilise `EMAIL_PROVIDER=aws_ses` et l'API HTTPS AWS SES (`sesv2`) pour eviter les timeouts SMTP.
- Redis reste utilise pour le cache, pas comme queue obligatoire.
- Le webhook PayTech credite le wallet vendeur directement apres validation du paiement, sans passer par Celery.

---

## Backend

| App | Etat | Detail |
| :--- | :--- | :--- |
| `users` | Complet | Auth JWT, verification email, reset password, liste admin, update role/actif, suppression admin |
| `vendors` | Complet | Boutique, KYC admin, detail enrichi wallet/stats, approbation/suspension |
| `categories` | Complet | Arbre hierarchique, CRUD admin, image, reorder |
| `products` | Complet | CRUD vendeur, galerie, variantes, stock, moderation admin |
| `marketplace` | Complet | Catalogue public, recherche full-text, cache Redis, pagination cursor |
| `account` | Complet | Profil, avatar Supabase, commandes client, adresses, favoris |
| `orders` | Complet | Validation panier, split multi-vendeurs, statuts vendeur, liste admin |
| `payments` | Complet | PayTech initiation + webhook HMAC, statut, historique admin |
| `wallet` | Complet | Commission 8% flat, credit auto apres paiement, pending->available (7j), retraits, approbation/rejet admin, coordonnees versement plateforme |
| `shipping` | Complet | Zones/tarifs vendeur, estimation region + poids, checkout |
| `notifications` | Complet | Modele, liste, mark read, read-all |
| `reviews` | Complet | Avis verifies, recalcul notes produit/vendeur, moderation admin |
| `ads` | Complet (defere MVP) | Campagnes sponsorisees, debit wallet, injection marketplace, expiration Celery |
| `disputes` | Complet (defere MVP) | Ouverture litige, gel wallet, resolution admin remboursement/liberation |
| `analytics` | Complet | GMV, commissions, top vendeurs/produits, serie quotidienne, endpoints admin + vendeur |
| `platform` | Complet | Informations publiques de plateforme, API publique footer/hero/categories populaires, edition admin |

### Commission — flux complet

```
Client paie via PayTech (montant total vers NaatalFi)
  ↓ webhook
credit_wallet_from_order()
  ↓ pour chaque VendorOrder
  commission = subtotal × 8%
  net = subtotal - commission + shipping_cost
  → Transaction SALE (net)  → pending_balance vendeur
  → Transaction COMMISSION (commission) [ecriture comptable]
  ↓ (7 jours apres livraison)
release_pending_balances()
  → pending_balance → available_balance
  ↓
Vendeur demande retrait → admin approuve → virement manuel

Revenue plateforme = somme des Transaction.COMMISSION
Visible dans /admin/analytics → card "Commissions"
```

---

## Frontend

| Zone | Pages | Etat |
| :--- | :--- | :--- |
| Auth | /login, /register, /forgot-password, /reset-password, /verify-email | Complet |
| Public | /, /marketplace, /marketplace/:slug, /search, /vendors/:slug | Complet |
| Panier/checkout | /cart, /checkout | Complet (adresses sauvegardees, PayTech) |
| Espace client | /account, /account/orders, /account/orders/:id, /account/addresses, /account/settings, /account/favorites, /account/reviews | Complet (favoris + avis reactives) |
| Dashboard vendeur | /dashboard, /dashboard/products, /dashboard/orders, /dashboard/wallet, /dashboard/shop, /dashboard/delivery, /dashboard/notifications, /dashboard/profile | Complet |
| Dashboard vendeur (simplifie) | /dashboard/analytics | Revenus + Commandes + graphe uniquement |
| Dashboard vendeur (differe) | /dashboard/ads, /dashboard/disputes | ComingSoon / page contact |
| Admin | /admin, /admin/vendors, /admin/users, /admin/products, /admin/orders, /admin/payments, /admin/wallets, /admin/categories, /admin/reviews, /admin/ads, /admin/disputes, /admin/analytics, /admin/platform | Complet |

### Composant ComingSoon

`src/components/ui/ComingSoon.jsx` — composant reutilisable avec icone horloge, titre, description et badge "Bientot disponible". Utilise par toutes les pages differees.

### Performances frontend

- Toutes les pages sont lazy-loadees (React.lazy + Suspense) avec spinner dore.
- Build Vite : ~490ms, chunks separes par page.
- Debounce 400ms sur la recherche dans la nav publique.
- Confirmations inline (zero window.confirm / window.prompt).

---

## Tests Backend

77 tests, tous verts.

```powershell
cd C:\NaatalFi-SaaS\backend
venv\Scripts\python manage.py test --settings=config.test_settings --verbosity 2
```

Couverture :

- `wallet` : 16 tests — commission 8% flat, idempotence, multi-vendeur, release pending/available, revenue admin comptable, coordonnees versement plateforme
- `orders` : 6 tests — validation stock, permissions, flux webhook->wallet complet (18 400 FCFA net sur 20 000 FCFA)
- `shipping` : estimation region + poids
- `users` : admin role/actif, protection auto-desactivation
- `vendors` : creation boutique, unicite, plan FREE 8% illimite, approbation/suspension
- `categories` : listing public, protection admin, creation, reorder
- `products` : route admin, moderation statut, produits illimites
- `marketplace` : produits publies, recherche, detail vendeur approuve
- `account` : adresses, defaut unique, favoris idempotents
- `payments` : liste admin, statut webhook
- `notifications` : isolation, mark read, read-all
- `reviews` : achat livre, anti-doublon, recalcul scores, suppression admin
- `ads` : creation campagne, debit wallet, solde insuffisant, sponsorises
- `disputes` : ouverture, gel wallet, resolution refund/no-refund
- `analytics` : overview admin, top vendeurs, analytics vendeur
- `platform` : lecture publique footer, modification admin des informations publiques
- `internal` : cron securise, EmailLog, reprise des emails `SENDING`, envoi AWS SES/Resend/fallback SMTP

---

## Securite & Qualite (renforce le 12 juin 2026)

- **Webhook PayTech durci** (`apps/payments/services.py`) : verification native de l'IPN via `api_key_sha256` / `api_secret_sha256` (methode officielle PayTech), fallback signature HMAC header, et **refus des webhooks non signes en production** (acceptes uniquement en `DEBUG`). Couvert par 4 tests.
- **Rate limiting auth** (`config/settings.py` + vues `apps/users`) : `ScopedRateThrottle` DRF sur login (10/min), register (5/min), reset mot de passe (5/min). Test dedie verifiant le 429.
- **SECRET_KEY** : aucune valeur de repli — `config/settings.py` leve `ValueError` si absente.
- **Pages legales** : `/cgu` (Conditions Generales) et `/confidentialite` (Politique de confidentialite) ajoutees, liees dans le footer.
- **Tests frontend** : suite Vitest + Testing Library (jsdom) — 12 tests sur `cartStore` et `ComingSoon`. Scripts `npm test` / `npm run test:watch`.

---

## Points Techniques Importants

- `PLATFORM_COMMISSION_RATE = Decimal('8.00')` dans `apps/wallet/services.py` — source de verite unique pour le taux.
- `WalletSerializer.get_commission_rate()` et `AdminWalletSerializer.get_commission_rate()` retournent `PLATFORM_COMMISSION_RATE`, jamais le taux du plan.
- `config/test_settings.py` force SQLite en memoire, Celery eager, email local, hash rapide.
- Worker Celery non requis pour le MVP : emails via `EmailLog`, taches periodiques via endpoint cron securise.
- GitHub Actions appelle `/api/v1/internal/cron/run/` avec `X-CRON-SECRET`.
- PayTech utilise `BACKEND_URL` pour construire automatiquement `ipn_url`.
- Routes critiques ordonnees : `/products/admin/` et `/payments/admin/` declarees avant les routes dynamiques.
- Build frontend : aucun `window.confirm` / `window.prompt` — tout remplace par des confirmations inline.

---

## Variables Cles En Production

Backend Render :

```env
DEBUG=False
ALLOWED_HOSTS=naatalfi-backend.onrender.com
BACKEND_URL=https://naatalfi-backend.onrender.com
FRONTEND_URL=https://naatalfi.vercel.app
CORS_ALLOWED_ORIGINS=https://naatalfi.vercel.app
CELERY_TASK_ALWAYS_EAGER=True
CRON_SECRET=long-secret-random
PAYTECH_ENV=prod
EMAIL_PROVIDER=aws_ses
AWS_SES_REGION=eu-west-1
DEFAULT_FROM_EMAIL=NaatalFi <no-reply@naatalfi.com>
```

Frontend Vercel :

```env
VITE_API_URL=https://naatalfi-backend.onrender.com/api/v1
```

---

## Prochaines Etapes Recommandees

1. **Redeployer** Render + Vercel avec l'etat actuel (commit `96b038b`).
2. **Valider en production** le flux complet : inscription → boutique → produit → commande → webhook PayTech → wallet vendeur → retrait.
3. **Configurer compte PayTech** et tester un vrai paiement avec le webhook.
4. **Ajouter worker Celery/Beat** sur Render quand le budget le permet (release wallet automatique, emails async, cron analytics).
5. **Phase Future 1** (quand 50+ vendeurs actifs) : decommenter favoris, avis, trust score, analytics avancees.
6. **Phase Future 2** (quand revenus stables) : decommenter publicites sponsorisees.
7. **Phase Future 3** (si volume litiges le justifie) : decommenter litiges, notifications temps reel.
