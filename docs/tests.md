# Tests - NaatalFi

## Backend

Les tests backend utilisent Django `TestCase` / `APITestCase` et un fichier de settings dedie :

```text
backend/config/test_settings.py
```

Ce fichier force :

- SQLite en memoire ;
- Celery en mode eager ;
- backend email local ;
- hash de mot de passe rapide.

### Lancer les tests

Depuis `C:\NaatalFi-SaaS\backend` :

```powershell
venv\Scripts\python manage.py test --settings=config.test_settings --verbosity 2
```

### Tests actuels

| App | Fichier | Couverture |
| :--- | :--- | :--- |
| `wallet` | `apps/wallet/tests.py` | commission, credit idempotent, release pending -> available |
| `shipping` | `apps/shipping/tests.py` | estimation par region et poids |
| `users` | `apps/users/tests.py` | role admin, actif/inactif, protection auto-desactivation |
| `vendors` | `apps/vendors/tests.py` | creation boutique, unicite boutique, approbation/suspension admin |
| `categories` | `apps/categories/tests.py` | listing public actif, protection admin, creation et reorder |
| `products` | `apps/products/tests.py` | route admin produits, moderation statut |
| `marketplace` | `apps/marketplace/tests.py` | produits publies uniquement, recherche, detail vendeur approuve |
| `account` | `apps/account/tests.py` | adresses par utilisateur, adresse par defaut unique, favoris idempotents |
| `orders` | `apps/orders/tests.py` | validation stock, permissions commandes, flux checkout -> webhook -> wallet |
| `payments` | `apps/payments/tests.py` | liste admin paiements, statut webhook |
| `notifications` | `apps/notifications/tests.py` | liste utilisateur, isolation, mark read, read-all |
| `reviews` | `apps/reviews/tests.py` | avis verifies, anti-doublon, recalcul notes, suppression admin |
| `ads` | `apps/ads/tests.py` | creation campagne, debit wallet, solde insuffisant, produits sponsorises |
| `disputes` | `apps/disputes/tests.py` | ouverture litige, gel wallet, resolution refund/no-refund |
| `analytics` | `apps/analytics/tests.py` | overview admin, top vendeurs, analytics vendeur |

Etat actuel : **44 tests OK**.

## Frontend

Il n'y a pas encore de suite Vitest/Playwright configuree.

Validation actuelle :

```powershell
cd C:\NaatalFi-SaaS\frontend
npm run build
```

Etat actuel : build OK, avec warning Vite de taille de bundle.

