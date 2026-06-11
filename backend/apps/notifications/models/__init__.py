from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        ACCOUNT = 'ACCOUNT', 'Compte'
        ORDER = 'ORDER', 'Commande'
        PAYMENT = 'PAYMENT', 'Paiement'
        VENDOR = 'VENDOR', 'Vendeur'
        WALLET = 'WALLET', 'Wallet'
        SYSTEM = 'SYSTEM', 'Systeme'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.SYSTEM)
    title = models.CharField(max_length=160, blank=True)
    message = models.TextField()
    link_url = models.CharField(max_length=500, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
            models.Index(fields=['type', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.type}"

