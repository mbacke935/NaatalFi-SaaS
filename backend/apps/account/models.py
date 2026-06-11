from django.db import models
from django.conf import settings


class Address(models.Model):
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='addresses')
    label      = models.CharField(max_length=100, default='Maison')
    full_name  = models.CharField(max_length=200)
    phone      = models.CharField(max_length=20)
    street     = models.TextField()
    city       = models.CharField(max_length=100)
    region     = models.CharField(max_length=100, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering            = ['-is_default', '-created_at']
        verbose_name        = 'Adresse'
        verbose_name_plural = 'Adresses'

    def __str__(self):
        return f"{self.label} — {self.full_name} ({self.city})"


class Favorite(models.Model):
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    product    = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering          = ['-created_at']
        unique_together   = [('user', 'product')]
        verbose_name      = 'Favori'
        verbose_name_plural = 'Favoris'

    def __str__(self):
        return f"{self.user.email} → {self.product.name}"
