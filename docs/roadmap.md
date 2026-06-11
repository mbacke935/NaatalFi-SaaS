# Roadmap — NaatalFi Marketplace

Roadmap complet en 20 phases avec livrables fonctionnels à chaque étape.
La marketplace est utilisable en production à partir de la **Phase 9**.

---

## Objectif final

Marketplace multi-vendeurs dédiée au marché sénégalais.

| Segment | Technologie |
| :--- | :--- |
| Frontend | React 19 + Tailwind CSS |
| Backend | Django REST Framework |
| Base de données | PostgreSQL (Supabase) |
| Stockage fichiers | Supabase Storage |
| Cache / Queue | Redis (Upstash) |
| Tâches async | Celery |
| Déploiement frontend | Vercel |
| Déploiement backend | Render |
| Paiement | PayTech · Wave · Orange Money |

---

## PHASE 0 — CONCEPTION

**Objectif :** Définir entièrement le produit avant de coder.

### 0.1 Documentation à produire (`/docs`)
- `architecture.md` — Architecture technique globale
- `database.md` — Schéma complet des tables et relations
- `roadmap.md` — Ce document
- `api.md` — Contrat API (endpoints, payloads, codes retour)
- `business-rules.md` — Règles métier (commissions, abonnements, wallet, trust score)
- `frontend-architecture.md` — Structure React
- `frontend-routes.md` — Toutes les routes

### 0.2 Règles métier à définir
- Rôles utilisateurs (`ADMIN`, `VENDOR`, `CUSTOMER`)
- Taux de commission par catégorie ou plan
- Plans d'abonnement vendeur (Free, Pro, Premium)
- Règles du wallet (pending → available → frozen)
- Conditions de retrait (délai, montant minimum)
- Calcul du trust score
- Règles de modération et litiges
- Politique publicitaire

### 0.3 Schéma de base de données
Relations à modéliser et valider :
`User` · `Vendor` · `VendorPlan` · `Product` · `ProductImage` · `ProductVariant` · `Category` · `Order` · `OrderItem` · `VendorOrder` · `Wallet` · `Transaction` · `PayoutRequest` · `Review` · `AdCampaign` · `Dispute` · `Notification` · `ShippingZone` · `ShippingRate`

### 0.4 Stratégie d'upload fichiers
- Fournisseur : **Supabase Storage**
- Buckets : `avatars`, `vendor-logos`, `product-images`
- Accès public en lecture, accès privé en écriture via token JWT
- Taille max : 5 Mo par image, formats autorisés : JPG, PNG, WebP

**Livrables :**
- ✅ `business-rules.md` complet et validé
- ✅ `database.md` avec schéma validé
- ✅ Stratégie fichiers définie

---

## PHASE 1 — AUTHENTIFICATION + EMAILS

**Objectif :** Inscription, connexion, session JWT, emails transactionnels.

### Backend — App `users`
- Modèle `CustomUser` (extension `AbstractBaseUser`) avec champs : `email`, `phone`, `role`, `is_verified`, `avatar`
- Rôles : `ADMIN`, `VENDOR`, `CUSTOMER`
- Endpoints :
  - `POST /auth/register` — inscription + envoi email de vérification
  - `POST /auth/verify-email` — confirmation email (`uid`, `token`)
  - `POST /auth/login` — retourne `access` + `refresh` token
  - `POST /auth/logout` — blacklist du refresh token
  - `POST /auth/token/refresh` — renouvellement access token
  - `POST /auth/forgot-password` — envoi lien de réinitialisation
  - `POST /auth/reset-password` — changement de mot de passe (`uid`, `token`)
  - `GET /auth/me` — profil de l'utilisateur connecté
  - `PATCH /auth/me` — mise à jour du profil

### Celery — Installation initiale
- Celery + Redis (Upstash) installés et configurés dès cette phase
- Première tâche : `send_verification_email`
- Deuxième tâche : `send_password_reset_email`

### Frontend
- Pages : `/login`, `/register`, `/forgot-password`, `/reset-password/:uid/:token`, `/verify-email/:uid/:token`
- `AuthLayout` implémenté (centré, fond sombre)
- Instance Axios configurée (base URL, intercepteur JWT, refresh automatique sur 401)
- Zustand `authStore` connecté à l'API réelle
- Gestion des tokens (stockage, expiration, refresh)

