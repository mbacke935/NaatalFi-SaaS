# Contrat API — NaatalFi Marketplace

Base URL : `https://api.naatalfi.com/api/v1`
Format : JSON
Authentification : Bearer Token (JWT)
Pagination publique : `?page_size=20&cursor=<next_cursor>`

---

## Conventions

### Authentification

| Accès | Header requis |
| :--- | :--- |
| Public | Aucun |
| Utilisateur connecté | `Authorization: Bearer <access_token>` |
| Vendeur approuvé | Bearer + rôle `VENDOR` + statut `APPROVED` |
| Admin | Bearer + rôle `ADMIN` |

### Codes de réponse

| Code | Signification |
| :--- | :--- |
| 200 | Succès |
| 201 | Ressource créée |
| 204 | Succès sans contenu |
| 400 | Données invalides |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource introuvable |
| 409 | Conflit (ex: email déjà utilisé) |
| 422 | Erreur de validation métier |
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

## 1. Authentification — `/auth`

### `POST /auth/register`
Créer un compte. Envoie un email de vérification.

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
**Réponse 201**
```json
{ "message": "Compte créé. Vérifiez votre email." }
```

---

### `POST /auth/verify-email`
Vérifier l'email via le lien reçu.

**Body**
```json
{ "uid": "<uid>", "token": "<token>" }
```

**Réponse 200**
```json
{ "message": "Email vérifié avec succès." }
```

---

### `POST /auth/login`
Connexion. Retourne les tokens JWT.

**Body**
```json
{ "email": "user@example.com", "password": "motdepasse123" }
```
**Réponse 200**
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
**Réponse 200**
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
**Réponse 204**

---

### `POST /auth/forgot-password`
Envoyer un email de réinitialisation.

**Body**
```json
{ "email": "user@example.com" }
```
**Réponse 200**
```json
{ "message": "Email de réinitialisation envoyé." }
```

---

### `POST /auth/reset-password`
Changer le mot de passe via le lien reçu.

**Body**
```json
{ "uid": "<uid>", "token": "<token>", "password": "nouveaumotdepasse123" }
```
**Réponse 200**
```json
{ "message": "Mot de passe modifié." }
```

---

### `GET /auth/me`
Profil de l'utilisateur connecté. **Auth requis.**

**Réponse 200**
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
Mettre à jour le profil. **Auth requis.**

**Body** (tous les champs optionnels)
```json
{ "first_name": "Aminata", "phone": "+221779999999" }
```

---

## 2. Vendeurs — `/vendors`

### `POST /vendors`
Créer sa boutique. **Auth requis (CUSTOMER ou VENDOR).**

**Body**
```json
{
  "name": "Boutique Aminata",
  "description": "Vêtements wax et tissus traditionnels.",
  "phone": "+221771234567",
  "address": "123 Rue de Dakar",
  "city": "Dakar"
}
```
**Réponse 201** → Objet Vendor avec `status: "PENDING"`

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

## 3. Catégories — `/categories`

### `GET /categories`
Arbre complet des catégories. **Public.**

**Réponse 200**
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

### `POST /admin/categories` · `PATCH /admin/categories/:id` · `DELETE /admin/categories/:id`
CRUD catégories. **Admin.**

---

## 4. Produits — `/products`

### `GET /marketplace/products`
Catalogue public paginé. **Public.**
Query params : `?category=mode&vendor=boutique-slug&min_price=1000&max_price=50000&sort=price_asc&page_size=20&cursor=<next_cursor>`

**Réponse 200**
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

**Réponse 200**
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
Créer un produit. **Vendor.**

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

## 5. Recherche — `/marketplace/search`

### `GET /marketplace/search`
Recherche full-text PostgreSQL. **Public.**
Query params : `?q=boubou+wax&page_size=20&cursor=<next_cursor>`

**Réponse 200**
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

## 6. Espace client — `/account`

### `GET /account/orders`
Mes commandes. **Auth requis.**

### `GET /account/orders/:id`
Détail d'une commande. **Auth requis.**

### `GET /account/addresses` · `POST /account/addresses` · `PATCH /account/addresses/:id` · `DELETE /account/addresses/:id`
Gestion des adresses. **Auth requis.**

### `GET /account/favorites` · `POST /account/favorites/:productId` · `DELETE /account/favorites/:productId`
Favoris. **Auth requis.**

### `GET /account/profile` · `PATCH /account/profile`
Profil client. **Auth requis.**

### `POST /account/profile/avatar`
Uploader l'avatar. **Auth requis.** `Content-Type: multipart/form-data`

**Body** : `avatar` (fichier image JPG, PNG ou WebP, max 5 Mo)

---

## 7. Panier — `/cart`

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
**Réponse 200** → OK ou liste des articles en rupture

---

## 8. Commandes — `/orders`

### `POST /orders`
Créer une commande. **Auth requis.**

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
**Réponse 201** → Objet Order avec `vendor_orders` inclus

Effets secondaires :
- décrémente le stock des variantes commandées
- envoie `send_order_confirmation_email` au client
- envoie `send_vendor_new_order_email` à chaque vendeur concerné

---

