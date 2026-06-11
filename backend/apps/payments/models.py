import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models


class Payment(models.Model):
    class Provider(models.TextChoices):
        PAYTECH = 'PAYTECH', 'PayTech'
        WAVE = 'WAVE', 'Wave'
        ORANGE_MONEY = 'ORANGE_MONEY', 'Orange Money'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'En attente'
        PAID = 'PAID', 'Payé'
        FAILED = 'FAILED', 'Échoué'
        CANCELLED = 'CANCELLED', 'Annulé'
        EXPIRED = 'EXPIRED', 'Expiré'

    order = models.ForeignKey('orders.Order', on_delete=models.PROTECT, related_name='payments')
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='payments')
    provider = models.CharField(max_length=20, choices=Provider.choices, default=Provider.PAYTECH)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=3, default='XOF')
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    reference = models.CharField(max_length=80, unique=True, editable=False)
    provider_reference = models.CharField(max_length=120, blank=True)
    payment_url = models.URLField(max_length=1000, blank=True)
    raw_response = models.JSONField(default=dict, blank=True)
    raw_webhook = models.JSONField(default=dict, blank=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['reference']),
            models.Index(fields=['status', 'provider']),
        ]

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"NF-{self.order_id}-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.provider} {self.reference} ({self.status})"
