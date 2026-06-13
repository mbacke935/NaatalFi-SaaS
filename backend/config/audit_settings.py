"""
Settings d'audit local — utilisés uniquement pour la campagne de tests live.
Force une base SQLite dédiée (jamais Supabase), cache mémoire, emails console.

Usage :
    venv\\Scripts\\python manage.py migrate --settings=config.audit_settings
    venv\\Scripts\\python manage.py runserver 8000 --settings=config.audit_settings
"""
from .settings import *  # noqa: F403

DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'audit_db.sqlite3',  # noqa: F405
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

CELERY_TASK_ALWAYS_EAGER = True
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
EMAIL_PROVIDER = ''
BREVO_API_KEY = ''
RESEND_API_KEY = ''
CRON_SECRET = 'audit-cron-secret'

ALLOWED_HOSTS = ['127.0.0.1', 'localhost']
CORS_ALLOWED_ORIGINS = [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3100',
    'http://localhost:3100',
]
