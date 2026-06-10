# Schéma de Base de Données — NaatalFi Marketplace

Base de données : **PostgreSQL** hébergée sur **Supabase**
ORM : **Django ORM**
Convention : snake_case, clés primaires UUID sauf mention contraire.

---

## Schéma des relations (vue d'ensemble)

```
User ──────────────── Vendor (1-1)
                         │
                    VendorPlan (N-1)
                         │
              ┌──────────┤
              │          │
           Product     Wallet (1-1)
              │          │
     ┌────────┤       Transaction (1-N)
     │        │       PayoutRequest (1-N)
ProductImage  │
ProductVariant│
              │
           Category (arbre, self-FK)
              │
           OrderItem ──── Order ──── User (customer)
              │              │
           VendorOrder        └──── Payment
              │
           Vendor
              │
        ┌─────┤
        │     │
     Review  AdCampaign
        │
      Dispute
        │
   Notification ──── User
```

---

## Tables

### `users_customuser`

Étend `AbstractBaseUser` de Django.

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, default uuid4 | Identifiant unique |
| `email` | VARCHAR(254) | UNIQUE, NOT NULL | Email (login) |
| `first_name` | VARCHAR(150) | NOT NULL | Prénom |
| `last_name` | VARCHAR(150) | NOT NULL | Nom |
| `phone` | VARCHAR(20) | NULL | Téléphone |
| `role` | VARCHAR(10) | NOT NULL | `ADMIN` · `VENDOR` · `CUSTOMER` |
| `is_verified` | BOOLEAN | default False | Email vérifié |
| `avatar` | VARCHAR(500) | NULL | URL Supabase Storage |
| `is_active` | BOOLEAN | default True | Compte actif |
| `is_staff` | BOOLEAN | default False | Accès admin Django |
| `date_joined` | TIMESTAMPTZ | auto | Date d'inscription |
| `updated_at` | TIMESTAMPTZ | auto_now | Dernière mise à jour |

**Index :** `email`

---

### `vendors_vendorplan`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PK | |
| `name` | VARCHAR(20) | UNIQUE | `FREE` · `PRO` · `PREMIUM` |
| `commission_rate` | DECIMAL(4,2) | NOT NULL | Ex: 10.00 (%) |
| `monthly_price` | DECIMAL(12,0) | NOT NULL | En FCFA |
| `max_products` | INTEGER | NOT NULL | -1 = illimité |
| `features` | JSONB | NOT NULL | Liste des avantages |

---

### `vendors_vendor`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `user_id` | UUID | FK → User, UNIQUE | Propriétaire |
| `plan_id` | INTEGER | FK → VendorPlan | Plan actif |
| `name` | VARCHAR(100) | NOT NULL | Nom de la boutique |
| `slug` | VARCHAR(110) | UNIQUE | URL-friendly |
| `description` | TEXT | NULL | Présentation |
| `logo` | VARCHAR(500) | NULL | URL Supabase Storage |
| `phone` | VARCHAR(20) | NULL | |
| `address` | VARCHAR(255) | NULL | Adresse physique |
| `city` | VARCHAR(100) | NULL | |
| `status` | VARCHAR(15) | default PENDING | `PENDING` · `APPROVED` · `SUSPENDED` · `REJECTED` |
| `trust_score` | DECIMAL(3,2) | default 0.00 | Score 0.00 – 5.00 |
| `is_featured` | BOOLEAN | default False | Mis en avant par admin |
| `created_at` | TIMESTAMPTZ | auto | |
| `updated_at` | TIMESTAMPTZ | auto_now | |

**Index :** `slug`, `status`

---

### `categories_category`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PK | |
| `name` | VARCHAR(100) | NOT NULL | |
| `slug` | VARCHAR(110) | UNIQUE | |
| `parent_id` | INTEGER | FK → self, NULL | Catégorie parente |
| `image` | VARCHAR(500) | NULL | URL Supabase Storage |
| `order` | INTEGER | default 0 | Ordre d'affichage |
| `is_active` | BOOLEAN | default True | |
| `created_at` | TIMESTAMPTZ | auto | |

