# Contrat API â€” NaatalFi Marketplace

Base URL : `https://api.naatalfi.com/api/v1`
Format : JSON
Authentification : Bearer Token (JWT)
Pagination publique : `?page_size=20&cursor=<next_cursor>`

---

## Conventions

### Authentification

| AccÃ¨s | Header requis |
| :--- | :--- |
| Public | Aucun |
| Utilisateur connectÃ© | `Authorization: Bearer <access_token>` |
| Vendeur approuvÃ© | Bearer + rÃ´le `VENDOR` + statut `APPROVED` |
| Admin | Bearer + rÃ´le `ADMIN` |

### Codes de rÃ©ponse

| Code | Signification |
| :--- | :--- |
| 200 | SuccÃ¨s |
| 201 | Ressource crÃ©Ã©e |
| 204 | SuccÃ¨s sans contenu |
| 400 | DonnÃ©es invalides |
| 401 | Non authentifiÃ© |
| 403 | AccÃ¨s refusÃ© |
| 404 | Ressource introuvable |
| 409 | Conflit (ex: email dÃ©jÃ  utilisÃ©) |
| 422 | Erreur de validation mÃ©tier |
| 500 | Erreur serveur |

### Format d'erreur

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Le champ email est invalide.",
  "details": { "email": ["Entrez une adresse e-mail valide."] }
}
```

---

## 1. Authentification â€” `/auth`

### `POST /auth/register`
CrÃ©er un compte. Envoie un email de vÃ©rification.

**Body**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "first_name": "Aminata",
  "last_name": "Diallo",
  "phone": "+221771234567",
  "role": "CUSTOMER"
}
```
**RÃ©ponse 201**
```json
{ "message": "Compte crÃ©Ã©. VÃ©rifiez votre email." }
```

Si l'email SMTP Ã©choue mais que le compte est crÃ©Ã©, la rÃ©ponse reste `201` avec un warning :

```json
{
  "message": "Compte crÃ©Ã©. VÃ©rifiez votre email pour activer votre compte.",
  "warning": "Compte crÃ©Ã©, mais l'email de vÃ©rification n'a pas pu Ãªtre envoyÃ©. VÃ©rifiez la configuration SMTP."
}
```

---

### `POST /auth/verify-email`
VÃ©rifier l'email via le lien reÃ§u.

**Body**
```json
{ "uid": "<uid>", "token": "<token>" }
```

**RÃ©ponse 200**
```json
{ "message": "Email vÃ©rifiÃ© avec succÃ¨s." }
```

---

### `POST /auth/login`
Connexion. Retourne les tokens JWT.

**Body**
```json
{ "email": "user@example.com", "password": "motdepasse123" }
```
**RÃ©ponse 200**
```json
{
  "access": "<access_token>",
  "refresh": "<refresh_token>",
  "user": { "id": "uuid", "email": "...", "role": "CUSTOMER", "is_verified": true }
}
```

---

### `POST /auth/token/refresh`
Renouveler l'access token.

**Body**
```json
{ "refresh": "<refresh_token>" }
```
**RÃ©ponse 200**
```json
{ "access": "<nouveau_access_token>" }
```

---

### `POST /auth/logout`
Invalider le refresh token (blacklist).

**Body**
```json
{ "refresh": "<refresh_token>" }
```
**RÃ©ponse 204**

---

### `POST /auth/forgot-password`
Envoyer un email de rÃ©initialisation.

**Body**
```json
{ "email": "user@example.com" }
```
**RÃ©ponse 200**
```json
{ "message": "Email de rÃ©initialisation envoyÃ©." }
```

---

### `POST /auth/reset-password`
Changer le mot de passe via le lien reÃ§u.

**Body**
```json
{ "uid": "<uid>", "token": "<token>", "password": "nouveaumotdepasse123" }
```
**RÃ©ponse 200**
```json
{ "message": "Mot de passe modifiÃ©." }
```

---

### `GET /auth/me`
Profil de l'utilisateur connectÃ©. **Auth requis.**

