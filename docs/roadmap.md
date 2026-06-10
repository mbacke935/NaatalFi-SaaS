# Roadmap — NaatalFi Marketplace

Découpage en 19 phases avec livrables fonctionnels à la fin de chaque phase.
L'ordre minimise les refontes et permet d'avoir une marketplace utilisable dès la Phase 8.

---

## Objectif final

Construire une marketplace multi-vendeurs :

| Segment | Technologie |
| :--- | :--- |
| Frontend | React + Tailwind CSS |
| Backend | Django REST Framework |
| Base de données | PostgreSQL (Supabase) |
| Déploiement frontend | Vercel |
| Déploiement backend | Render |
| Déploiement BDD | Supabase |

---

## PHASE 0 — CONCEPTION ✅

**Objectif :** Définir entièrement le produit avant de coder.

### 0.1 Documentation (`/docs`)
- `architecture.md`
- `database.md`
- `roadmap.md`
- `api.md`
- `business-rules.md`

### 0.2 Règles métier
Définir : rôles, commissions, abonnements, wallet, retraits, trust score, publicité.

### 0.3 Base de données
Relations à modéliser :
`User` · `Vendor` · `Product` · `Category` · `Order` · `OrderItem` · `VendorOrder` · `Wallet` · `Transaction` · `Review` · `AdCampaign`

**Livrable :** ✅ Schéma complet validé

---

## PHASE 1 — AUTHENTIFICATION

**Objectif :** Inscription, connexion, session JWT.

### Backend — App `users`
- Modèle `CustomUser`
- Rôles : `ADMIN`, `VENDOR`, `CUSTOMER`
- Endpoints :
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/logout`
  - `GET /auth/me`
- Simple JWT installé et configuré

### Frontend
- Pages : `/login`, `/register`
- `AuthLayout` implémenté
- Axios configuré (instance + intercepteurs JWT)
- Zustand store auth opérationnel

**Livrables :**
- ✅ Inscription fonctionnelle
- ✅ Connexion fonctionnelle
- ✅ Utilisateur connecté (session persistée)

---

## PHASE 2 — VENDEURS

**Objectif :** Créer et gérer un profil vendeur.

### Backend — App `vendors`
- Modèle `Vendor` : `name`, `slug`, `description`, `logo`, `phone`, `address`, `status`, `trust_score`
- Endpoints :
  - `GET /vendors`
  - `GET /vendors/:id`
  - `POST /vendors`
  - `PUT /vendors/:id`

### Frontend
- Pages : `/vendor/profile`, `/vendor/settings`

**Livrables :**
- ✅ Vendeur créé
- ✅ Profil vendeur visible

---

## PHASE 3 — CATÉGORIES

**Objectif :** Gérer l'arborescence des catégories produits.

### Backend — App `categories`
- Modèle `Category`
- API CRUD complète

### Frontend
- Page : `/dashboard/categories`

**Livrable :** ✅ Catégories fonctionnelles

---

## PHASE 4 — PRODUITS

**Objectif :** Publier et gérer le catalogue produits.

### Backend — App `products`
- Modèles : `Product`, `ProductImage`, `ProductVariant`
- Fonctionnalités : stock, variantes, galerie images
- API CRUD complète

### Frontend
- Pages :
  - `/dashboard/products`
  - `/dashboard/products/create`
  - `/dashboard/products/edit`

**Livrable :** ✅ Produits publiés

---

## PHASE 5 — MARKETPLACE PUBLIQUE

**Objectif :** Catalogue public accessible à tous les visiteurs.

### Frontend
- `/` — Accueil
- `/marketplace` — Catalogue produits
- `/products/:slug` — Fiche produit
- `/search` — Recherche
- `/vendors/:slug` — Profil vendeur public

### Backend
- `GET /marketplace/products`
- `GET /marketplace/vendors`
- `GET /marketplace/search`

**Livrable :** ✅ Catalogue public

---

## PHASE 6 — PANIER

**Objectif :** Gestion du panier multi-vendeurs côté client.

### Frontend
- Page : `/cart`
- Fonctions : ajouter, supprimer, modifier la quantité

### Backend
- Validation du stock à la soumission

**Livrable :** ✅ Panier fonctionnel

---

## PHASE 7 — COMMANDES MULTI-VENDEURS

**Objectif :** Moteur de commande qui fragmente automatiquement par vendeur.

### Backend
- Modèles : `Order`, `OrderItem`, `VendorOrder`
- Logique : 1 commande client → N `VendorOrder` (une par vendeur impliqué)

```
Commande 100 €
  ├── Produit A (Vendeur A) → VendorOrder A
  └── Produit B (Vendeur B) → VendorOrder B
