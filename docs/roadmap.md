# Roadmap â€” NaatalFi Marketplace

Roadmap complet en 20 phases avec livrables fonctionnels Ã  chaque Ã©tape.
La marketplace est utilisable en production Ã  partir de la **Phase 9**.

---

## Objectif final

Marketplace multi-vendeurs dÃ©diÃ©e au marchÃ© sÃ©nÃ©galais.

| Segment | Technologie |
| :--- | :--- |
| Frontend | React 19 + Tailwind CSS |
| Backend | Django REST Framework |
| Base de donnÃ©es | PostgreSQL (Supabase) |
| Stockage fichiers | Supabase Storage |
| Cache / Queue | Redis (Upstash) |
| TÃ¢ches async | Celery |
| DÃ©ploiement frontend | Vercel |
| DÃ©ploiement backend | Render |
| Paiement | PayTech Â· Wave Â· Orange Money |

---

## PHASE 0 â€” CONCEPTION

**Objectif :** DÃ©finir entiÃ¨rement le produit avant de coder.

### 0.1 Documentation Ã  produire (`/docs`)
- `architecture.md` â€” Architecture technique globale
- `database.md` â€” SchÃ©ma complet des tables et relations
- `roadmap.md` â€” Ce document
- `api.md` â€” Contrat API (endpoints, payloads, codes retour)
- `business-rules.md` â€” RÃ¨gles mÃ©tier (commissions, abonnements, wallet, trust score)
- `frontend-architecture.md` â€” Structure React
- `frontend-routes.md` â€” Toutes les routes

### 0.2 RÃ¨gles mÃ©tier Ã  dÃ©finir
- RÃ´les utilisateurs (`ADMIN`, `VENDOR`, `CUSTOMER`)
- Taux de commission par catÃ©gorie ou plan
- Plans d'abonnement vendeur (Free, Pro, Premium)
- RÃ¨gles du wallet (pending â†’ available â†’ frozen)
- Conditions de retrait (dÃ©lai, montant minimum)
- Calcul du trust score
- RÃ¨gles de modÃ©ration et litiges
- Politique publicitaire

### 0.3 SchÃ©ma de base de donnÃ©es
Relations Ã  modÃ©liser et valider :
`User` Â· `Vendor` Â· `VendorPlan` Â· `Product` Â· `ProductImage` Â· `ProductVariant` Â· `Category` Â· `Order` Â· `OrderItem` Â· `VendorOrder` Â· `Wallet` Â· `Transaction` Â· `PayoutRequest` Â· `Review` Â· `AdCampaign` Â· `Dispute` Â· `Notification` Â· `ShippingZone` Â· `ShippingRate`

### 0.4 StratÃ©gie d'upload fichiers
- Fournisseur : **Supabase Storage**
- Buckets : `avatars`, `vendor-logos`, `product-images`
- AccÃ¨s public en lecture, accÃ¨s privÃ© en Ã©criture via token JWT
- Taille max : 5 Mo par image, formats autorisÃ©s : JPG, PNG, WebP

**Livrables :**
- âœ… `business-rules.md` complet et validÃ©
- âœ… `database.md` avec schÃ©ma validÃ©
- âœ… StratÃ©gie fichiers dÃ©finie

---

## PHASE 1 â€” AUTHENTIFICATION + EMAILS

**Objectif :** Inscription, connexion, session JWT, emails transactionnels.

### Backend â€” App `users`
- ModÃ¨le `CustomUser` (extension `AbstractBaseUser`) avec champs : `email`, `phone`, `role`, `is_verified`, `avatar`
- RÃ´les : `ADMIN`, `VENDOR`, `CUSTOMER`
- Endpoints :
  - `POST /auth/register` â€” inscription + envoi email de vÃ©rification
  - `POST /auth/verify-email` â€” confirmation email (`uid`, `token`)
  - `POST /auth/login` â€” retourne `access` + `refresh` token
  - `POST /auth/logout` â€” blacklist du refresh token
  - `POST /auth/token/refresh` â€” renouvellement access token
  - `POST /auth/forgot-password` â€” envoi lien de rÃ©initialisation
  - `POST /auth/reset-password` â€” changement de mot de passe (`uid`, `token`)
  - `GET /auth/me` â€” profil de l'utilisateur connectÃ©
  - `PATCH /auth/me` â€” mise Ã  jour du profil

