# NaatalFi SaaS

Plateforme e-commerce multi-vendeur dédiée au marché sénégalais.

## Stack

| Segment | Technologies |
|---|---|
| Backend | Django 5 · Django REST Framework · SimpleJWT · Celery |
| Frontend | React 19 · Vite · Tailwind CSS · Zustand · React Router v7 |
| Base de données | PostgreSQL (Supabase) |
| Cache / Queue | Redis (Upstash) |
| Paiement | PayTech |

## Lancer le projet

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Documentation

Voir le dossier `docs/` pour l'architecture, les routes, la base de données et le compte rendu de l'état du projet.