**Index :** `slug`, `parent_id`

---

### `products_product`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `vendor_id` | UUID | FK → Vendor | |
| `category_id` | INTEGER | FK → Category | |
| `name` | VARCHAR(255) | NOT NULL | |
| `slug` | VARCHAR(270) | UNIQUE | |
| `description` | TEXT | NULL | |
| `base_price` | DECIMAL(12,0) | NOT NULL | Prix en FCFA |
| `status` | VARCHAR(10) | default DRAFT | `DRAFT` · `ACTIVE` · `INACTIVE` · `REJECTED` |
| `is_featured` | BOOLEAN | default False | |
| `average_rating` | DECIMAL(3,2) | default 0.00 | |
| `total_reviews` | INTEGER | default 0 | |
| `total_sales` | INTEGER | default 0 | |
| `created_at` | TIMESTAMPTZ | auto | |
| `updated_at` | TIMESTAMPTZ | auto_now | |

**Index :** `slug`, `vendor_id`, `category_id`, `status`
**Full-text search :** `tsvector` sur `name` + `description`

---

### `products_productimage`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `product_id` | UUID | FK → Product | |
| `image_url` | VARCHAR(500) | NOT NULL | URL Supabase Storage |
| `order` | INTEGER | default 0 | Ordre d'affichage |
| `is_cover` | BOOLEAN | default False | Image principale |

**Contrainte :** 1 seul `is_cover = True` par produit (géré applicativement).

---

### `products_productvariant`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `product_id` | UUID | FK → Product | |
| `name` | VARCHAR(100) | NOT NULL | Ex: "Taille M - Rouge" |
| `sku` | VARCHAR(100) | UNIQUE | Code article |
| `stock` | INTEGER | default 0, ≥ 0 | |
| `price_delta` | DECIMAL(12,0) | default 0 | Supplément ou réduction vs base_price |
| `is_active` | BOOLEAN | default True | |

---

### `orders_order`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `customer_id` | UUID | FK → User | |
| `status` | VARCHAR(20) | default PENDING | Voir statuts §5 |
| `total_amount` | DECIMAL(12,0) | NOT NULL | Total TTC livraison incluse |
| `shipping_address` | JSONB | NOT NULL | `{name, phone, address, city}` |
| `notes` | TEXT | NULL | Instructions livraison |
| `created_at` | TIMESTAMPTZ | auto | |
| `updated_at` | TIMESTAMPTZ | auto_now | |

**Index :** `customer_id`, `status`, `created_at`

---

### `orders_orderitem`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `order_id` | UUID | FK → Order | |
| `vendor_order_id` | UUID | FK → VendorOrder | |
| `product_id` | UUID | FK → Product | |
| `variant_id` | UUID | FK → ProductVariant, NULL | |
| `vendor_id` | UUID | FK → Vendor | Dénormalisé pour performance |
| `quantity` | INTEGER | NOT NULL, ≥ 1 | |
| `unit_price` | DECIMAL(12,0) | NOT NULL | Prix au moment de l'achat |
| `subtotal` | DECIMAL(12,0) | NOT NULL | unit_price × quantity |

---

### `orders_vendororder`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `order_id` | UUID | FK → Order | Commande parente |
| `vendor_id` | UUID | FK → Vendor | |
| `status` | VARCHAR(15) | default PENDING | Voir statuts §5 |
| `subtotal` | DECIMAL(12,0) | NOT NULL | Articles seuls |
| `shipping_cost` | DECIMAL(12,0) | default 0 | |
| `commission_rate` | DECIMAL(4,2) | NOT NULL | Taux appliqué |
| `commission_amount` | DECIMAL(12,0) | NOT NULL | |
| `net_amount` | DECIMAL(12,0) | NOT NULL | Net vendeur |
| `tracking_number` | VARCHAR(100) | NULL | |
| `created_at` | TIMESTAMPTZ | auto | |
| `updated_at` | TIMESTAMPTZ | auto_now | |