### Celery â€” Installation initiale
- Celery + Redis (Upstash) installÃ©s et configurÃ©s dÃ¨s cette phase
- PremiÃ¨re tÃ¢che : `send_verification_email`
- DeuxiÃ¨me tÃ¢che : `send_password_reset_email`

### Frontend
- Pages : `/login`, `/register`, `/forgot-password`, `/reset-password/:uid/:token`, `/verify-email/:uid/:token`
- `AuthLayout` implÃ©mentÃ© (centrÃ©, fond sombre)
- Instance Axios configurÃ©e (base URL, intercepteur JWT, refresh automatique sur 401)
- Zustand `authStore` connectÃ© Ã  l'API rÃ©elle
- Gestion des tokens (stockage, expiration, refresh)

**Livrables :**
- âœ… Inscription avec vÃ©rification email
- âœ… Connexion / dÃ©connexion
- âœ… RÃ©initialisation de mot de passe
- âœ… Session persistÃ©e avec refresh automatique
- âœ… Emails transactionnels fonctionnels

---

## PHASE 2 â€” VENDEURS + KYC + UPLOAD

**Objectif :** CrÃ©ation de boutique, approbation KYC, upload logo.

### Backend â€” App `vendors`
- ModÃ¨le `Vendor` : `user`, `name`, `slug`, `description`, `logo`, `phone`, `address`, `status` (`PENDING`, `APPROVED`, `SUSPENDED`), `trust_score`, `plan`
- ModÃ¨le `VendorPlan` : `name`, `commission_rate`, `monthly_price`, `max_products`
- Upload logo â†’ Supabase Storage bucket `vendor-logos`
- Endpoints :
  - `POST /vendors` â€” crÃ©er sa boutique
  - `GET /vendors/me` â€” ma boutique
  - `PATCH /vendors/me` â€” modifier ma boutique
  - `POST /vendors/me/logo` â€” upload logo
  - `GET /admin/vendors` â€” liste tous les vendeurs (admin)
  - `PATCH /admin/vendors/:id/approve` â€” approuver un vendeur
  - `PATCH /admin/vendors/:id/suspend` â€” suspendre un vendeur
- Celery : `send_vendor_approval_email`, `send_vendor_rejection_email`

### Frontend
- Pages : `/vendor/profile`, `/vendor/settings`
- Composant upload d'image avec prÃ©visualisation

**Livrables :**
- âœ… CrÃ©ation de boutique
- âœ… Flux KYC (soumission â†’ approbation admin â†’ email)
- âœ… Upload logo fonctionnel

---

## PHASE 3 â€” CATÃ‰GORIES

**Objectif :** Arborescence de catÃ©gories (parent / enfant).

### Backend â€” App `categories`
- ModÃ¨le `Category` : `name`, `slug`, `parent` (self-FK), `image`, `order`
- Support catÃ©gories imbriquÃ©es (2 niveaux)
- Endpoints :
  - `GET /categories` â€” arbre complet
  - `GET /categories/:slug` â€” dÃ©tail + sous-catÃ©gories
  - `POST /admin/categories` â€” crÃ©er (admin)
  - `PATCH /admin/categories/:id` â€” modifier (admin)
  - `DELETE /admin/categories/:id` â€” supprimer (admin)

