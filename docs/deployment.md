# Guide de DÃ©ploiement â€” NaatalFi Marketplace

---

## Infrastructure cible

| Composant | Plateforme | Plan |
| :--- | :--- | :--- |
| Frontend React | Vercel | Hobby (gratuit) â†’ Pro si trafic |
| Backend Django | Render | Starter (7$/mois) |
| Base de donnÃ©es | Supabase | Free â†’ Pro si besoin |
| Stockage fichiers | Supabase Storage | Inclus dans Supabase |
| Cache + Celery | Upstash Redis | Pay-as-you-go |
| Emails | Resend ou SendGrid | Free tier suffisant au dÃ©part |

---

## DÃ©ploiement actuel

| Ã‰lÃ©ment | Valeur |
| :--- | :--- |
| Backend Render | `https://naatalfi-backend.onrender.com` |
| Frontend Vercel | `https://naatalfi.vercel.app` |
| API de test | `https://naatalfi-backend.onrender.com/api/v1/marketplace/categories/` |
| Webhook PayTech | `https://naatalfi-backend.onrender.com/api/v1/payments/webhook/` |
| Worker Celery | ReportÃ© |
| Mode tÃ¢ches async | `CELERY_TASK_ALWAYS_EAGER=True` |

Tant que le worker Celery n'est pas dÃ©ployÃ©, les emails et tÃ¢ches Celery s'exÃ©cutent directement dans le process web.

---

## Variables d'environnement

### Backend (Render)

| Variable | Description | Exemple |
| :--- | :--- | :--- |
| `DEBUG` | Mode debug | `False` |
| `SECRET_KEY` | ClÃ© Django secrÃ¨te | `django-insecure-xxxxx` |
| `ALLOWED_HOSTS` | Domaines autorisÃ©s | `api.naatalfi.com,naatalfi.onrender.com` |
| `DB_HOST` | Host Supabase (pooler) | `aws-0-eu-west-1.pooler.supabase.com` |
| `DB_NAME` | Nom de la base | `postgres` |
| `DB_USER` | User Supabase | `postgres.uwlczpjq...` |
| `DB_PASSWORD` | Mot de passe Supabase | `xxxxxxxx` |
| `DB_PORT` | Port | `5432` |
| `CELERY_BROKER_URL` | URL Redis Upstash | `rediss://default:xxx@xxx.upstash.io:6380` |
| `CELERY_RESULT_BACKEND` | MÃªme URL Redis | idem |
| `CELERY_TASK_ALWAYS_EAGER` | ExÃ©cute les tÃ¢ches Celery dans le web process si aucun worker n'est dÃ©ployÃ© | `True` temporairement, `False` avec worker |
| `SUPABASE_URL` | URL projet Supabase | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | ClÃ© service Supabase | `eyJxxxxx` |
| `PAYTECH_API_KEY` | ClÃ© API PayTech | `xxxxxxxx` |
| `PAYTECH_API_SECRET` | Secret PayTech | `xxxxxxxx` |
| `PAYTECH_BASE_URL` | Endpoint PayTech request-payment | `https://paytech.sn/api/payment/request-payment` |
| `PAYTECH_ENV` | Environnement PayTech | `prod` |
| `PAYTECH_WEBHOOK_SECRET` | Secret HMAC webhook | `xxxxxxxx` |
| `BACKEND_URL` | URL publique du backend pour webhook | `https://api.naatalfi.com` |
| `EMAIL_HOST` | Serveur SMTP | `smtp.resend.com` |
| `EMAIL_HOST_USER` | Login SMTP | `resend` |
| `EMAIL_HOST_PASSWORD` | Mot de passe SMTP | `re_xxxxxxxx` |
| `FRONTEND_URL` | URL du frontend | `https://naatalfi.vercel.app` |
| `CORS_ALLOWED_ORIGINS` | Origines CORS autorisÃ©es | `https://naatalfi.vercel.app` |

### Frontend (Vercel)

| Variable | Description | Exemple |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL de l'API backend | `https://api.naatalfi.com/api/v1` |
| `VITE_SUPABASE_URL` | URL Supabase | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ClÃ© publique Supabase | `eyJxxxxx` |

---

### Valeurs actuelles Render/Vercel

Backend Render :

```env
ALLOWED_HOSTS=naatalfi-backend.onrender.com
BACKEND_URL=https://naatalfi-backend.onrender.com
FRONTEND_URL=https://naatalfi.vercel.app
CORS_ALLOWED_ORIGINS=https://naatalfi.vercel.app
CELERY_TASK_ALWAYS_EAGER=True
```

Frontend Vercel :

```env
VITE_API_URL=https://naatalfi-backend.onrender.com/api/v1
```

---

## DÃ©ploiement Backend (Render)

### 1. PrÃ©parer le projet

S'assurer que ces fichiers existent Ã  la racine de `backend/` :

**`requirements.txt`** â€” gÃ©nÃ©rÃ© par `pip freeze`

**`Procfile`** (Ã  crÃ©er)
```
web: gunicorn config.wsgi:application --workers 2 --bind 0.0.0.0:$PORT
worker: celery -A config.celery worker --loglevel=info
```

**`runtime.txt`** (Ã  crÃ©er)
```
python-3.12.0
```

### 2. Installer gunicorn

```bash
pip install gunicorn
pip freeze > requirements.txt
```

### 3. Configurer sur Render

