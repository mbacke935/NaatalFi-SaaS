from .settings import *  # noqa: F403


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

CELERY_TASK_ALWAYS_EAGER = True
CELERY_RESULT_BACKEND = 'cache+memory://'
CELERY_TASK_IGNORE_RESULT = True
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Cache local en mémoire (pas de Redis pendant les tests).
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Désactive le rate limiting par défaut pendant les tests : les tests qui
# veulent vérifier le throttling le réactivent explicitement via
# @override_settings (voir apps/users/tests.py::LoginThrottleTests).
REST_FRAMEWORK = {  # noqa: F405
    **REST_FRAMEWORK,  # noqa: F405
    'DEFAULT_THROTTLE_CLASSES': (),
    'DEFAULT_THROTTLE_RATES': {},
}