### Frontend
- Page : `/admin/categories`
- Composant arbre de catÃ©gories (drag & drop pour l'ordre)

**Livrable :** âœ… CatÃ©gories hiÃ©rarchiques fonctionnelles

---

## PHASE 4 â€” PRODUITS + GALERIE + VARIANTES

**Objectif :** Catalogue complet avec images, variantes et stock.

### Backend â€” App `products`
- ModÃ¨le `Product` : `vendor`, `category`, `name`, `slug`, `description`, `price`, `status`, `trust_score`
- ModÃ¨le `ProductImage` : `product`, `image_url`, `order`, `is_cover`
- ModÃ¨le `ProductVariant` : `product`, `name` (ex: Taille, Couleur), `value`, `stock`, `price_delta`
- Upload images â†’ Supabase Storage bucket `product-images` (max 5 images par produit)
- Endpoints CRUD complets :
  - `GET /products` â€” liste paginÃ©e (filtres : catÃ©gorie, vendeur, prix, statut)
  - `GET /products/:slug`
  - `POST /vendors/me/products`
  - `PATCH /vendors/me/products/:id`
  - `DELETE /vendors/me/products/:id`
  - `POST /vendors/me/products/:id/images` â€” upload image
  - `DELETE /vendors/me/products/:id/images/:imageId`

### Frontend
- Pages : `/dashboard/products`, `/dashboard/products/new`, `/dashboard/products/:id/edit`
- Composant galerie avec upload multiple et rÃ©ordonnancement
- Composant gestion des variantes (ajout dynamique)

**Livrables :**
- âœ… Produits publiÃ©s avec galerie
- âœ… Variantes et stock gÃ©rÃ©s

---

## PHASE 5 â€” MARKETPLACE PUBLIQUE + RECHERCHE + CACHE

**Objectif :** Catalogue public, recherche, SEO, performances.

### Backend
- Endpoints publics (sans authentification) :
  - `GET /marketplace/products` â€” catalogue paginÃ© (filtres, tri, recherche)
  - `GET /marketplace/products/:slug` â€” fiche produit
  - `GET /marketplace/vendors` â€” liste vendeurs approuvÃ©s
  - `GET /marketplace/vendors/:slug` â€” profil vendeur public
  - `GET /marketplace/categories` â€” arbre catÃ©gories
  - `GET /marketplace/search?q=` â€” recherche PostgreSQL full-text avec fallback `icontains`
  - `GET /marketplace/featured` â€” produits mis en avant
- StratÃ©gie cache : Redis sur les endpoints les plus lus (catalogue, catÃ©gories) â€” TTL 5 min
- Pagination : cursor-based pour les performances

### Frontend
- Pages :
  - `/` â€” Accueil (hero, catÃ©gories, produits vedettes)
  - `/marketplace` â€” Catalogue avec filtres sidebar
  - `/marketplace/:slug` â€” Fiche produit
  - `/search?q=` â€” Page rÃ©sultats recherche
  - `/vendors/:slug` â€” Profil vendeur public
- Meta tags dynamiques pour SEO (titre, description, og:image)
- Pagination progressive avec `next_cursor`

**Livrables :**
- âœ… Catalogue public et recherche
- âœ… SEO de base
- âœ… Cache Redis actif

---

## PHASE 6 â€” ESPACE CLIENT

**Objectif :** Interface complÃ¨te pour les acheteurs.

### Backend
- Endpoints client :
  - `GET /account/orders` â€” historique commandes
  - `GET /account/orders/:id` â€” dÃ©tail commande
  - `GET /account/addresses` â€” mes adresses
  - `POST /account/addresses`
  - `PATCH /account/addresses/:id`
  - `DELETE /account/addresses/:id`
  - `GET /account/favorites` â€” produits favoris
  - `POST /account/favorites/:productId`
  - `DELETE /account/favorites/:productId`
  - `PATCH /account/profile` â€” modifier profil
  - `POST /account/profile/avatar` â€” upload avatar Supabase

### Frontend
- Pages :
  - `/account` â€” tableau de bord client
  - `/account/orders` â€” mes commandes
  - `/account/orders/:id` â€” dÃ©tail commande
  - `/account/addresses` â€” mes adresses
  - `/account/favorites` â€” mes favoris
  - `/account/settings` â€” paramÃ¨tres compte

**Livrables :**
- âœ… Client autonome (commandes, adresses, favoris)
- âœ… Avatar uploadable

---

## PHASE 7 â€” PANIER

**Objectif :** Panier persistant multi-vendeurs cÃ´tÃ© client.

### Backend
- Validation stock en temps rÃ©el Ã  l'ajout
- Endpoint `POST /orders/validate` â€” vÃ©rifie disponibilitÃ© avant paiement

### Frontend
- Store Zustand `cartStore` persistant (localStorage)
- Page `/cart` :
  - Liste des articles groupÃ©s par vendeur
  - Modification des quantitÃ©s avec vÃ©rification stock
  - Calcul frais de livraison par vendeur
  - RÃ©sumÃ© total
- Composant mini-panier (header)

**Livrables :**
- âœ… Panier persistant et validÃ©
- âœ… Groupement par vendeur visible

---

## PHASE 8 â€” COMMANDES MULTI-VENDEURS

**Objectif :** Moteur de commande qui fragmente automatiquement par vendeur.

### Backend â€” App `orders`
- ModÃ¨le `Order` : `buyer`, `status`, `total`, `delivery_address`
- ModÃ¨le `OrderItem` : `vendor_order`, `product`, `variant`, `quantity`, `unit_price`
- ModÃ¨le `VendorOrder` : `order`, `vendor`, `status`, `subtotal`, `shipping_cost`
- Logique de fragmentation :
```
Commande client (1 Order)
  â”œâ”€â”€ Produit A (Vendeur X) â†’ VendorOrder X
  â””â”€â”€ Produit B (Vendeur Y) â†’ VendorOrder Y
```
- Statuts `VendorOrder` : `PENDING` â†’ `CONFIRMED` â†’ `SHIPPED` â†’ `DELIVERED`
- Endpoints :
  - `POST /orders` â€” crÃ©er une commande
  - `GET /orders/me/:id` â€” dÃ©tail commande acheteur
  - `GET /vendors/me/orders` â€” commandes reÃ§ues par le vendeur
  - `PATCH /vendors/me/orders/:id/status` â€” mettre Ã  jour le statut
- Celery : `send_order_confirmation_email`, `send_vendor_new_order_email`

**Livrables :**
- âœ… Moteur de commande multi-vendeurs
- âœ… Emails de confirmation automatiques

---

## PHASE 9 â€” PAIEMENTS

**Objectif :** IntÃ©gration passerelle â†’ marketplace utilisable en production.

### Backend â€” App `payments`
- ModÃ¨le `Payment` : `order`, `provider`, `amount`, `status`, `reference`
- IntÃ©gration : **PayTech** (principal), Wave, Orange Money
- SÃ©curisation webhook : vÃ©rification signature HMAC
- Endpoints :
  - `POST /payments/initiate` â€” initier un paiement, retourne URL redirect
  - `POST /payments/webhook` â€” rÃ©ception confirmation PayTech
  - `GET /payments/:reference` â€” statut d'un paiement
- AprÃ¨s confirmation webhook :
  1. Paiement marquÃ© `PAID`
  2. Commande parent marquÃ©e `PAID`
  3. Email de confirmation paiement envoyÃ©
  4. PrÃ©paration du point d'extension wallet (crÃ©dit vendeur en Phase 10)

**Livrables :**
- âœ… App `payments`, modÃ¨le `Payment`, initiation PayTech et statut paiement
- âœ… Webhook PayTech implÃ©mentÃ© (`/payments/webhook`) avec HMAC optionnel
- âœ… Commande parent marquÃ©e `PAID` aprÃ¨s confirmation webhook
- âœ… Checkout frontend redirigÃ© vers PayTech
- â³ Test paiement rÃ©el PayTech Ã  valider aprÃ¨s configuration finale du compte PayTech
- â¸ Paiement automatique Wave/PayTech en pause : activation fournisseur requise pour une confirmation serveur fiable
- âœ… Fallback temporaire Wave Business manuel documente, avec validation admin possible
- â³ CrÃ©dit wallet vendeur reportÃ© en Phase 10

---

## PHASE 10 â€” WALLET + ABONNEMENTS VENDEURS

**Objectif :** Revenus automatiques et gestion financiÃ¨re des vendeurs.

### Backend â€” App `wallet`
- ModÃ¨le `Wallet` : `vendor`, `pending_balance`, `available_balance`, `frozen_balance`
- ModÃ¨le `Transaction` : `wallet`, `type`, `amount`, `description`, `reference`
- ModÃ¨le `PayoutRequest` : `wallet`, `amount`, `status`, `bank_info`
- Types de transactions : `SALE`, `COMMISSION`, `PAYOUT`, `REFUND`, `FREEZE`
- Logique financiÃ¨re :
```
Paiement confirmÃ©
  â””â”€â”€ Calcul commission (selon VendorPlan)
      â”œâ”€â”€ Commission â†’ plateforme
      â””â”€â”€ Net â†’ wallet vendeur (pending)

AprÃ¨s dÃ©lai (ex: 7 jours)
  â””â”€â”€ pending â†’ available (via tÃ¢che Celery)
```
- Plans d'abonnement vendeur (`VendorPlan`) : `FREE` (10%), `PRO` (7%), `PREMIUM` (5%)
- Endpoints :
  - `GET /vendors/me/wallet` â€” solde et transactions
  - `POST /vendors/me/wallet/payout` â€” demande de retrait
  - `GET /admin/wallets` â€” vue globale (admin)
  - `PATCH /admin/payouts/:id/approve` â€” approuver retrait (admin)

**Livrables :**
- âœ… Wallet automatique aprÃ¨s chaque vente
- âœ… Commission calculÃ©e selon le plan
- âœ… Retraits avec approbation admin

---

## PHASE 11 â€” LIVRAISON

**Objectif :** Tarifs de livraison configurables par vendeur et par zone.

### Backend â€” App `shipping`
- ModÃ¨le `ShippingZone` : `vendor`, `name`, `regions` (ex: Dakar, Saint-Louisâ€¦)
- ModÃ¨le `ShippingRate` : `zone`, `min_weight`, `max_weight`, `price`, `delivery_days`
- Endpoint `POST /shipping/estimate` â€” calculer les frais avant paiement

### Frontend
- Page : `/dashboard/delivery` â€” configuration zones et tarifs

**Livrable :** âœ… Frais de livraison dynamiques

---

## PHASE 12 â€” DASHBOARD VENDEUR COMPLET

**Objectif :** Interface vendeur entiÃ¨rement fonctionnelle.

### Pages et fonctionnalitÃ©s
| Page | Contenu |
| :--- | :--- |
| `/dashboard` | KPIs : ventes, revenus, commandes, produits actifs |
| `/dashboard/products` | Liste, activation/dÃ©sactivation, stock |
| `/dashboard/products/new` | CrÃ©ation avec galerie et variantes |
| `/dashboard/orders` | Commandes reÃ§ues, changement de statut |
| `/dashboard/orders/:id` | DÃ©tail + historique statuts |
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

**Livrable :** âœ… Vendeur 100% autonome

---

## PHASE 13 â€” DASHBOARD ADMIN COMPLET

**Objectif :** ContrÃ´le et pilotage de toute la plateforme.

### Pages et fonctionnalitÃ©s
| Page | Contenu |
| :--- | :--- |
| `/admin` | KPIs globaux : GMV, commissions, vendeurs actifs |
| `/admin/vendors` | Liste, approbation KYC, suspension |
| `/admin/vendors/:id` | DÃ©tail vendeur, historique, wallet |
| `/admin/users` | Gestion utilisateurs, changement de rÃ´le, activation/desactivation, suppression |
| `/admin/products` | ModÃ©ration catalogue, signalements |
| `/admin/orders` | Toutes les commandes, filtres avancÃ©s |
| `/admin/payments` | Historique paiements, webhook logs |
| `/admin/wallets` | Soldes vendeurs, approbation retraits |
| `/admin/categories` | Gestion arborescence |
| `/admin/reviews` | ModÃ©ration avis |
| `/admin/ads` | Gestion campagnes publicitaires |
| `/admin/disputes` | Arbitrage litiges |
| `/admin/analytics` | Rapports complets |

**Livrable :** âœ… ContrÃ´le total de la plateforme

---

## PHASE 14 â€” CELERY COMPLET + NOTIFICATIONS TEMPS RÃ‰EL

**Objectif :** TÃ¢ches asynchrones complÃ¨tes et notifications in-app.

### TÃ¢ches Celery (consolidation)
| TÃ¢che | DÃ©clencheur |
| :--- | :--- |
| `send_verification_email` | Inscription |
| `send_password_reset_email` | Mot de passe oubliÃ© |
| `send_order_confirmation` | Commande crÃ©Ã©e |
| `send_vendor_new_order` | Nouvelle commande reÃ§ue |
| `send_payment_confirmation` | Paiement validÃ© |
| `send_vendor_approved` | KYC approuvÃ© |
| `release_pending_balance` | DÃ©lai post-livraison Ã©coulÃ© |
| `calculate_trust_score` | AprÃ¨s chaque avis ou litige |
| `aggregate_daily_analytics` | TÃ¢che cron quotidienne |
| `expire_ad_campaigns` | Campagne pub terminÃ©e |

### Notifications in-app
- ModÃ¨le `Notification` : `user`, `type`, `title`, `message`, `link_url`, `is_read`, `created_at`
- Endpoint `GET /notifications` + `PATCH /notifications/:id/read` + `POST /notifications/read-all`
- Polling toutes les 30 secondes (WebSocket en Phase suivante si besoin)

**Livrable :** âœ… Notifications in-app operationnelles, taches Celery consolidees. Le `trust_score` est alimente par les avis depuis la phase 15 ; la ponderation litiges/delais depend encore de la phase 17.

---

## PHASE 15 â€” AVIS + TRUST SCORE

**Objectif :** RÃ©putation produits et vendeurs basÃ©e sur les avis.

### Backend â€” App `reviews`
- ModÃ¨le `Review` : `author`, `product`, `vendor`, `rating` (1-5), `comment`, `is_verified_purchase`
- Seul un acheteur ayant reÃ§u la commande peut laisser un avis
- Calcul automatique :
  - `Product.average_rating`
  - `Vendor.trust_score` (moyenne pondÃ©rÃ©e : avis, litiges, dÃ©lais)
- Endpoints :
  - `POST /reviews` â€” soumettre un avis
  - `GET /products/:slug/reviews`
  - `GET /vendors/:slug/reviews`
  - `DELETE /admin/reviews/:id` â€” modÃ©ration

### Frontend
- Composant Ã©toiles sur la fiche produit et profil vendeur
- Page `/account/reviews` â€” mes avis

**Livrables :**
- âœ… Avis vÃ©rifiÃ©s (acheteurs seulement)
- âœ… Trust score dynamique

---

## PHASE 16 â€” PUBLICITÃ‰S

**Objectif :** MonÃ©tisation additionnelle via produits sponsorisÃ©s.

### Backend â€” App `ads`
- ModÃ¨le `AdCampaign` : `vendor`, `product`, `budget`, `spent`, `start_date`, `end_date`, `status`, `impressions`, `clicks`
- Logique d'affichage : injection de produits sponsorisÃ©s dans le catalogue selon budget restant
- Facturation : dÃ©bit wallet vendeur par impression ou clic
- Endpoints :
  - `POST /vendors/me/ads` â€” crÃ©er une campagne
  - `GET /vendors/me/ads` â€” mes campagnes
  - `PATCH /vendors/me/ads/:id` â€” modifier / pauser
  - `GET /admin/ads` â€” vue globale (admin)

### Frontend
- Page `/dashboard/ads` â€” crÃ©ation et suivi campagnes
- Badge "SponsorisÃ©" sur les produits en campagne

**Livrable :** âœ… MonÃ©tisation publicitaire

---

## PHASE 17 â€” LITIGES

**Objectif :** SÃ©curitÃ© commerciale â€” protection acheteur et vendeur.

### Backend â€” App `disputes`
- ModÃ¨le `Dispute` : `order`, `initiator`, `reason`, `status` (`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `CLOSED`), `resolution`
- Statuts wallet gelÃ©s pendant litige (`FROZEN`)
- Workflow :
```
Client ouvre litige
  â””â”€â”€ Admin examine
      â”œâ”€â”€ Remboursement â†’ wallet client crÃ©ditÃ©, wallet vendeur dÃ©bitÃ©
      â””â”€â”€ Rejet â†’ montant libÃ©rÃ© au vendeur
```
- Endpoints :
  - `POST /disputes` â€” ouvrir un litige
  - `GET /disputes/:id`
  - `POST /admin/disputes/:id/resolve` â€” rÃ©soudre (admin)

**Livrable :** âœ… SÃ©curitÃ© commerciale complÃ¨te

---

## PHASE 18 â€” ANALYTICS

**Objectif :** Pilotage business avec donnÃ©es rÃ©elles.

### Backend â€” App `analytics`
- AgrÃ©gation via tÃ¢ches Celery (quotidienne)
- Indicateurs :
  - GMV (Gross Merchandise Value) total et par pÃ©riode
  - Commissions gÃ©nÃ©rÃ©es
  - Nombre de commandes, panier moyen
  - Top vendeurs (revenus, commandes)
  - Top produits (ventes, vues)
  - Taux de conversion
  - Taux de litiges
- Endpoints :
  - `GET /analytics/admin/overview/`
  - `GET /analytics/admin/vendors/`
  - `GET /analytics/vendors/me/`

### Frontend
- Graphiques : Recharts ou Chart.js
- Filtres par pÃ©riode (7j, 30j, 90j, personnalisÃ©)

**Livrable :** âœ… Pilotage business complet

---

## PHASE 19 â€” TESTS

**Objectif :** Garantir la fiabilitÃ© avant dÃ©ploiement.

### Backend
- Tests unitaires : modÃ¨les, services (commission, wallet, trust score)
- Tests d'intÃ©gration : flux complet commande â†’ paiement â†’ wallet
- Tests API : tous les endpoints avec Pytest + DRF test client
- Couverture cible : > 80 % sur les apps critiques (`orders`, `payments`, `wallet`)

### Frontend
- Tests composants : Vitest + Testing Library
- Tests end-to-end : Playwright sur les parcours critiques :
  - Inscription â†’ connexion
  - Ajout panier â†’ paiement
  - Vendeur : crÃ©er produit â†’ recevoir commande

**Livrable :** âœ… Suite de tests complÃ¨te

---

## PHASE 20 â€” DÃ‰PLOIEMENT

**Objectif :** Mise en production sur l'infrastructure cible.

### Infrastructure
| Composant | Plateforme | Configuration |
| :--- | :--- | :--- |
| Frontend React | Vercel | Build auto sur push `main` |
| Backend Django | Render | Gunicorn + variables d'env |
| Base de donnÃ©es | Supabase | DÃ©jÃ  configurÃ© |
| Stockage fichiers | Supabase Storage | Buckets crÃ©Ã©s Phase 0 |
| Cache / Celery | Upstash Redis | URL dans variables d'env |

### Checklist dÃ©ploiement
- `DEBUG=False` en production
- `ALLOWED_HOSTS` configurÃ©
- `SECRET_KEY` sÃ©curisÃ©e
- HTTPS forcÃ©
- CORS restreint au domaine Vercel
- Variables d'environnement injectÃ©es (pas de `.env` en production)
- Migrations appliquÃ©es sur Supabase
- Collecte fichiers statiques (`collectstatic`)
- Celery worker dÃ©marrÃ© sur Render

### Tests de validation production
- âœ… Inscription + vÃ©rification email
- âœ… Connexion + refresh token
- âœ… CrÃ©ation boutique + KYC
- âœ… Publication produit avec images
- âœ… Commande multi-vendeurs
- âœ… Paiement PayTech (webhook)
- âœ… CrÃ©dit wallet vendeur
- âœ… Demande et approbation retrait
- âœ… Avis aprÃ¨s commande
- âœ… Ouverture et rÃ©solution litige

**Livrable :** âœ… NaatalFi Marketplace en production

---

## Vue d'ensemble des phases

```
Phase 0  â†’ Conception (business-rules, database, stratÃ©gie fichiers)
Phase 1  â†’ Authentification + Emails + Celery (base)
Phase 2  â†’ Vendeurs + KYC + Upload fichiers
Phase 3  â†’ CatÃ©gories
Phase 4  â†’ Produits + Galerie + Variantes
Phase 5  â†’ Marketplace publique + Recherche + Cache
Phase 6  â†’ Espace client (commandes, adresses, favoris)
Phase 7  â†’ Panier
Phase 8  â†’ Commandes multi-vendeurs
Phase 9  â†’ Paiements â† marketplace utilisable ici
Phase 10 â†’ Wallet + Abonnements vendeurs
Phase 11 â†’ Livraison
Phase 12 â†’ Dashboard vendeur complet
Phase 13 â†’ Dashboard admin complet
Phase 14 â†’ Celery complet + Notifications
Phase 15 â†’ Avis + Trust score
Phase 16 â†’ PublicitÃ©s
Phase 17 â†’ Litiges
Phase 18 â†’ Analytics
Phase 19 â†’ Tests
Phase 20 â†’ DÃ©ploiement production
```

---

## DÃ©pendances critiques

| Phase | DÃ©pend de |
| :--- | :--- |
| Phase 1 | Phase 0 (business rules + schÃ©ma validÃ©s) |
| Phase 2 | Phase 1 (authentification) |
| Phase 4 | Phase 2 (vendeur) + Phase 3 (catÃ©gories) |
| Phase 5 | Phase 4 (produits publiÃ©s) |
| Phase 8 | Phase 7 (panier) |
| Phase 9 | Phase 8 (commandes) |
| Phase 10 | Phase 9 (paiements confirmÃ©s) |
| Phase 15 | Phase 8 (commandes livrÃ©es) |
| Phase 17 | Phase 9 (paiements) + Phase 10 (wallet) |
| Phase 20 | Phases 19 (tests validÃ©s) |

---

## Etat d'avancement actuel - 13 juin 2026

### Phases 0 a 18 : completement implementees

Toutes les phases techniques sont implementees : conception, auth, vendeurs/KYC, categories, produits, marketplace publique, espace client, panier, commandes multi-vendeurs, paiements PayTech, wallet vendeur, livraison, dashboards vendeur et admin complets, notifications, avis, publicites, litiges et analytics.

Note paiement au 13 juin 2026 : l'automatisation du paiement reel est volontairement en pause jusqu'a activation PayTech ou Wave API. Wave Business reste un fallback manuel temporaire ; il ne doit pas etre considere comme une validation automatique definitive.

### Phase MVP

**Monetisation simplifiee :**
- Commission unique : **8% flat** sur chaque vente (`PLATFORM_COMMISSION_RATE = Decimal('8.00')` dans `apps/wallet/services.py`).
- Aucun abonnement mensuel. Tous les vendeurs sont rattaches au plan FREE.
- Produits illimites pour tous les vendeurs.
- Coordonnees de versement plateforme configurables par l'admin dans `/admin/wallets`.
- Plan vendeur ignore pour le calcul du taux.
- Tous les modeles DB conserves (VendorPlan, AdCampaign, Review, Dispute, Notification).

**Fonctionnalites reactives ou completees :**

| Feature | Etat actuel |
| :--- | :--- |
| Favoris | Actif sur fiche produit et espace client |
| Avis client | Actif sur fiche produit et page `AccountReviewsPage` |
| Analytics vendeur avancees | Actif : revenus, commandes, articles vendus, panier moyen, taux litiges, top produits |
| Publicites sponsorisees | Actif : creation, suivi, pause/reprise campagnes vendeur |
| Litiges | Actif : ouverture client, suivi vendeur, arbitrage admin |

Le composant `src/components/ui/ComingSoon.jsx` reste disponible dans le codebase, mais les pages applicatives principales ne sont plus en mode placeholder.

### Phase 10 - Wallet (mise a jour)

La commission est maintenant **8% flat** independamment du plan vendeur. Le serializer `WalletSerializer` expose `commission_rate = "8.00"` pour tous les vendeurs. La source de verite est la constante `PLATFORM_COMMISSION_RATE`. Les commissions sont tracees par `Transaction.COMMISSION`; le compte de versement plateforme est gerable via `/wallet/admin/platform-account/`.

### Phase 19 - Tests

Commande :
```powershell
cd backend
venv\Scripts\python manage.py test --settings=config.test_settings --verbosity 2
```

Couverture : wallet, shipping, users, vendors, categories, products, marketplace, account, orders, payments, notifications, reviews, ads, disputes, analytics.

Resultat actuel : backend complet **113 tests OK** ; frontend **21 tests OK** ; build Vite OK. Derniers ajouts securite : produits publics limites aux vendeurs approuves, checkout invite expire/restaure le stock, variante incompatible bloquee, uploads image MIME usurpes rejetes, mots de passe hashes et non exposes, tokens invites transmis via fragment URL puis header `X-Guest-Token`.

Dont 16 tests wallet specifiques a la commission 8% (idempotence, multi-vendeur, vendeur sans plan, revenue admin comptable, coordonnees versement plateforme) et le flux complet webhook PayTech → credit wallet (20 000 FCFA → commission 1 600 → net vendeur 18 400).