**RÃ©ponse 200**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "Aminata",
  "last_name": "Diallo",
  "phone": "+221771234567",
  "role": "VENDOR",
  "is_verified": true,
  "avatar": "https://storage.supabase.co/..."
}
```

---

### `PATCH /auth/me`
Mettre Ã  jour le profil. **Auth requis.**

**Body** (tous les champs optionnels)
```json
{ "first_name": "Aminata", "phone": "+221779999999" }
```

---

## 2. Vendeurs â€” `/vendors`

### `POST /vendors`
CrÃ©er sa boutique. **Auth requis (CUSTOMER ou VENDOR).**

**Body**
```json
{
  "name": "Boutique Aminata",
  "description": "VÃªtements wax et tissus traditionnels.",
  "phone": "+221771234567",
  "address": "123 Rue de Dakar",
  "city": "Dakar"
}
```
**RÃ©ponse 201** â†’ Objet Vendor avec `status: "PENDING"`

---

### `GET /vendors/me`
Ma boutique. **Auth requis (VENDOR).**

---

### `PATCH /vendors/me`
Modifier ma boutique. **Auth requis (VENDOR).**

---

### `POST /vendors/me/logo`
Uploader le logo. **Auth requis (VENDOR).** `Content-Type: multipart/form-data`

**Body** : `logo` (fichier image, max 5 Mo)

---

### `GET /admin/vendors`
Liste tous les vendeurs. **Admin.**
Query params : `?status=PENDING&page=1`

---

### `PATCH /admin/vendors/:id/approve`
Approuver un vendeur. **Admin.**

---

### `PATCH /admin/vendors/:id/suspend`
Suspendre un vendeur. **Admin.**

**Body**
```json
{ "reason": "Violation des CGV." }
```

---

## 3. CatÃ©gories â€” `/categories`

### `GET /categories`
Arbre complet des catÃ©gories. **Public.**

**RÃ©ponse 200**
```json
[
  {
    "id": 1, "name": "Mode", "slug": "mode",
    "children": [
      { "id": 2, "name": "Femme", "slug": "femme-mode", "children": [] }
    ]
  }
]
```

---

### `POST /admin/categories` Â· `PATCH /admin/categories/:id` Â· `DELETE /admin/categories/:id`
CRUD catÃ©gories. **Admin.**

---

## 4. Produits â€” `/products`

### `GET /marketplace/products`
Catalogue public paginÃ©. **Public.**
Query params : `?category=mode&vendor=boutique-slug&min_price=1000&max_price=50000&sort=price_asc&page_size=20&cursor=<next_cursor>`

**RÃ©ponse 200**
```json
{
  "count": 42,
  "page_size": 20,
  "next_cursor": "eyJjcmVhdGVkX2F0IjoiLi4uIiwiaWQiOiIxMjMifQ==",
  "has_next": true,
  "results": [ ... ]
}
```

---

### `GET /marketplace/products/:slug`
Fiche produit publique. **Public.**

**RÃ©ponse 200**
```json
{
  "id": "uuid", "name": "Boubou wax", "slug": "boubou-wax",
  "base_price": 25000,
  "vendor": { "id": "uuid", "name": "Boutique Aminata", "trust_score": 4.7 },
  "category": { "id": 2, "name": "Femme" },
  "images": [{ "url": "...", "is_cover": true }],
  "variants": [{ "id": "uuid", "name": "Taille M", "stock": 5, "price_delta": 0 }],
  "average_rating": 4.5,
  "total_reviews": 12
}
```

---

### `POST /vendors/me/products`
CrÃ©er un produit. **Vendor.**

**Body**
```json
{
  "name": "Boubou wax",
  "category_id": 2,
  "description": "Boubou en tissu wax authentique.",
  "base_price": 25000
}
```

---

### `PATCH /vendors/me/products/:id`
Modifier un produit. **Vendor.**

---

### `DELETE /vendors/me/products/:id`
Supprimer un produit. **Vendor.**

---

### `POST /vendors/me/products/:id/images`
Uploader une image. **Vendor.** `Content-Type: multipart/form-data`

---

### `DELETE /vendors/me/products/:id/images/:imageId`
Supprimer une image. **Vendor.**

---

## 5. Recherche â€” `/marketplace/search`

### `GET /marketplace/search`
Recherche full-text PostgreSQL. **Public.**
Query params : `?q=boubou+wax&page_size=20&cursor=<next_cursor>`

**RÃ©ponse 200**
```json
{
  "count": 42,
  "page_size": 20,
  "next_cursor": "eyJ0cnVzdF9zY29yZSI6IjAuMCIsImNyZWF0ZWRfYXQiOiIuLi4iLCJpZCI6IjEyMyJ9",
  "has_next": true,
  "results": [ ... ]
}
```

---

## 6. Espace client â€” `/account`

### `GET /account/orders`
Mes commandes. **Auth requis.**

### `GET /account/orders/:id`
DÃ©tail d'une commande. **Auth requis.**

### `GET /account/addresses` Â· `POST /account/addresses` Â· `PATCH /account/addresses/:id` Â· `DELETE /account/addresses/:id`
Gestion des adresses. **Auth requis.**

### `GET /account/favorites` Â· `POST /account/favorites/:productId` Â· `DELETE /account/favorites/:productId`
Favoris. **Auth requis.**

### `GET /account/profile` Â· `PATCH /account/profile`
Profil client. **Auth requis.**

### `POST /account/profile/avatar`
Uploader l'avatar. **Auth requis.** `Content-Type: multipart/form-data`

**Body** : `avatar` (fichier image JPG, PNG ou WebP, max 5 Mo)

---

## 7. Panier â€” `/cart`

### `POST /orders/validate`
Valider le stock avant paiement. **Public.**

**Body**
```json
{
  "items": [
    { "product_id": "uuid", "variant_id": "uuid", "quantity": 2 }
  ]
}
```
**RÃ©ponse 200** â†’ OK ou liste des articles en rupture

---

## 8. Commandes â€” `/orders`

### `POST /orders`
CrÃ©er une commande. **Auth requis.**

**Body**
```json
{
  "items": [
    { "product_id": "uuid", "variant_id": "uuid", "quantity": 2 }
  ],
  "delivery_address": "Aminata Diallo, +221771234567, 123 Rue de Dakar, Dakar",
  "notes": "Appeler avant livraison"
}
```
**RÃ©ponse 201** â†’ Objet Order avec `vendor_orders` inclus

Effets secondaires :
- dÃ©crÃ©mente le stock des variantes commandÃ©es
- envoie `send_order_confirmation_email` au client
- envoie `send_vendor_new_order_email` Ã  chaque vendeur concernÃ©

---

### `GET /orders/me`
Mes commandes. **Auth requis.**

---

### `GET /orders/me/:id`
DÃ©tail commande. **Auth requis (client propriÃ©taire).**

---

### `GET /vendors/me/orders`
Commandes reÃ§ues. **Vendor.**
Query params : `?status=PENDING&page=1`

---

### `PATCH /vendors/me/orders/:id/status`
Mettre Ã  jour le statut. **Vendor.**

**Body**
```json
{ "status": "SHIPPED", "tracking_number": "SN123456789" }
```

---

## 9. Paiements â€” `/payments`

### `POST /payments/initiate`
Initier un paiement PayTech. **Auth requis.**

**Body**
```json
{ "order_id": 123, "provider": "PAYTECH" }
```
**RÃ©ponse 200**
```json
{
  "id": 1,
  "order_id": 123,
  "provider": "PAYTECH",
  "amount": "25000.00",
  "currency": "XOF",
  "status": "PENDING",
  "reference": "NF-123-ABCDEF123456",
  "provider_reference": "paytech-token",
  "payment_url": "https://paytech.sn/payment/..."
}
```

---

### `POST /payments/webhook`
Webhook PayTech (appel depuis les serveurs PayTech). **SÃ©curisÃ© par signature HMAC.**

Header recommandÃ© si `PAYTECH_WEBHOOK_SECRET` est configurÃ© :
`X-PayTech-Signature: <hmac_sha256_raw_body>`

Effets si le webhook confirme le paiement :
- `Payment.status = PAID`
- `Order.status = PAID`
- email `send_payment_confirmation_email`

---

### `GET /payments/:reference`
Statut d'un paiement. **Auth requis.**

### `GET /payments/admin/`
Historique des paiements. **Admin.**

Filtres optionnels : `status`, `provider`.

---

## 10. Wallet â€” `/wallet`

### `GET /wallet/`
Solde vendeur connecte. **Vendor.**

**RÃ©ponse 200**
```json
{
  "pending_balance": "45000.00",
  "available_balance": "120000.00",
  "frozen_balance": "0.00",
  "plan_name": "FREE",
  "commission_rate": "8.00"
}
```

---

### `GET /wallet/transactions/`
Transactions du wallet vendeur connecte. **Vendor.**

### `GET /wallet/payouts/`
Demandes de retrait du vendeur connecte. **Vendor.**

### `POST /wallet/payouts/`
Demande de retrait. **Vendor.**

**Body**
```json
{
  "amount": "50000.00",
  "bank_name": "Wave",
  "account_number": "+221771234567",
  "account_name": "Aminata Diallo"
}
```

---

### `GET /wallet/admin/`
Vue globale des wallets. **Admin.**

### `GET /wallet/admin/payouts/`
Liste des retraits. **Admin.**

### `PATCH /wallet/admin/payouts/:id/approve/`
Approuver un retrait. **Admin.**

### `PATCH /wallet/admin/payouts/:id/reject/`
Rejeter un retrait avec motif. **Admin.**

### `GET /wallet/admin/platform-account/`
Coordonnees de versement de la plateforme. **Admin.**

### `PATCH /wallet/admin/platform-account/`
Modifier les coordonnees de versement de la plateforme. **Admin.**

**Body mobile money**
```json
{
  "method": "MOBILE_MONEY",
  "account_name": "NaatalFi",
  "phone_number": "+221771234567"
}
```

**Body banque**
```json
{
  "method": "BANK",
  "account_name": "NaatalFi SARL",
  "bank_name": "Banque",
  "account_number": "SN123456789"
}
```

---

## 11. Livraison â€” `/shipping`

### `POST /shipping/estimate`
Calculer les frais. **Public.**

**Body**
```json
{
  "vendor_ids": [1, 2],
  "region": "Saint-Louis",
  "weight": "1.50"
}
```
**RÃ©ponse 200**
```json
{
  "1": { "price": "2500.00", "estimated_days": 2 },
  "2": { "price": "0.00", "estimated_days": null }
}
```

### `GET /shipping/zones/` · `POST /shipping/zones/` · `PATCH /shipping/zones/:id/`
Gestion zones et tarifs. **Vendor.**

---

## 12. Avis â€” `/reviews`

### `POST /reviews`
Soumettre un avis. **Auth requis (acheteur vÃ©rifiÃ©).**

**Body**
```json
{
  "vendor_order_id": 42,
  "product_id": 15,
  "rating": 5,
  "comment": "Produit conforme, livraison rapide !"
}
```

Conditions :
- la commande vendeur doit appartenir a l'utilisateur connecte ;
- la commande vendeur doit etre `DELIVERED` ;
- le produit doit faire partie de cette commande vendeur ;
- un seul avis par produit et par commande vendeur.

Effets secondaires :
- `Product.average_rating` et `Product.total_reviews` sont recalcules ;
- `Product.trust_score` est aligne sur la note moyenne ;
- `Vendor.trust_score` est recalcule depuis les avis verifies.

### `GET /marketplace/products/:slug/reviews`
Avis d'un produit. **Public.**

### `GET /marketplace/vendors/:slug/reviews`
Avis d'un vendeur. **Public.**

### `DELETE /admin/reviews/:id`
ModÃ©rer un avis. **Admin.**

### `GET /reviews/me`
Mes avis. **Auth requis.**

### `GET /reviews/admin/`
Liste des avis. **Admin.**

---

## 13. PublicitÃ©s â€” `/ads`

### `POST /vendors/me/ads`
CrÃ©er une campagne. **Vendor.**

**Body**
```json
{
  "product_id": 15,
  "budget": "10000.00",
  "cost_per_click": "50.00",
  "start_date": "2026-07-01",
  "end_date": "2026-07-31"
}
```

La creation debite immediatement `budget` du `Wallet.available_balance` du vendeur et cree une transaction `AD_SPEND`.

### `GET /vendors/me/ads` Â· `PATCH /vendors/me/ads/:id`
GÃ©rer mes campagnes. **Vendor.**

### `GET /admin/ads`
Vue globale. **Admin.**

### `GET /ads/sponsored`
Produits sponsorises actifs. **Public.**

### `POST /ads/:id/click`
Tracker un clic publicitaire. **Public.**

---

## 14. Litiges â€” `/disputes`

### `POST /disputes`
Ouvrir un litige. **Auth requis (client).**

**Body**
```json
{
  "vendor_order_id": 42,
  "reason": "ITEM_NOT_RECEIVED",
  "description": "Ma commande n'est pas arrivÃ©e aprÃ¨s 10 jours."
}
```

Conditions :
- la sous-commande doit appartenir au client connecte ;
- le statut doit etre `SHIPPED` ou `DELIVERED` ;
- un seul litige ouvert par sous-commande.

Effets :
- cree un `Dispute` en statut `OPEN` ;
- gele jusqu'au montant de la sous-commande depuis `Wallet.available_balance` vers `Wallet.frozen_balance` ;
- cree une transaction wallet `FREEZE`.

### `GET /disputes/:id`
DÃ©tail litige. **Auth requis (participant ou admin).**

### `GET /disputes`
Mes litiges client. **Auth requis.**

### `GET /vendors/me/disputes`
Litiges de ma boutique. **Vendor.**

### `GET /disputes/admin`
Liste des litiges. **Admin.**

### `POST /admin/disputes/:id/resolve`
RÃ©soudre un litige. **Admin.**

**Body**
```json
{ "resolution": "REFUND", "note": "Article non livrÃ© confirmÃ©." }
```

`resolution=REFUND` consomme le solde gele et marque la sous-commande `REFUNDED`.
`resolution=NO_REFUND` libere le solde gele vers `available_balance` avec transaction `UNFREEZE`.

---

## 15. Notifications â€” `/notifications`

### `GET /notifications`
Mes notifications. **Auth requis.**
Query params : `?is_read=false` ou `?unread=true`.

**Reponse 200**
```json
[
  {
    "id": 1,
    "type": "ORDER",
    "title": "Nouvelle commande #42",
    "message": "2 article(s), total vendeur 25000.00 FCFA.",
    "link_url": "/dashboard/orders/42",
    "is_read": false,
    "created_at": "2026-06-11T16:00:00Z"
  }
]
```

### `PATCH /notifications/:id/read`
Marquer comme lue. **Auth requis.**

### `POST /notifications/read-all`
Tout marquer comme lu. **Auth requis.**

---

## 16. Analytics â€” `/analytics`

### `GET /analytics/admin/overview/`
KPIs globaux. **Admin.**
Query params : `?period=7d|30d|90d`

**RÃ©ponse 200**
```json
{
  "gmv": 4500000,
  "commissions": 337500,
  "orders_count": 312,
  "created_orders_count": 328,
  "average_basket": 14423,
  "conversion_rate": 0.9512,
  "dispute_rate": 0.032,
  "daily": [
    { "date": "2026-06-12", "revenue": "150000.00", "orders": 8 }
  ]
}
```

---

## 17. Plateforme â€” `/platform`

### `GET /platform/public/`
Informations publiques affichees dans le footer et image hero de l'accueil. **Public.**

**Reponse 200**
```json
{
  "contact_email": "contact@naatalfi.com",
  "phone_number": "+221771234567",
  "facebook_url": "https://facebook.com/naatalfi",
  "instagram_url": "https://instagram.com/naatalfi",
  "tiktok_url": "https://www.tiktok.com/@naatalfi",
  "linkedin_url": "https://linkedin.com/company/naatalfi",
  "hero_image_url": "https://cdn.example.com/hero.jpg"
}
```

### `GET /platform/admin/`
Lire les informations publiques. **Admin.**

### `PATCH /platform/admin/`
Modifier les informations publiques. **Admin.**

### `GET /analytics/admin/vendors/`
Top vendeurs. **Admin.**
Query params : `?period=7d|30d|90d`

**Reponse 200**
```json
[
  {
    "vendor_id": 12,
    "name": "Teranga Shop",
    "slug": "teranga-shop",
    "orders": 18,
    "revenue": "540000.00"
  }
]
```

### `GET /analytics/vendors/me/`
Mes statistiques. **Vendor.**
Query params : `?period=7d|30d|90d`

**Reponse 200**
```json
{
  "revenue": "110000.00",
  "orders_count": 12,
  "items_sold": 31,
  "average_basket": "9166.67",
  "dispute_rate": 0.0833,
  "daily": [
    { "date": "2026-06-12", "revenue": "25000.00", "orders": 2 }
  ],
  "top_products": [
    {
      "product_id": 4,
      "name": "Sac cuir",
      "slug": "sac-cuir",
      "quantity": 7,
      "revenue": "35000.00",
      "views": 0
    }
  ]
}
```

