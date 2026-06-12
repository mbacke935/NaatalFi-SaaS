from decimal import Decimal

from django.conf import settings
from django.db import models


class Dispute(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Ouvert'
        UNDER_REVIEW = 'UNDER_REVIEW', 'En revue'
        RESOLVED = 'RESOLVED', 'Resolu'
        CLOSED = 'CLOSED', 'Ferme'

    class Resolution(models.TextChoices):
        REFUND = 'REFUND', 'Remboursement'
        NO_REFUND = 'NO_REFUND', 'Pas de remboursement'

    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='disputes')
    vendor_order = models.ForeignKey('orders.VendorOrder', on_delete=models.PROTECT, related_name='disputes')
    initiator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='disputes')
    reason = models.CharField(max_length=80)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    resolution = models.CharField(max_length=20, choices=Resolution.choices, blank=True)
    admin_note = models.TextField(blank=True)
    frozen_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['vendor_order'],
                condition=models.Q(status__in=['OPEN', 'UNDER_REVIEW']),
                name='unique_open_dispute_per_vendor_order',
            ),
        ]
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['initiator', '-created_at']),
            models.Index(fields=['vendor_order', 'status']),
        ]

    def __str__(self):
        return f"Litige #{self.id} - {self.vendor_order_id}"

