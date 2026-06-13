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
| Emails | Brevo | API HTTPS, free tier plus confortable pour le MVP |

---

## DÃ©ploiement actuel

| Ã‰lÃ©ment | Valeur |
| :--- | :--- |
| Backend Render | `https://naatalfi-backend.onrender.com` |
| Frontend Vercel | `https://naatalfi.vercel.app` |
| API de test | `https://naatalfi-backend.onrender.com/api/v1/marketplace/categories/` |
| Webhook PayTech | `https://naatalfi-backend.onrender.com/api/v1/payments/webhook/` |
| Worker Celery | Non utilise pour le MVP |
| Mode taches async | `EmailLog` + endpoint cron securise + GitHub Actions |

Les emails sont enregistres en base avec le statut `PENDING`, puis traites par l'endpoint cron securise appele par GitHub Actions.

---

## Variables d'environnement

### Backend (Render)

| Variable | Description | Exemple |
| :--- | :--- | :--- |
| `DEBUG` | Mode debug | `False` |
| `SECRET_KEY` | ClÃ© Django secrÃ¨te | `django-insecure-xxxxx` |
| `ALLOWED_HOSTS` | Domaines autorisÃ©s | `api.naatalfi.com,naatalfi.onrender.com` |
| `CSRF_TRUSTED_ORIGINS` | Origines HTTPS autorisees pour l'admin Django / CSRF | `https://naatalfi-backend.onrender.com,https://naatalfi.vercel.app` |
| `DB_HOST` | Host Supabase (pooler) | `aws-0-eu-west-1.pooler.supabase.com` |
| `DB_NAME` | Nom de la base | `postgres` |
| `DB_USER` | User Supabase | `postgres.uwlczpjq...` |
| `DB_PASSWORD` | Mot de passe Supabase | `xxxxxxxx` |
| `DB_PORT` | Port | `5432` |
| `CELERY_BROKER_URL` | URL Redis Upstash utilisee pour le cache Redis | `rediss://default:xxx@xxx.upstash.io:6379` |
| `CELERY_RESULT_BACKEND` | Optionnel tant qu'aucun worker Celery n'est deploye | idem |
| `CELERY_TASK_ALWAYS_EAGER` | Optionnel. Les emails et taches planifiees ne dependent plus d'un worker Celery | `True` ou non defini |
| `CRON_SECRET` | Secret partage pour proteger `/api/v1/internal/cron/run/` | `long-secret-random` |
| `SUPABASE_URL` | URL projet Supabase | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle service Supabase (nom exact attendu par settings.py) | `eyJxxxxx` |
| `PAYTECH_API_KEY` | ClÃ© API PayTech | `xxxxxxxx` |
| `PAYTECH_API_SECRET` | Secret PayTech | `xxxxxxxx` |
| `PAYTECH_BASE_URL` | Endpoint PayTech request-payment | `https://paytech.sn/api/payment/request-payment` |
| `PAYTECH_ENV` | Environnement PayTech | `prod` |
| `PAYTECH_WEBHOOK_SECRET` | Secret HMAC webhook (fallback uniquement ; la verification principale utilise api_key_sha256/api_secret_sha256 de PayTech) | `xxxxxxxx` |
| `WAVE_BUSINESS_PAYMENT_URL` | Lien de paiement Wave Business a ouvrir au checkout | `https://pay.wave.com/m/naatalfi` |
| `WAVE_BUSINESS_ACCOUNT_NAME` | Nom affiche dans les traces internes admin | `NaatalFi` |
| `WAVE_BUSINESS_PHONE` | Numero Wave Business de la plateforme | `+221771234567` |
| `BACKEND_URL` | URL publique du backend pour webhook | `https://api.naatalfi.com` |
| `EMAIL_PROVIDER` | Fournisseur email actif | `brevo` |
| `BREVO_API_KEY` | Cle API Brevo transactionnelle | `xkeysib-...` |
| `DEFAULT_FROM_EMAIL` | Expediteur verifie dans Brevo | `NaatalFi <no-reply@naatalfi.com>` |
| `EMAIL_TIMEOUT` | Timeout des appels email | `10` |
| `EMAIL_HOST` | Fallback SMTP uniquement si aucun provider API n'est configure | `smtp.example.com` |
| `EMAIL_HOST_USER` | Fallback SMTP | `user` |
| `EMAIL_HOST_PASSWORD` | Fallback SMTP | `xxxxxxxx` |
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
CSRF_TRUSTED_ORIGINS=https://naatalfi-backend.onrender.com,https://naatalfi.vercel.app
CELERY_TASK_ALWAYS_EAGER=True
CRON_SECRET=long-secret-random
EMAIL_PROVIDER=brevo
DEFAULT_FROM_EMAIL=NaatalFi <no-reply@naatalfi.com>
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

### 4. Cron gratuit avec GitHub Actions

Render Cron et Celery Worker sont reportes pour eviter un cout mensuel.

Le repo contient `.github/workflows/cron.yml`. Il appelle toutes les 10 minutes :

```text
POST https://naatalfi-backend.onrender.com/api/v1/internal/cron/run/
Header: X-CRON-SECRET
```

Configurer dans Render :

```env
CRON_SECRET=long-secret-random
```

Configurer dans GitHub > Settings > Secrets and variables > Actions :

```text
CRON_URL=https://naatalfi-backend.onrender.com/api/v1/internal/cron/run/
CRON_SECRET=la-meme-valeur-que-render
```

Ce cron traite les emails `EmailLog` en attente, libere les soldes wallet eligibles, expire les campagnes sponsorisees et lance les agregations analytics legeres.

### Emails transactionnels avec Brevo