1. Nouveau **Web Service** â†’ connecter le repo GitHub
2. **Root Directory** : `backend`
3. **Build Command** :
   ```bash
   pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
   ```
4. **Start Command** :
   ```bash
   gunicorn config.wsgi:application --workers 2 --bind 0.0.0.0:$PORT
   ```
5. Ajouter toutes les variables d'environnement (tableau ci-dessus)

### 4. Celery Worker sur Render

Optionnel au dÃ©but. Si `CELERY_TASK_ALWAYS_EAGER=True`, ce service peut Ãªtre reportÃ©.

Quand le worker devient nÃ©cessaire, crÃ©er un second service **Background Worker** :
- **Root Directory** : `backend`
- **Start Command** : `celery -A config worker --loglevel=info`
- MÃªmes variables d'environnement

Puis passer sur le Web Service et le worker :

```env
CELERY_TASK_ALWAYS_EAGER=False
```

---

## DÃ©ploiement Frontend (Vercel)

### 1. Configurer `vite.config.js`

S'assurer que la base URL utilise la variable d'env :
```js
// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL
```

### 2. DÃ©ployer sur Vercel

```bash
npm install -g vercel
vercel --prod
```

Ou via l'interface Vercel :
1. **Import Git Repository** â†’ sÃ©lectionner le repo
2. **Root Directory** : `frontend`
3. **Framework** : Vite (dÃ©tectÃ© automatiquement)
4. **Build Command** : `npm run build`
5. **Output Directory** : `dist`
6. Ajouter les variables d'environnement

### 3. RedÃ©ploiement Vercel

AprÃ¨s modification d'une variable `VITE_*`, redeployer le frontend :

1. Aller dans **Deployments**
2. Ouvrir le menu du dernier dÃ©ploiement
3. Cliquer **Redeploy**

---

## DÃ©ploiement Base de donnÃ©es (Supabase)

Supabase est dÃ©jÃ  configurÃ© depuis le dÃ©veloppement local.

### Checklist production

- [ ] `python manage.py migrate` lancÃ© avec les credentials Supabase de prod
- [ ] `python manage.py createsuperuser` exÃ©cutÃ© en prod
- [ ] Buckets Supabase Storage crÃ©Ã©s : `avatars`, `vendor-logos`, `product-images`
- [ ] Politiques RLS (Row Level Security) configurÃ©es sur les buckets
- [ ] AccÃ¨s public en lecture activÃ© sur `product-images` et `vendor-logos`

---

## Checklist prÃ©-dÃ©ploiement

### SÃ©curitÃ©

- [ ] `DEBUG=False` en production
- [ ] `SECRET_KEY` diffÃ©rente de la clÃ© de dÃ©veloppement
- [ ] `ALLOWED_HOSTS` restreint aux domaines de production
- [ ] `CORS_ALLOWED_ORIGINS` restreint au domaine Vercel
- [ ] Signature HMAC webhook PayTech vÃ©rifiÃ©e
- [ ] Pas de `.env` commitÃ© en Git (vÃ©rifiÃ© dans `.gitignore`)
- [ ] HTTPS forcÃ© (gÃ©rÃ© par Render et Vercel)

### Performance

- [ ] Cache Redis activÃ© sur les endpoints catalogue
- [ ] `collectstatic` exÃ©cutÃ©
- [ ] Images compressÃ©es avant upload

### Fonctionnel

- [ ] Inscription + email de vÃ©rification reÃ§u
- [ ] Connexion + refresh token automatique
- [ ] CrÃ©ation boutique + approbation KYC
- [ ] Publication produit avec images
- [ ] Commande multi-vendeurs
- [ ] Paiement PayTech (mode production)
- [ ] Webhook PayTech reÃ§u et traitÃ©
- [ ] Wallet vendeur crÃ©ditÃ© (Phase 10)
- [ ] Demande de retrait approuvÃ©e
- [ ] Avis aprÃ¨s livraison
- [ ] Litige ouvert et rÃ©solu

---

## Domaines personnalisÃ©s (optionnel)

| Service | Domaine suggÃ©rÃ© |
| :--- | :--- |
| Frontend | `naatalfi.com` ou `www.naatalfi.com` |
| Backend API | `api.naatalfi.com` |

Configuration DNS :
- Frontend Vercel : ajouter un CNAME `cname.vercel-dns.com`
- Backend Render : ajouter un CNAME fourni par Render

---

## CI/CD (recommandÃ©)

Automatiser via GitHub Actions :

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    # Vercel dÃ©ploie automatiquement sur push main
    runs-on: ubuntu-latest
    steps:
      - run: echo "Vercel dÃ©ploie automatiquement"

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          cd backend
          pip install -r requirements.txt
          python manage.py test
```

---

## Validation actuelle

Avant de redeployer apres les phases 12-13 :

```powershell
cd C:\NaatalFi-SaaS\backend
venv\Scripts\python manage.py check
venv\Scripts\python manage.py makemigrations --check --dry-run
venv\Scripts\python manage.py test --settings=config.test_settings --verbosity 2
```

```powershell
cd C:\NaatalFi-SaaS\frontend
npm run build
```

Etat au 11 juin 2026 :

- backend check : OK ;
- migrations dry-run : OK, `No changes detected` ;
- tests backend : 11 tests OK ;
- build frontend : OK avec warning Vite de taille de bundle.

