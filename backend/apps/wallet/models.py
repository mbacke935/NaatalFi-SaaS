from decimal import Decimal
from django.db import models
from django.db.models import Q


class Wallet(models.Model):
    vendor            = models.OneToOneField(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='wallet',
    )
    pending_balance   = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    available_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    frozen_balance    = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Portefeuille'
        verbose_name_plural = 'Portefeuilles'

    def __str__(self):
        return f"Wallet — {self.vendor.name}"


class Transaction(models.Model):
    class Type(models.TextChoices):
        SALE    = 'SALE',    'Vente'
        COMMISSION = 'COMMISSION', 'Commission'
        PAYOUT  = 'PAYOUT',  'Retrait'
        REFUND  = 'REFUND',  'Remboursement'
        FREEZE  = 'FREEZE',  'Gel'
        AD_SPEND = 'AD_SPEND', 'Publicite'
        UNFREEZE = 'UNFREEZE', 'Degel litige'
        RELEASE = 'RELEASE', 'Dégel'

    wallet      = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    type        = models.CharField(max_length=10, choices=Type.choices)
    amount      = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    reference   = models.CharField(max_length=100, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering            = ['-created_at']
        verbose_name        = 'Transaction'
        verbose_name_plural = 'Transactions'
        constraints = [
            models.UniqueConstraint(
                fields=['reference'],
                condition=~Q(reference=''),
                name='unique_wallet_transaction_reference',
            ),
        ]

    def __str__(self):
        return f"{self.type} {self.amount} — {self.wallet.vendor.name}"


class PayoutRequest(models.Model):
    class Status(models.TextChoices):
        PENDING  = 'PENDING',  'En attente'
        APPROVED = 'APPROVED', 'Approuvée'
        REJECTED = 'REJECTED', 'Rejetée'

    wallet     = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='payout_requests')
    amount     = models.DecimalField(max_digits=12, decimal_places=2)
    status     = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    bank_info  = models.JSONField(default=dict)
    admin_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering            = ['-created_at']
        verbose_name        = 'Demande de retrait'
        verbose_name_plural = 'Demandes de retrait'

    def __str__(self):
        return f"Retrait {self.amount} FCFA — {self.wallet.vendor.name} ({self.status})"
