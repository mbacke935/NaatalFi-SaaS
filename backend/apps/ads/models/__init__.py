from decimal import Decimal

from django.db import models


class AdCampaign(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Brouillon'
        ACTIVE = 'ACTIVE', 'Active'
        PAUSED = 'PAUSED', 'Pausee'
        EXPIRED = 'EXPIRED', 'Expiree'

    vendor = models.ForeignKey('vendors.Vendor', on_delete=models.CASCADE, related_name='ad_campaigns')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='ad_campaigns')
    budget = models.DecimalField(max_digits=12, decimal_places=2)
    spent = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    cost_per_click = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('50.00'))
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    impressions = models.PositiveIntegerField(default=0)
    clicks = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'start_date', 'end_date']),
            models.Index(fields=['vendor', '-created_at']),
            models.Index(fields=['product', 'status']),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.status}"

