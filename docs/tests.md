# Tests - NaatalFi

## Backend

Les tests backend utilisent Django `TestCase` / `APITestCase` avec un fichier de settings dedie :

```text
backend/config/test_settings.py
```

Ce fichier force :

- SQLite en memoire (pas de connexion Supabase necessaire) ;
- Celery en mode eager (taches executees directement) ;
- backend email local (`django.core.mail.backends.locmem`) ;
- hash de mot de passe rapide (`MD5PasswordHasher`).

### Lancer les tests

Depuis `C:\NaatalFi-SaaS\backend` :

```powershell
venv\Scripts\python manage.py test --settings=config.test_settings --verbosity 2
```

Resultat actuel : **61 tests OK**.

### Detail par module

| App | Fichier | Tests | Couverture |
| :--- | :--- | :---: | :--- |
| `wallet` | `apps/wallet/tests.py` | 16 | Voir detail ci-dessous |
| `orders` | `apps/orders/tests.py` | 6 | Validation stock, permissions, flux complet webhook→wallet |
| `shipping` | `apps/shipping/tests.py` | — | Estimation livraison par region et poids |
| `users` | `apps/users/tests.py` | — | Admin update role/actif, protection auto-desactivation |
| `vendors` | `apps/vendors/tests.py` | — | Creation boutique, unicite, plan FREE 8% illimite, approbation/suspension admin |
| `categories` | `apps/categories/tests.py` | — | Listing public actif, protection admin, creation, reorder |
| `products` | `apps/products/tests.py` | — | Route admin produits, moderation statut, produits illimites |
| `marketplace` | `apps/marketplace/tests.py` | — | Produits publies uniquement, recherche, detail vendeur approuve |
| `account` | `apps/account/tests.py` | — | Adresses par utilisateur, defaut unique, favoris idempotents |
| `payments` | `apps/payments/tests.py` | — | Liste admin paiements, statut webhook |
| `notifications` | `apps/notifications/tests.py` | — | Isolation utilisateur, mark read, read-all |
| `reviews` | `apps/reviews/tests.py` | — | Avis verifies (achat livre), anti-doublon, recalcul scores, suppression admin |
| `ads` | `apps/ads/tests.py` | — | Creation campagne, debit wallet, solde insuffisant, produits sponsorises |
| `disputes` | `apps/disputes/tests.py` | — | Ouverture litige, gel wallet, resolution refund/no-refund |
| `analytics` | `apps/analytics/tests.py` | — | Overview admin, top vendeurs, analytics vendeur |
| `platform` | `apps/platform/tests.py` | 2 | Lecture publique footer/hero/categories populaires, modification admin des infos plateforme |

---

### Tests wallet (16 tests) — Commission 8% flat

Le module wallet est le plus critique — il couvre toute la logique financiere.

**Constante de reference :**
```python
PLATFORM_COMMISSION_RATE = Decimal('8.00')  # apps/wallet/services.py
```

**Formule :**
```
commission = subtotal × 8%
net vendeur = subtotal - commission + shipping_cost
```

**Exemple de reference (utilise dans les tests) :**
```
subtotal   = 10 000 FCFA
shipping   =    500 FCFA
commission =    800 FCFA (8%)
net SALE   =  9 700 FCFA → pending_balance
```

**Liste des tests :**

| Test | Verification |
| :--- | :--- |
| `test_platform_commission_rate_is_8_percent` | `PLATFORM_COMMISSION_RATE == Decimal('8.00')` |
| `test_credit_wallet_creates_sale_and_commission_transactions` | Transaction SALE = 9 700, COMMISSION = 800 |
| `test_credit_wallet_is_idempotent` | Deux appels → une seule SALE, une seule COMMISSION |
| `test_commission_rate_ignored_from_vendor_plan` | Plan a 7% → calcul reste 8% |
| `test_net_amount_calculation` | net = subtotal - 8% + shipping |
| `test_commission_description_mentions_8_percent` | Description mentionne "8" |
| `test_vendor_without_plan_still_gets_8_percent_commission` | Vendeur sans plan → 8% quand meme |
| `test_credit_wallet_zero_shipping` | Shipping 0 → net = 10 000 - 800 = 9 200 |
| `test_credit_wallet_references_include_order_and_vendor_ids` | Reference contient order_id, vendor_id, "SALE" |
| `test_credit_wallet_multi_vendor` | 2 vendeurs → 2 wallets credites independamment |
| `test_release_pending_balances_moves_old_sales_to_available` | Apres 7 jours : pending → available |
| `test_release_pending_balances_is_idempotent` | Release ne libere pas deux fois la meme vente |
| `test_release_pending_balances_respects_delay` | Vente recente (< 7j) → pas liberee |
| `test_admin_commission_revenue_tracked_via_transactions` | Somme COMMISSION = 800 (revenue plateforme) |
| `test_admin_commission_revenue_multi_vendor` | Multi-vendeur : total commissions = 8% du GMV |
| `test_only_admin_can_update_platform_payout_account` | Coordonnees admin mobile money/banque modifiables par admin uniquement |

---

### Tests orders — flux complet webhook→wallet

Le test `test_checkout_payment_webhook_credits_vendor_wallet_once` simule le flux complet :

```
Creer commande (2 × 10 000 FCFA = 20 000 FCFA)
  ↓
Simuler webhook PayTech (verify_webhook_signature mocke)
  ↓
credit_vendor_wallets_task executee directement
  ↓
commission = 20 000 × 8% = 1 600 FCFA
net = 20 000 - 1 600 = 18 400 FCFA → pending_balance

Verification :
  wallet.pending_balance == 18 400 FCFA ✅
  Transaction SALE count == 1 ✅
  Transaction COMMISSION count == 1 ✅
  Idempotence : deuxieme webhook → wallet inchange ✅
```

---

## Frontend

Pas de suite Vitest/Playwright configuree pour le moment.

Validation actuelle par build Vite :

```powershell
cd C:\NaatalFi-SaaS\frontend
npm run build
```

Etat actuel : **build OK en ~490ms**, aucune erreur TypeScript ni import manquant.

Points valides par le build :
- Toutes les pages lazy-loadees compileent sans erreur.
- Composant `ComingSoon` importe correctement par les pages differees.
- Imports favoris comentes dans `ProductDetailPage` n'introduisent pas de references cassees.
- `AnalyticsPage` vendeur compile avec les cards simplifiees.
