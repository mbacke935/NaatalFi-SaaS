# Guide de Déploiement — NaatalFi Marketplace

---

## Infrastructure cible

| Composant | Plateforme | Plan |
| :--- | :--- | :--- |
| Frontend React | Vercel | Hobby (gratuit) → Pro si trafic |
| Backend Django | Render | Starter (7$/mois) |
| Base de données | Supabase | Free → Pro si besoin |
| Stockage fichiers | Supabase Storage | Inclus dans Supabase |
| Cache + Celery | Upstash Redis | Pay-as-you-go |
| Emails | Resend ou SendGrid | Free tier suffisant au départ |

---

## Variables d'environnement

### Backend (Render)

| Variable | Description | Exemple |
| :--- | :--- | :--- |
| `DEBUG` | Mode debug | `False` |
| `SECRET_KEY` | Clé Django secrète | `django-insecure-xxxxx` |
| `ALLOWED_HOSTS` | Domaines autorisés | `api.naatalfi.com,naatalfi.onrender.com` |
| `DB_HOST` | Host Supabase (pooler) | `aws-0-eu-west-1.pooler.supabase.com` |
| `DB_NAME` | Nom de la base | `postgres` |
| `DB_USER` | User Supabase | `postgres.uwlczpjq...` |
| `DB_PASSWORD` | Mot de passe Supabase | `xxxxxxxx` |
| `DB_PORT` | Port | `5432` |
| `CELERY_BROKER_URL` | URL Redis Upstash | `rediss://default:xxx@xxx.upstash.io:6380` |
| `CELERY_RESULT_BACKEND` | Même URL Redis | idem |
| `SUPABASE_URL` | URL projet Supabase | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Clé service Supabase | `eyJxxxxx` |
| `PAYTECH_API_KEY` | Clé API PayTech | `xxxxxxxx` |
| `PAYTECH_API_SECRET` | Secret PayTech | `xxxxxxxx` |
| `EMAIL_HOST` | Serveur SMTP | `smtp.resend.com` |
| `EMAIL_HOST_USER` | Login SMTP | `resend` |
| `EMAIL_HOST_PASSWORD` | Mot de passe SMTP | `re_xxxxxxxx` |
| `FRONTEND_URL` | URL du frontend | `https://naatalfi.vercel.app` |
| `CORS_ALLOWED_ORIGINS` | Origines CORS autorisées | `https://naatalfi.vercel.app` |

### Frontend (Vercel)

| Variable | Description | Exemple |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL de l'API backend | `https://api.naatalfi.com/api/v1` |
| `VITE_SUPABASE_URL` | URL Supabase | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé publique Supabase | `eyJxxxxx` |

---

## Déploiement Backend (Render)

### 1. Préparer le projet

S'assurer que ces fichiers existent à la racine de `backend/` :

**`requirements.txt`** — généré par `pip freeze`

**`Procfile`** (à créer)
```
web: gunicorn config.wsgi:application --workers 2 --bind 0.0.0.0:$PORT
worker: celery -A config.celery worker --loglevel=info
```

**`runtime.txt`** (à créer)
```
python-3.12.0
```

### 2. Installer gunicorn

```bash
pip install gunicorn
pip freeze > requirements.txt
```

### 3. Configurer sur Render

1. Nouveau **Web Service** → connecter le repo GitHub
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

Créer un second service **Background Worker** :
- **Root Directory** : `backend`
- **Start Command** : `celery -A config.celery worker --loglevel=info`
- Mêmes variables d'environnement

---

## Déploiement Frontend (Vercel)

### 1. Configurer `vite.config.js`

S'assurer que la base URL utilise la variable d'env :
```js
// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL
```

### 2. Déployer sur Vercel

```bash
npm install -g vercel
vercel --prod
```

Ou via l'interface Vercel :
1. **Import Git Repository** → sélectionner le repo
2. **Root Directory** : `frontend`
3. **Framework** : Vite (détecté automatiquement)
4. **Build Command** : `npm run build`
5. **Output Directory** : `dist`
6. Ajouter les variables d'environnement

### 3. Configurer le routeur React (SPA)

Créer `frontend/public/vercel.json` :
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Déploiement Base de données (Supabase)

Supabase est déjà configuré depuis le développement local.

### Checklist production

- [ ] `python manage.py migrate` lancé avec les credentials Supabase de prod
- [ ] `python manage.py createsuperuser` exécuté en prod
- [ ] Buckets Supabase Storage créés : `avatars`, `vendor-logos`, `product-images`
- [ ] Politiques RLS (Row Level Security) configurées sur les buckets
- [ ] Accès public en lecture activé sur `product-images` et `vendor-logos`

---

## Checklist pré-déploiement

### Sécurité

- [ ] `DEBUG=False` en production
- [ ] `SECRET_KEY` différente de la clé de développement
- [ ] `ALLOWED_HOSTS` restreint aux domaines de production
- [ ] `CORS_ALLOWED_ORIGINS` restreint au domaine Vercel
- [ ] Signature HMAC webhook PayTech vérifiée
- [ ] Pas de `.env` commité en Git (vérifié dans `.gitignore`)
- [ ] HTTPS forcé (géré par Render et Vercel)

### Performance

- [ ] Cache Redis activé sur les endpoints catalogue
- [ ] `collectstatic` exécuté
- [ ] Images compressées avant upload

### Fonctionnel

- [ ] Inscription + email de vérification reçu
- [ ] Connexion + refresh token automatique
- [ ] Création boutique + approbation KYC
- [ ] Publication produit avec images
- [ ] Commande multi-vendeurs
- [ ] Paiement PayTech (mode production)
- [ ] Webhook PayTech reçu et traité
- [ ] Wallet vendeur crédité
- [ ] Demande de retrait approuvée
- [ ] Avis après livraison
- [ ] Litige ouvert et résolu

---

## Domaines personnalisés (optionnel)

| Service | Domaine suggéré |
| :--- | :--- |
| Frontend | `naatalfi.com` ou `www.naatalfi.com` |
| Backend API | `api.naatalfi.com` |

Configuration DNS :
- Frontend Vercel : ajouter un CNAME `cname.vercel-dns.com`
- Backend Render : ajouter un CNAME fourni par Render

---

## CI/CD (recommandé)

Automatiser via GitHub Actions :

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    # Vercel déploie automatiquement sur push main
    runs-on: ubuntu-latest
    steps:
      - run: echo "Vercel déploie automatiquement"

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
