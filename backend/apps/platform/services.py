from .models import PlatformSettings


def get_platform_settings():
    obj, _ = PlatformSettings.objects.get_or_create(singleton_key='default')
    return obj
