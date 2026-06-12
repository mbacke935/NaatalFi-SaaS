from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv
from celery.schedules import crontab

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set.")

DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '127.0.0.1,localhost').split(',')

# ── Applications ────────────────────────────────────────────────────
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
]

LOCAL_APPS = [
    'apps.users',
    'apps.vendors',
    'apps.categories',
    'apps.products',
    'apps.marketplace',
    'apps.orders',
    'apps.account',
    'apps.payments',
    'apps.wallet',
    'apps.shipping',
    'apps.notifications',
    'apps.reviews',
    'apps.ads',
    'apps.disputes',
    'apps.analytics',
    'apps.platform',
    'apps.internal',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ── Middleware ───────────────────────────────────────────────────────
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ── Base de données ──────────────────────────────────────────────────
DB_HOST = os.getenv('DB_HOST', '')

if DB_HOST:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'postgres'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': DB_HOST,
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ── Validation des mots de passe ────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ── Internationalisation ─────────────────────────────────────────────
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Dakar'
USE_I18N = True
USE_TZ = True

# ── Fichiers statiques ───────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'users.CustomUser'

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://127.0.0.1:3000')

# ── Supabase Storage ─────────────────────────────────────────────────
SUPABASE_URL              = os.getenv('SUPABASE_URL', '')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

# ── Paiements (PayTech) ────────────────────────────────────────────────
PAYTECH_API_KEY        = os.getenv('PAYTECH_API_KEY', '')
PAYTECH_API_SECRET     = os.getenv('PAYTECH_API_SECRET', '')
PAYTECH_BASE_URL       = os.getenv('PAYTECH_BASE_URL', 'https://paytech.sn/api/payment/request-payment')
PAYTECH_ENV            = os.getenv('PAYTECH_ENV', 'test' if DEBUG else 'prod')
PAYTECH_WEBHOOK_SECRET = os.getenv('PAYTECH_WEBHOOK_SECRET', '')
BACKEND_URL            = os.getenv('BACKEND_URL', 'http://127.0.0.1:8000')
CRON_SECRET            = os.getenv('CRON_SECRET', '')

# ── Email ────────────────────────────────────────────────────────────
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_BACKEND    = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST       = os.getenv('EMAIL_HOST', '')
    EMAIL_PORT       = int(os.getenv('EMAIL_PORT', 587))
    EMAIL_USE_TLS    = True
    EMAIL_HOST_USER  = os.getenv('EMAIL_HOST_USER', '')
    EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
    EMAIL_TIMEOUT    = int(os.getenv('EMAIL_TIMEOUT', 10))

DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'NaatalFi <noreply@naatalfi.com>')
EMAIL_PROVIDER = os.getenv('EMAIL_PROVIDER', '')
RESEND_API_KEY = os.getenv('RESEND_API_KEY', '')
RESEND_API_URL = os.getenv('RESEND_API_URL', 'https://api.resend.com/emails')
AWS_SES_REGION = os.getenv('AWS_SES_REGION', 'us-east-1')
AWS_SES_ACCESS_KEY_ID = os.getenv('AWS_SES_ACCESS_KEY_ID', os.getenv('AWS_ACCESS_KEY_ID', ''))
AWS_SES_SECRET_ACCESS_KEY = os.getenv('AWS_SES_SECRET_ACCESS_KEY', os.getenv('AWS_SECRET_ACCESS_KEY', ''))

# ── Celery ───────────────────────────────────────────────────────────
CELERY_BROKER_URL        = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND    = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT    = ['json']
CELERY_TASK_SERIALIZER   = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE          = TIME_ZONE
CELERY_TASK_ALWAYS_EAGER = os.getenv('CELERY_TASK_ALWAYS_EAGER', 'True' if DEBUG else 'False') == 'True'
CELERY_BEAT_SCHEDULE     = {
    'release-pending-wallet-balances-daily': {
        'task': 'tasks.wallet.release_pending_balance_task',
        'schedule': crontab(hour=2, minute=0),
        'kwargs': {'days': 7},
    },
    'aggregate-daily-analytics': {
        'task': 'tasks.analytics.aggregate_daily_analytics',
        'schedule': crontab(hour=3, minute=0),
    },
    'expire-ad-campaigns-daily': {
        'task': 'tasks.analytics.expire_ad_campaigns',
        'schedule': crontab(hour=3, minute=30),
    },
}

# ── Cache Redis ──────────────────────────────────────────────────────
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0').replace('/0', '/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'IGNORE_EXCEPTIONS': True,  # Graceful degradation si Redis est indisponible
        },
        'TIMEOUT': 300,  # TTL par défaut : 5 min
    }
}

# ── CORS ─────────────────────────────────────────────────────────────
_default_cors = 'http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:5173,http://localhost:5173'
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CORS_ALLOWED_ORIGINS', _default_cors).split(',')
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

# ── Django REST Framework ────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # Rate limiting : seuls les endpoints portant un `throttle_scope`
    # (auth sensible : login, register, mot de passe) sont limités.
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.ScopedRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'login': '10/min',
        'register': '5/min',
        'password_reset': '5/min',
    },
}

# ── JWT ──────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