**Index :** `order_id`, `vendor_id`, `status`

---

### `payments_payment`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `order_id` | UUID | FK → Order, UNIQUE | |
| `provider` | VARCHAR(15) | NOT NULL | `PAYTECH` · `WAVE` · `ORANGE_MONEY` |
| `amount` | DECIMAL(12,0) | NOT NULL | |
| `currency` | VARCHAR(3) | default XOF | |
| `status` | VARCHAR(10) | default PENDING | `PENDING` · `COMPLETED` · `FAILED` · `REFUNDED` |
| `reference` | VARCHAR(100) | UNIQUE, NULL | Référence PayTech |
| `payment_url` | VARCHAR(500) | NULL | URL redirect client |
| `webhook_payload` | JSONB | NULL | Données brutes PayTech |
| `created_at` | TIMESTAMPTZ | auto | |
| `updated_at` | TIMESTAMPTZ | auto_now | |

---

### `wallet_wallet`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `vendor_id` | UUID | FK → Vendor, UNIQUE | |
| `pending_balance` | DECIMAL(12,0) | default 0 | |
| `available_balance` | DECIMAL(12,0) | default 0 | |
| `frozen_balance` | DECIMAL(12,0) | default 0 | |
| `currency` | VARCHAR(3) | default XOF | |
| `updated_at` | TIMESTAMPTZ | auto_now | |

---

### `wallet_transaction`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `wallet_id` | UUID | FK → Wallet | |
| `type` | VARCHAR(15) | NOT NULL | `SALE` · `COMMISSION` · `PAYOUT` · `REFUND` · `FREEZE` · `UNFREEZE` · `ADJUSTMENT` |
| `amount` | DECIMAL(12,0) | NOT NULL | Positif = crédit, négatif = débit |
| `balance_type` | VARCHAR(10) | NOT NULL | `PENDING` · `AVAILABLE` · `FROZEN` |
| `balance_after` | DECIMAL(12,0) | NOT NULL | Solde après opération |
| `description` | VARCHAR(255) | NOT NULL | |
| `vendor_order_id` | UUID | FK → VendorOrder, NULL | |
| `payout_id` | UUID | FK → PayoutRequest, NULL | |
| `created_at` | TIMESTAMPTZ | auto | |

**Index :** `wallet_id`, `created_at`

---

### `wallet_payoutrequest`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `wallet_id` | UUID | FK → Wallet | |
| `amount` | DECIMAL(12,0) | NOT NULL | |
| `status` | VARCHAR(10) | default PENDING | `PENDING` · `APPROVED` · `REJECTED` · `PROCESSED` |
| `method` | VARCHAR(15) | NOT NULL | `BANK` · `WAVE` · `ORANGE_MONEY` |
| `account_details` | JSONB | NOT NULL | `{bank_name, account_number, account_name}` |
| `admin_note` | TEXT | NULL | |
| `processed_by_id` | UUID | FK → User, NULL | Admin |
| `requested_at` | TIMESTAMPTZ | auto | |
| `processed_at` | TIMESTAMPTZ | NULL | |

---

### `shipping_shippingzone`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `vendor_id` | UUID | FK → Vendor | |
| `name` | VARCHAR(100) | NOT NULL | Ex: "Grand Dakar" |
| `regions` | JSONB | NOT NULL | `["Dakar", "Pikine", "Guédiawaye"]` |
| `is_active` | BOOLEAN | default True | |

---

### `shipping_shippingrate`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `zone_id` | UUID | FK → ShippingZone | |
| `min_weight` | DECIMAL(6,3) | default 0 | En kg |
| `max_weight` | DECIMAL(6,3) | NOT NULL | En kg |
| `price` | DECIMAL(12,0) | NOT NULL | En FCFA |
| `estimated_days` | INTEGER | NOT NULL | Jours ouvrés |

---

