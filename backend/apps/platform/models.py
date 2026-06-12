from django.db import models


class PlatformSettings(models.Model):
    singleton_key = models.CharField(max_length=20, default='default', unique=True, editable=False)
    contact_email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=30, blank=True)
    facebook_url = models.URLField(max_length=500, blank=True)
    instagram_url = models.URLField(max_length=500, blank=True)
    tiktok_url = models.URLField(max_length=500, blank=True)
    linkedin_url = models.URLField(max_length=500, blank=True)
    hero_image_url = models.URLField(max_length=1000, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Parametres plateforme'
        verbose_name_plural = 'Parametres plateforme'

    def __str__(self):
        return 'Parametres publics NaatalFi'