Le backend utilise `EMAIL_PROVIDER=brevo` pour envoyer les emails via l'API HTTPS Brevo (`POST https://api.brevo.com/v3/smtp/email`) pendant le traitement cron. Cela evite les timeouts SMTP observes sur Render.

Prerequis Brevo :

- creer une cle API dans Brevo > SMTP & API > API Keys ;
- verifier l'expediteur ou le domaine d'envoi ;
- configurer SPF/DKIM/DMARC quand le domaine est achete ;
- utiliser une adresse `DEFAULT_FROM_EMAIL` autorisee par Brevo.

Variables Render minimales :

```env
EMAIL_PROVIDER=brevo
BREVO_API_KEY=xkeysib-...
DEFAULT_FROM_EMAIL=NaatalFi <no-reply@naatalfi.com>
EMAIL_TIMEOUT=10
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
- [ ] `CSRF_TRUSTED_ORIGINS` contient le backend Render et le frontend Vercel en HTTPS
- [ ] `python manage.py check --deploy` retourne `System check identified no issues`
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
- [ ] Paiement automatique PayTech/Wave API en pause jusqu'a activation fournisseur
- [ ] Paiement Wave Business manuel disponible comme fallback temporaire
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

Etat au 12 juin 2026 :

- backend check : OK ;
- migrations dry-run : OK, `No changes detected` ;
- tests backend : 69 tests OK ;
- tests frontend : 12 tests OK (`npm test`) ;
- build frontend : OK (~430ms).

---

## Runbook go-live (ordre d'execution)

A executer dans l'ordre, avec tes acces. Chaque etape est bloquante pour la suivante.

### 1. Pre-requis (local)
- [ ] `cd backend && venv\Scripts\python manage.py test --settings=config.test_settings` -> 66 OK
- [ ] `cd frontend && npm test` -> 12 OK
- [ ] `cd frontend && npm run build` -> OK

### 2. Base de donnees & stockage (Supabase)
- [ ] Recuperer les credentials Pooler (host/user/password/port) du projet prod
- [ ] Buckets crees : `avatars`, `vendor-logos`, `product-images`
- [ ] Lecture publique activee sur `vendor-logos` et `product-images`
- [ ] Politiques RLS configurees

### 3. Backend (Render)
- [ ] Variables d'env definies (voir tableau) — **attention : `SUPABASE_SERVICE_ROLE_KEY` (pas `SUPABASE_KEY`)**
- [ ] `DEBUG=False`, `SECRET_KEY` unique de prod, `ALLOWED_HOSTS` restreint
- [ ] `CORS_ALLOWED_ORIGINS` = domaine frontend exact
- [ ] `BACKEND_URL` / `FRONTEND_URL` corrects (servent a construire l'IPN PayTech et les liens email)
- [ ] Build command applique les migrations (`python manage.py migrate`)
- [ ] Apres 1er deploy : `python manage.py createsuperuser` via Render Shell
- [ ] Verifier `GET /api/v1/marketplace/categories/` repond 200

### 4. Frontend (Vercel)
- [ ] `VITE_API_URL` = `https://<backend>/api/v1`
- [ ] Redeploy apres toute modif de variable `VITE_*`
- [ ] Verifier que l'accueil charge produits + boutiques

### 5. PayTech (paiement reel)
- [ ] `PAYTECH_API_KEY` / `PAYTECH_API_SECRET` de prod definis sur Render
- [ ] `PAYTECH_ENV=prod`
- [ ] URL IPN cote PayTech : `https://<backend>/api/v1/payments/webhook/`
- [ ] Test paiement sandbox/reel -> commande passe `PAID`
- [ ] Verifier wallet vendeur credite (net 92%) + transaction COMMISSION (8%)
- [ ] **Securite** : sans cle API valide dans l'IPN, le webhook est refuse (403) en prod — c'est attendu

### 5b. Wave Business (paiement manuel)
- [ ] Compte Wave Business actif
- [ ] Recuperer le lien de paiement Wave Business
- [ ] Render : definir `WAVE_BUSINESS_PAYMENT_URL`
- [ ] Render : definir `WAVE_BUSINESS_ACCOUNT_NAME`
- [ ] Render : definir `WAVE_BUSINESS_PHONE`
- [ ] Test paiement Wave Business -> paiement reste `PENDING`
- [ ] Verifier le paiement recu dans Wave Business
- [ ] Admin > Paiements : cliquer `Valider` sur le paiement Wave concerne
- [ ] Apres validation admin : commande passe `PAID`, wallet vendeur credite (net 92%) + transaction COMMISSION (8%)

### 6. Cron gratuit GitHub Actions
- [ ] Render : definir `CRON_SECRET`
- [ ] GitHub Actions secrets : definir `CRON_URL`
- [ ] GitHub Actions secrets : definir `CRON_SECRET` avec la meme valeur que Render
- [ ] Verifier manuellement le workflow `NaatalFi Cron` avec `workflow_dispatch`
- [ ] Verifier dans l'admin Django que les `EmailLog` passent de `PENDING` a `SENT`

### 7. Verifications post-go-live
- [ ] Inscription -> email de verification recu
- [ ] Connexion (rate limiting actif : 429 apres 10 tentatives/min)
- [ ] Creation boutique -> approbation admin (KYC)
- [ ] Publication produit avec images
- [ ] Commande -> paiement -> wallet -> demande de retrait -> approbation admin
- [ ] Favoris + avis fonctionnels cote client
- [ ] Pages `/cgu` et `/confidentialite` accessibles
- [ ] Test mobile : accueil, marketplace, panier, checkout, dashboard, admin

### Hors perimetre code (a faire par toi)
Domaine + DNS (SPF/DKIM/DMARC), email d'envoi sur domaine reel (remplacer `onboarding@resend.dev`), Sentry/monitoring, backups Supabase, conditions d'utilisation juridiques validees.