### `reviews_review`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `author_id` | UUID | FK → User | |
| `product_id` | UUID | FK → Product, NULL | |
| `vendor_id` | UUID | FK → Vendor, NULL | |
| `vendor_order_id` | UUID | FK → VendorOrder, UNIQUE | Preuve d'achat |
| `rating` | SMALLINT | NOT NULL, 1–5 | |
| `comment` | TEXT | NULL | |
| `is_verified_purchase` | BOOLEAN | default True | |
| `is_approved` | BOOLEAN | default True | |
| `created_at` | TIMESTAMPTZ | auto | |

**Contrainte :** `product_id` OR `vendor_id` obligatoire (pas les deux).

---

### `ads_adcampaign`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `vendor_id` | UUID | FK → Vendor | |
| `product_id` | UUID | FK → Product | |
| `budget` | DECIMAL(12,0) | NOT NULL | Budget total FCFA |
| `spent` | DECIMAL(12,0) | default 0 | Montant dépensé |
| `cost_per_click` | DECIMAL(8,0) | NOT NULL | CPC en FCFA |
| `start_date` | DATE | NOT NULL | |
| `end_date` | DATE | NOT NULL | |
| `status` | VARCHAR(10) | default DRAFT | `DRAFT` · `ACTIVE` · `PAUSED` · `COMPLETED` · `CANCELLED` |
| `impressions` | INTEGER | default 0 | |
| `clicks` | INTEGER | default 0 | |
| `created_at` | TIMESTAMPTZ | auto | |

---

### `disputes_dispute`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `order_id` | UUID | FK → Order | |
| `vendor_order_id` | UUID | FK → VendorOrder | |
| `initiator_id` | UUID | FK → User | Client |
| `reason` | VARCHAR(30) | NOT NULL | `ITEM_NOT_RECEIVED` · `ITEM_NOT_AS_DESCRIBED` · `PAYMENT_ISSUE` · `OTHER` |
| `description` | TEXT | NOT NULL | |
| `status` | VARCHAR(20) | default OPEN | `OPEN` · `UNDER_REVIEW` · `RESOLVED_REFUND` · `RESOLVED_NO_REFUND` · `CLOSED` |
| `resolution_note` | TEXT | NULL | |
| `admin_id` | UUID | FK → User, NULL | |
| `created_at` | TIMESTAMPTZ | auto | |
| `resolved_at` | TIMESTAMPTZ | NULL | |

---

### `notifications_notification`

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `user_id` | UUID | FK → User | |
| `type` | VARCHAR(40) | NOT NULL | Ex: `ORDER_CONFIRMED`, `VENDOR_APPROVED`, `PAYOUT_PROCESSED` |
| `title` | VARCHAR(150) | NOT NULL | |
| `message` | TEXT | NOT NULL | |
| `is_read` | BOOLEAN | default False | |
| `link` | VARCHAR(500) | NULL | URL interne |
| `created_at` | TIMESTAMPTZ | auto | |

**Index :** `user_id`, `is_read`, `created_at`

---

## Résumé des relations

| Table A | Relation | Table B |
| :--- | :--- | :--- |
| User | 1–1 | Vendor |
| Vendor | N–1 | VendorPlan |
| Vendor | 1–1 | Wallet |
| Category | 0–1 (self) | Category |
| Product | N–1 | Vendor |
| Product | N–1 | Category |
| ProductImage | N–1 | Product |
| ProductVariant | N–1 | Product |
| Order | N–1 | User |
| Order | 1–1 | Payment |
| OrderItem | N–1 | Order |
| OrderItem | N–1 | VendorOrder |
| VendorOrder | N–1 | Order |
| VendorOrder | N–1 | Vendor |
| Wallet | 1–N | Transaction |
| Wallet | 1–N | PayoutRequest |
| ShippingZone | N–1 | Vendor |
| ShippingRate | N–1 | ShippingZone |
| Review | N–1 | User |
| Review | N–1 (opt) | Product |
| Review | N–1 (opt) | Vendor |
| AdCampaign | N–1 | Vendor |
| AdCampaign | N–1 | Product |
| Dispute | N–1 | Order |
| Dispute | N–1 | VendorOrder |
| Notification | N–1 | User |