**Livrables :**
- ✅ Inscription avec vérification email
- ✅ Connexion / déconnexion
- ✅ Réinitialisation de mot de passe
- ✅ Session persistée avec refresh automatique
- ✅ Emails transactionnels fonctionnels

---

## PHASE 2 — VENDEURS + KYC + UPLOAD

**Objectif :** Création de boutique, approbation KYC, upload logo.

### Backend — App `vendors`
- Modèle `Vendor` : `user`, `name`, `slug`, `description`, `logo`, `phone`, `address`, `status` (`PENDING`, `APPROVED`, `SUSPENDED`), `trust_score`, `plan`
- Modèle `VendorPlan` : `name`, `commission_rate`, `monthly_price`, `max_products`
- Upload logo → Supabase Storage bucket `vendor-logos`
- Endpoints :
  - `POST /vendors` — créer sa boutique
  - `GET /vendors/me` — ma boutique
  - `PATCH /vendors/me` — modifier ma boutique
  - `POST /vendors/me/logo` — upload logo
  - `GET /admin/vendors` — liste tous les vendeurs (admin)
  - `PATCH /admin/vendors/:id/approve` — approuver un vendeur
  - `PATCH /admin/vendors/:id/suspend` — suspendre un vendeur
- Celery : `send_vendor_approval_email`, `send_vendor_rejection_email`

### Frontend
- Pages : `/vendor/profile`, `/vendor/settings`
- Composant upload d'image avec prévisualisation

**Livrables :**
- ✅ Création de boutique
- ✅ Flux KYC (soumission → approbation admin → email)
- ✅ Upload logo fonctionnel

---

## PHASE 3 — CATÉGORIES

**Objectif :** Arborescence de catégories (parent / enfant).

### Backend — App `categories`
- Modèle `Category` : `name`, `slug`, `parent` (self-FK), `image`, `order`
- Support catégories imbriquées (2 niveaux)
- Endpoints :
  - `GET /categories` — arbre complet
  - `GET /categories/:slug` — détail + sous-catégories
  - `POST /admin/categories` — créer (admin)
  - `PATCH /admin/categories/:id` — modifier (admin)
  - `DELETE /admin/categories/:id` — supprimer (admin)

