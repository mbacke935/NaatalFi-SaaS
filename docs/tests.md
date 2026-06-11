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
| `products` | `apps/products/tests.py` | route admin produits, moderation statut |
| `payments` | `apps/payments/tests.py` | liste admin paiements, statut webhook |
| `notifications` | `apps/notifications/tests.py` | liste utilisateur, isolation, mark read, read-all |
| `reviews` | `apps/reviews/tests.py` | avis verifies, anti-doublon, recalcul notes, suppression admin |

Etat actuel : **18 tests OK**.

## Frontend

Il n'y a pas encore de suite Vitest/Playwright configuree.

Validation actuelle :

```powershell
cd C:\NaatalFi-SaaS\frontend
npm run build
```

Etat actuel : build OK, avec warning Vite de taille de bundle.