### `GET /orders/me`
Mes commandes. **Auth requis.**

---

### `GET /orders/me/:id`
Détail commande. **Auth requis (client propriétaire).**

---

### `GET /vendors/me/orders`
Commandes reçues. **Vendor.**
Query params : `?status=PENDING&page=1`

---

### `PATCH /vendors/me/orders/:id/status`
Mettre à jour le statut. **Vendor.**

**Body**
```json
{ "status": "SHIPPED", "tracking_number": "SN123456789" }
```

---

## 9. Paiements — `/payments`

### `POST /payments/initiate`
Initier un paiement PayTech. **Auth requis.**

**Body**
```json
{ "order_id": "uuid", "provider": "PAYTECH" }
```
**Réponse 200**
```json
{ "payment_url": "https://paytech.sn/payment/...", "reference": "PAY_xxxx" }
```

---

### `POST /payments/webhook`
Webhook PayTech (appel depuis les serveurs PayTech). **Sécurisé par signature HMAC.**

---

### `GET /payments/:reference`
Statut d'un paiement. **Auth requis.**

---

## 10. Wallet — `/wallet`

### `GET /vendors/me/wallet`
Solde et transactions. **Vendor.**

**Réponse 200**
```json
{
  "pending_balance": 45000,
  "available_balance": 120000,
  "frozen_balance": 0,
  "currency": "XOF",
  "recent_transactions": [ ... ]
}
```

---

### `POST /vendors/me/wallet/payout`
Demande de retrait. **Vendor.**

**Body**
```json
{
  "amount": 50000,
  "method": "WAVE",
  "account_details": { "phone": "+221771234567", "account_name": "Aminata Diallo" }
}
```

---

### `GET /admin/wallets`
Vue globale des wallets. **Admin.**

### `PATCH /admin/payouts/:id/approve`
Approuver un retrait. **Admin.**

### `PATCH /admin/payouts/:id/reject`
Rejeter un retrait avec motif. **Admin.**

---

## 11. Livraison — `/shipping`

### `POST /shipping/estimate`
Calculer les frais. **Public.**

**Body**
```json
{
  "vendor_id": "uuid",
  "destination_city": "Saint-Louis",
  "weight_kg": 1.5
}
```
**Réponse 200**
```json
{ "price": 2500, "estimated_days": 2 }
```

### `GET /vendors/me/shipping` · `POST /vendors/me/shipping/zones` · `PATCH /vendors/me/shipping/zones/:id`
Gestion zones et tarifs. **Vendor.**

---

## 12. Avis — `/reviews`

### `POST /reviews`
Soumettre un avis. **Auth requis (acheteur vérifié).**

**Body**
```json
{
  "vendor_order_id": "uuid",
  "product_id": "uuid",
  "rating": 5,
  "comment": "Produit conforme, livraison rapide !"
}
```

### `GET /marketplace/products/:slug/reviews`
Avis d'un produit. **Public.**

### `GET /marketplace/vendors/:slug/reviews`
Avis d'un vendeur. **Public.**

### `DELETE /admin/reviews/:id`
Modérer un avis. **Admin.**

---

## 13. Publicités — `/ads`

### `POST /vendors/me/ads`
Créer une campagne. **Vendor.**

**Body**
```json
{
  "product_id": "uuid",
  "budget": 10000,
  "cost_per_click": 50,
  "start_date": "2026-07-01",
  "end_date": "2026-07-31"
}
```

### `GET /vendors/me/ads` · `PATCH /vendors/me/ads/:id`
Gérer mes campagnes. **Vendor.**

### `GET /admin/ads`
Vue globale. **Admin.**

---

## 14. Litiges — `/disputes`

### `POST /disputes`
Ouvrir un litige. **Auth requis (client).**

**Body**
```json
{
  "vendor_order_id": "uuid",
  "reason": "ITEM_NOT_RECEIVED",
  "description": "Ma commande n'est pas arrivée après 10 jours."
}
```

### `GET /disputes/:id`
Détail litige. **Auth requis (participant ou admin).**

### `POST /admin/disputes/:id/resolve`
Résoudre un litige. **Admin.**

**Body**
```json
{ "resolution": "RESOLVED_REFUND", "note": "Article non livré confirmé." }
```

---

## 15. Notifications — `/notifications`

### `GET /notifications`
Mes notifications. **Auth requis.**
Query params : `?is_read=false&page=1`

### `PATCH /notifications/:id/read`
Marquer comme lue. **Auth requis.**

### `POST /notifications/read-all`
Tout marquer comme lu. **Auth requis.**

---

## 16. Analytics — `/analytics`

### `GET /admin/analytics/overview`
KPIs globaux. **Admin.**
Query params : `?period=30d`

**Réponse 200**
```json
{
  "gmv": 4500000,
  "commissions": 337500,
  "orders_count": 312,
  "average_basket": 14423,
  "active_vendors": 47,
  "dispute_rate": 0.032
}
```

### `GET /admin/analytics/vendors`
Top vendeurs. **Admin.**

### `GET /vendors/me/analytics`
Mes statistiques. **Vendor.**
Query params : `?period=7d|30d|90d`