### Frontend
- Page : `/admin/categories`
- Composant arbre de catégories (drag & drop pour l'ordre)

**Livrable :** ✅ Catégories hiérarchiques fonctionnelles

---

## PHASE 4 — PRODUITS + GALERIE + VARIANTES

**Objectif :** Catalogue complet avec images, variantes et stock.

### Backend — App `products`
- Modèle `Product` : `vendor`, `category`, `name`, `slug`, `description`, `price`, `status`, `trust_score`
- Modèle `ProductImage` : `product`, `image_url`, `order`, `is_cover`
- Modèle `ProductVariant` : `product`, `name` (ex: Taille, Couleur), `value`, `stock`, `price_delta`
- Upload images → Supabase Storage bucket `product-images` (max 5 images par produit)
- Endpoints CRUD complets :
  - `GET /products` — liste paginée (filtres : catégorie, vendeur, prix, statut)
  - `GET /products/:slug`
  - `POST /vendors/me/products`
  - `PATCH /vendors/me/products/:id`
  - `DELETE /vendors/me/products/:id`
  - `POST /vendors/me/products/:id/images` — upload image
  - `DELETE /vendors/me/products/:id/images/:imageId`

### Frontend
- Pages : `/dashboard/products`, `/dashboard/products/new`, `/dashboard/products/:id/edit`
- Composant galerie avec upload multiple et réordonnancement
- Composant gestion des variantes (ajout dynamique)

**Livrables :**
- ✅ Produits publiés avec galerie
- ✅ Variantes et stock gérés

---

## PHASE 5 — MARKETPLACE PUBLIQUE + RECHERCHE + CACHE

**Objectif :** Catalogue public, recherche, SEO, performances.

### Backend
- Endpoints publics (sans authentification) :
  - `GET /marketplace/products` — catalogue paginé (filtres, tri, recherche)
  - `GET /marketplace/products/:slug` — fiche produit
  - `GET /marketplace/vendors` — liste vendeurs approuvés
  - `GET /marketplace/vendors/:slug` — profil vendeur public
  - `GET /marketplace/categories` — arbre catégories
  - `GET /marketplace/search?q=` — recherche PostgreSQL full-text avec fallback `icontains`
  - `GET /marketplace/featured` — produits mis en avant
- Stratégie cache : Redis sur les endpoints les plus lus (catalogue, catégories) — TTL 5 min
- Pagination : cursor-based pour les performances

### Frontend
- Pages :
  - `/` — Accueil (hero, catégories, produits vedettes)
  - `/marketplace` — Catalogue avec filtres sidebar
  - `/marketplace/:slug` — Fiche produit
  - `/search?q=` — Page résultats recherche
  - `/vendors/:slug` — Profil vendeur public
- Meta tags dynamiques pour SEO (titre, description, og:image)
- Pagination progressive avec `next_cursor`

**Livrables :**
- ✅ Catalogue public et recherche
- ✅ SEO de base
- ✅ Cache Redis actif

---

## PHASE 6 — ESPACE CLIENT

**Objectif :** Interface complète pour les acheteurs.

### Backend
- Endpoints client :
  - `GET /account/orders` — historique commandes
  - `GET /account/orders/:id` — détail commande
  - `GET /account/addresses` — mes adresses
  - `POST /account/addresses`
  - `PATCH /account/addresses/:id`
  - `DELETE /account/addresses/:id`
  - `GET /account/favorites` — produits favoris
  - `POST /account/favorites/:productId`
  - `DELETE /account/favorites/:productId`
  - `PATCH /account/profile` — modifier profil
  - `POST /account/profile/avatar` — upload avatar Supabase

### Frontend
- Pages :
  - `/account` — tableau de bord client
  - `/account/orders` — mes commandes
  - `/account/orders/:id` — détail commande
  - `/account/addresses` — mes adresses
  - `/account/favorites` — mes favoris
  - `/account/settings` — paramètres compte

**Livrables :**
- ✅ Client autonome (commandes, adresses, favoris)
- ✅ Avatar uploadable

---

## PHASE 7 — PANIER

**Objectif :** Panier persistant multi-vendeurs côté client.

### Backend
- Validation stock en temps réel à l'ajout
- Endpoint `POST /orders/validate` — vérifie disponibilité avant paiement

### Frontend
- Store Zustand `cartStore` persistant (localStorage)
- Page `/cart` :
  - Liste des articles groupés par vendeur
  - Modification des quantités avec vérification stock
  - Calcul frais de livraison par vendeur
  - Résumé total
- Composant mini-panier (header)

**Livrables :**
- ✅ Panier persistant et validé
- ✅ Groupement par vendeur visible

---

## PHASE 8 — COMMANDES MULTI-VENDEURS

**Objectif :** Moteur de commande qui fragmente automatiquement par vendeur.

### Backend — App `orders`
- Modèle `Order` : `buyer`, `status`, `total`, `delivery_address`
- Modèle `OrderItem` : `vendor_order`, `product`, `variant`, `quantity`, `unit_price`
- Modèle `VendorOrder` : `order`, `vendor`, `status`, `subtotal`, `shipping_cost`
- Logique de fragmentation :
```
Commande client (1 Order)
  ├── Produit A (Vendeur X) → VendorOrder X
  └── Produit B (Vendeur Y) → VendorOrder Y
```
- Statuts `VendorOrder` : `PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED`
- Endpoints :
  - `POST /orders` — créer une commande
  - `GET /orders/me/:id` — détail commande acheteur
  - `GET /vendors/me/orders` — commandes reçues par le vendeur
  - `PATCH /vendors/me/orders/:id/status` — mettre à jour le statut
- Celery : `send_order_confirmation_email`, `send_vendor_new_order_email`

**Livrables :**
- ✅ Moteur de commande multi-vendeurs
- ✅ Emails de confirmation automatiques

---

## PHASE 9 — PAIEMENTS

**Objectif :** Intégration passerelle → marketplace utilisable en production.

### Backend — App `payments`
- Modèle `Payment` : `order`, `provider`, `amount`, `status`, `reference`
- Intégration : **PayTech** (principal), Wave, Orange Money
- Sécurisation webhook : vérification signature HMAC
- Endpoints :
  - `POST /payments/initiate` — initier un paiement, retourne URL redirect
  - `POST /payments/webhook` — réception confirmation PayTech
  - `GET /payments/:reference` — statut d'un paiement
- Après confirmation webhook :
  1. Paiement marqué `PAID`
  2. Commande activée
  3. Stock décrémenté
  4. Wallets vendeurs crédités (pending)
  5. Emails envoyés

**Livrables :**
- ✅ Paiement réel fonctionnel (PayTech)
- ✅ Webhook sécurisé
- ✅ **Marketplace utilisable en production**

---

## PHASE 10 — WALLET + ABONNEMENTS VENDEURS

**Objectif :** Revenus automatiques et gestion financière des vendeurs.

### Backend — App `wallet`
- Modèle `Wallet` : `vendor`, `pending_balance`, `available_balance`, `frozen_balance`
- Modèle `Transaction` : `wallet`, `type`, `amount`, `description`, `reference`
- Modèle `PayoutRequest` : `wallet`, `amount`, `status`, `bank_info`
- Types de transactions : `SALE`, `COMMISSION`, `PAYOUT`, `REFUND`, `FREEZE`
- Logique financière :
```
Paiement confirmé
  └── Calcul commission (selon VendorPlan)
      ├── Commission → plateforme
      └── Net → wallet vendeur (pending)

Après délai (ex: 7 jours)
  └── pending → available (via tâche Celery)
```
- Plans d'abonnement vendeur (`VendorPlan`) : `FREE` (10%), `PRO` (7%), `PREMIUM` (5%)
- Endpoints :
  - `GET /vendors/me/wallet` — solde et transactions
  - `POST /vendors/me/wallet/payout` — demande de retrait
  - `GET /admin/wallets` — vue globale (admin)
  - `PATCH /admin/payouts/:id/approve` — approuver retrait (admin)

**Livrables :**
- ✅ Wallet automatique après chaque vente
- ✅ Commission calculée selon le plan
- ✅ Retraits avec approbation admin

---

## PHASE 11 — LIVRAISON

**Objectif :** Tarifs de livraison configurables par vendeur et par zone.

### Backend — App `shipping`
- Modèle `ShippingZone` : `vendor`, `name`, `regions` (ex: Dakar, Saint-Louis…)
- Modèle `ShippingRate` : `zone`, `min_weight`, `max_weight`, `price`, `delivery_days`
- Endpoint `POST /shipping/estimate` — calculer les frais avant paiement

### Frontend
- Page : `/dashboard/delivery` — configuration zones et tarifs

**Livrable :** ✅ Frais de livraison dynamiques

---

## PHASE 12 — DASHBOARD VENDEUR COMPLET

**Objectif :** Interface vendeur entièrement fonctionnelle.

### Pages et fonctionnalités
| Page | Contenu |
| :--- | :--- |
| `/dashboard` | KPIs : ventes, revenus, commandes, produits actifs |
| `/dashboard/products` | Liste, activation/désactivation, stock |
| `/dashboard/products/new` | Création avec galerie et variantes |
| `/dashboard/orders` | Commandes reçues, changement de statut |
| `/dashboard/orders/:id` | Détail + historique statuts |
| `/dashboard/wallet` | Solde, transactions, demande de retrait |
| `/dashboard/analytics` | Graphiques ventes, revenus, top produits |
| `/dashboard/shop` | Profil boutique, logo, description, KYC |
| `/dashboard/delivery` | Zones et tarifs de livraison |
| `/dashboard/ads` | Campagnes publicitaires actives |
| `/dashboard/disputes` | Litiges en cours |
| `/dashboard/notifications` | Centre de notifications |
| `/dashboard/profile` | Informations personnelles, mot de passe |

### Layout
- `DashboardLayout` : sidebar de navigation + header (notifications, profil)
- Responsive mobile (menu hamburger)

**Livrable :** ✅ Vendeur 100% autonome

---

## PHASE 13 — DASHBOARD ADMIN COMPLET

**Objectif :** Contrôle et pilotage de toute la plateforme.

### Pages et fonctionnalités
| Page | Contenu |
| :--- | :--- |
| `/admin` | KPIs globaux : GMV, commissions, vendeurs actifs |
| `/admin/vendors` | Liste, approbation KYC, suspension |
| `/admin/vendors/:id` | Détail vendeur, historique, wallet |
| `/admin/users` | Gestion utilisateurs, changement de rôle |
| `/admin/products` | Modération catalogue, signalements |
| `/admin/orders` | Toutes les commandes, filtres avancés |
| `/admin/payments` | Historique paiements, webhook logs |
| `/admin/wallets` | Soldes vendeurs, approbation retraits |
| `/admin/categories` | Gestion arborescence |
| `/admin/reviews` | Modération avis |
| `/admin/ads` | Gestion campagnes publicitaires |
| `/admin/disputes` | Arbitrage litiges |
| `/admin/analytics` | Rapports complets |

**Livrable :** ✅ Contrôle total de la plateforme

---

## PHASE 14 — CELERY COMPLET + NOTIFICATIONS TEMPS RÉEL

**Objectif :** Tâches asynchrones complètes et notifications in-app.

### Tâches Celery (consolidation)
| Tâche | Déclencheur |
| :--- | :--- |
| `send_verification_email` | Inscription |
| `send_password_reset_email` | Mot de passe oublié |
| `send_order_confirmation` | Commande créée |
| `send_vendor_new_order` | Nouvelle commande reçue |
| `send_payment_confirmation` | Paiement validé |
| `send_vendor_approved` | KYC approuvé |
| `release_pending_balance` | Délai post-livraison écoulé |
| `calculate_trust_score` | Après chaque avis ou litige |
| `aggregate_daily_analytics` | Tâche cron quotidienne |
| `expire_ad_campaigns` | Campagne pub terminée |

### Notifications in-app
- Modèle `Notification` : `user`, `type`, `message`, `is_read`, `created_at`
- Endpoint `GET /notifications` + `PATCH /notifications/:id/read`
- Polling toutes les 30 secondes (WebSocket en Phase suivante si besoin)

**Livrable :** ✅ Toutes les tâches async opérationnelles

---

## PHASE 15 — AVIS + TRUST SCORE

**Objectif :** Réputation produits et vendeurs basée sur les avis.

### Backend — App `reviews`
- Modèle `Review` : `author`, `product`, `vendor`, `rating` (1-5), `comment`, `is_verified_purchase`
- Seul un acheteur ayant reçu la commande peut laisser un avis
- Calcul automatique :
  - `Product.average_rating`
  - `Vendor.trust_score` (moyenne pondérée : avis, litiges, délais)
- Endpoints :
  - `POST /reviews` — soumettre un avis
  - `GET /products/:slug/reviews`
  - `GET /vendors/:slug/reviews`
  - `DELETE /admin/reviews/:id` — modération

### Frontend
- Composant étoiles sur la fiche produit et profil vendeur
- Page `/account/reviews` — mes avis

**Livrables :**
- ✅ Avis vérifiés (acheteurs seulement)
- ✅ Trust score dynamique

---

## PHASE 16 — PUBLICITÉS

**Objectif :** Monétisation additionnelle via produits sponsorisés.

### Backend — App `ads`
- Modèle `AdCampaign` : `vendor`, `product`, `budget`, `spent`, `start_date`, `end_date`, `status`, `impressions`, `clicks`
- Logique d'affichage : injection de produits sponsorisés dans le catalogue selon budget restant
- Facturation : débit wallet vendeur par impression ou clic
- Endpoints :
  - `POST /vendors/me/ads` — créer une campagne
  - `GET /vendors/me/ads` — mes campagnes
  - `PATCH /vendors/me/ads/:id` — modifier / pauser
  - `GET /admin/ads` — vue globale (admin)

### Frontend
- Page `/dashboard/ads` — création et suivi campagnes
- Badge "Sponsorisé" sur les produits en campagne

**Livrable :** ✅ Monétisation publicitaire

---

## PHASE 17 — LITIGES

**Objectif :** Sécurité commerciale — protection acheteur et vendeur.

### Backend — App `disputes`
- Modèle `Dispute` : `order`, `initiator`, `reason`, `status` (`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `CLOSED`), `resolution`
- Statuts wallet gelés pendant litige (`FROZEN`)
- Workflow :
```
Client ouvre litige
  └── Admin examine
      ├── Remboursement → wallet client crédité, wallet vendeur débité
      └── Rejet → montant libéré au vendeur
```
- Endpoints :
  - `POST /disputes` — ouvrir un litige
  - `GET /disputes/:id`
  - `POST /admin/disputes/:id/resolve` — résoudre (admin)

**Livrable :** ✅ Sécurité commerciale complète

---

## PHASE 18 — ANALYTICS

**Objectif :** Pilotage business avec données réelles.

### Backend — App `analytics`
- Agrégation via tâches Celery (quotidienne)
- Indicateurs :
  - GMV (Gross Merchandise Value) total et par période
  - Commissions générées
  - Nombre de commandes, panier moyen
  - Top vendeurs (revenus, commandes)
  - Top produits (ventes, vues)
  - Taux de conversion
  - Taux de litiges
- Endpoints :
  - `GET /admin/analytics/overview`
  - `GET /admin/analytics/vendors`
  - `GET /vendors/me/analytics`

### Frontend
- Graphiques : Recharts ou Chart.js
- Filtres par période (7j, 30j, 90j, personnalisé)

**Livrable :** ✅ Pilotage business complet

---

## PHASE 19 — TESTS

**Objectif :** Garantir la fiabilité avant déploiement.

### Backend
- Tests unitaires : modèles, services (commission, wallet, trust score)
- Tests d'intégration : flux complet commande → paiement → wallet
- Tests API : tous les endpoints avec Pytest + DRF test client
- Couverture cible : > 80 % sur les apps critiques (`orders`, `payments`, `wallet`)

### Frontend
- Tests composants : Vitest + Testing Library
- Tests end-to-end : Playwright sur les parcours critiques :
  - Inscription → connexion
  - Ajout panier → paiement
  - Vendeur : créer produit → recevoir commande

**Livrable :** ✅ Suite de tests complète

---

## PHASE 20 — DÉPLOIEMENT

**Objectif :** Mise en production sur l'infrastructure cible.

### Infrastructure
| Composant | Plateforme | Configuration |
| :--- | :--- | :--- |
| Frontend React | Vercel | Build auto sur push `main` |
| Backend Django | Render | Gunicorn + variables d'env |
| Base de données | Supabase | Déjà configuré |
| Stockage fichiers | Supabase Storage | Buckets créés Phase 0 |
| Cache / Celery | Upstash Redis | URL dans variables d'env |

### Checklist déploiement
- `DEBUG=False` en production
- `ALLOWED_HOSTS` configuré
- `SECRET_KEY` sécurisée
- HTTPS forcé
- CORS restreint au domaine Vercel
- Variables d'environnement injectées (pas de `.env` en production)
- Migrations appliquées sur Supabase
- Collecte fichiers statiques (`collectstatic`)
- Celery worker démarré sur Render

### Tests de validation production
- ✅ Inscription + vérification email
- ✅ Connexion + refresh token
- ✅ Création boutique + KYC
- ✅ Publication produit avec images
- ✅ Commande multi-vendeurs
- ✅ Paiement PayTech (webhook)
- ✅ Crédit wallet vendeur
- ✅ Demande et approbation retrait
- ✅ Avis après commande
- ✅ Ouverture et résolution litige

**Livrable :** ✅ NaatalFi Marketplace en production

---

## Vue d'ensemble des phases

```
Phase 0  → Conception (business-rules, database, stratégie fichiers)
Phase 1  → Authentification + Emails + Celery (base)
Phase 2  → Vendeurs + KYC + Upload fichiers
Phase 3  → Catégories
Phase 4  → Produits + Galerie + Variantes
Phase 5  → Marketplace publique + Recherche + Cache
Phase 6  → Espace client (commandes, adresses, favoris)
Phase 7  → Panier
Phase 8  → Commandes multi-vendeurs
Phase 9  → Paiements ← marketplace utilisable ici
Phase 10 → Wallet + Abonnements vendeurs
Phase 11 → Livraison
Phase 12 → Dashboard vendeur complet
Phase 13 → Dashboard admin complet
Phase 14 → Celery complet + Notifications
Phase 15 → Avis + Trust score
Phase 16 → Publicités
Phase 17 → Litiges
Phase 18 → Analytics
Phase 19 → Tests
Phase 20 → Déploiement production
```

---

## Dépendances critiques

| Phase | Dépend de |
| :--- | :--- |
| Phase 1 | Phase 0 (business rules + schéma validés) |
| Phase 2 | Phase 1 (authentification) |
| Phase 4 | Phase 2 (vendeur) + Phase 3 (catégories) |
| Phase 5 | Phase 4 (produits publiés) |
| Phase 8 | Phase 7 (panier) |
| Phase 9 | Phase 8 (commandes) |
| Phase 10 | Phase 9 (paiements confirmés) |
| Phase 15 | Phase 8 (commandes livrées) |
| Phase 17 | Phase 9 (paiements) + Phase 10 (wallet) |
| Phase 20 | Phases 19 (tests validés) |