```

**Livrable :** ✅ Moteur de commande opérationnel

---

## PHASE 8 — PAIEMENTS

**Objectif :** Intégration passerelle de paiement → marketplace utilisable.

### Backend — App `payments`
- Intégration : PayTech, Wave, Orange Money
- Webhook PayTech sécurisé
- Endpoints :
  - `POST /payments/initiate`
  - `POST /payments/webhook`

**Livrable :** ✅ Paiement réel fonctionnel

---

## PHASE 9 — WALLET

**Objectif :** Revenus automatiques pour les vendeurs après chaque vente.

### Backend — App `wallet`
- Modèles : `Wallet`, `Transaction`, `PayoutRequest`
- Soldes : `Pending`, `Available`, `Frozen`
- Calcul :
```
Vente
  └── Commission plateforme déduite
      └── Crédit wallet vendeur
```

**Livrable :** ✅ Revenus automatiques

---

## PHASE 10 — LIVRAISON

**Objectif :** Définir les zones et tarifs de livraison par vendeur.

### Backend — App `shipping`
- Modèles : `ShippingZone`, `ShippingRate`

### Frontend
- Page : `/dashboard/delivery`

**Livrable :** ✅ Frais de livraison configurables

---

## PHASE 11 — DASHBOARD VENDEUR

**Objectif :** Interface complète pour que le vendeur soit autonome.

### Pages
- Dashboard (vue d'ensemble + KPIs)
- Products (catalogue)
- Orders (commandes reçues)
- Wallet (solde + historique)
- Payouts (demandes de retrait)
- Analytics (statistiques de vente)
- Reviews (avis reçus)
- Ads (campagnes publicitaires)
- Settings (profil boutique, livraison, KYC)

**Livrable :** ✅ Vendeur 100% autonome

---

## PHASE 12 — DASHBOARD ADMIN

**Objectif :** Contrôle total de la plateforme par l'administrateur.

### Pages
- Admin Dashboard (KPIs globaux)
- Vendors (approbation KYC, gestion)
- Products (modération catalogue)
- Orders (suivi toutes commandes)
- Wallets (soldes vendeurs)
- Payments (historique paiements)
- Reviews (modération avis)
- Ads (gestion campagnes)
- Disputes (litiges en cours)
- Analytics (GMV, commissions, tendances)

**Livrable :** ✅ Contrôle total de la plateforme

---

## PHASE 13 — CELERY / TÂCHES ASYNCHRONES

**Objectif :** Déporter les traitements lourds hors du thread HTTP.

### Installation
- Celery + Redis (Upstash)

### Tâches
- Envoi d'emails (confirmation commande, paiement…)
- Notifications internes
- Calcul du trust score vendeur
- Agrégation des statistiques

**Livrable :** ✅ Tâches automatiques en arrière-plan

---

## PHASE 14 — AVIS

**Objectif :** Système de réputation produits et vendeurs.

### Backend — App `reviews`
- Avis sur produit
- Avis sur vendeur
- Impact sur le trust score

**Livrable :** ✅ Réputation vendeurs et produits

---

## PHASE 15 — PUBLICITÉS

**Objectif :** Monétisation via produits sponsorisés.

### Backend — App `ads`
- Produits sponsorisés
- Gestion de campagnes publicitaires
- Facturation aux vendeurs

**Livrable :** ✅ Monétisation publicitaire

---

## PHASE 16 — LITIGES

**Objectif :** Sécurité commerciale — gestion des réclamations.

### Backend — App `disputes`
- Réclamations client
- Processus de remboursement
- Arbitrage administrateur

**Livrable :** ✅ Sécurité commerciale

---

## PHASE 17 — ANALYTICS

**Objectif :** Pilotage business avec données réelles.

### Backend — App `analytics`
- GMV (Gross Merchandise Value)
- Commissions générées
- Top vendeurs
- Top produits

**Livrable :** ✅ Pilotage business opérationnel

---

## PHASE 18 — TESTS & DÉPLOIEMENT

**Objectif :** Mise en production sur l'infrastructure cible.

### Déploiement
| Composant | Plateforme |
| :--- | :--- |
| Frontend React | Vercel |
| Backend Django | Render |
| Base de données | Supabase (déjà en place) |

### Tests de validation
- ✅ Authentification
- ✅ Commandes multi-vendeurs
- ✅ Paiements
- ✅ Wallet et commissions
- ✅ Retraits
- ✅ Performances

**Livrable :** ✅ NaatalFi Marketplace en production

---

## Ordre de développement

```
Phase 0  → Conception
Phase 1  → Authentification
Phase 2  → Vendeurs
Phase 3  → Catégories
Phase 4  → Produits
Phase 5  → Marketplace publique
Phase 6  → Panier
Phase 7  → Commandes multi-vendeurs
Phase 8  → Paiements          ← marketplace utilisable ici
Phase 9  → Wallet
Phase 10 → Livraison
Phase 11 → Dashboard vendeur
Phase 12 → Dashboard admin
Phase 13 → Celery / Async
Phase 14 → Avis
Phase 15 → Publicités
Phase 16 → Litiges
Phase 17 → Analytics
Phase 18 → Tests & Déploiement
```
