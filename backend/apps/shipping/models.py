from decimal import Decimal
from django.db import models


class ShippingZone(models.Model):
    vendor       = models.ForeignKey('vendors.Vendor', on_delete=models.CASCADE, related_name='shipping_zones')
    name         = models.CharField(max_length=100)
    regions      = models.JSONField(default=list)
    is_active    = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering            = ['name']
        verbose_name        = 'Zone de livraison'
        verbose_name_plural = 'Zones de livraison'

    def __str__(self):
        return f"{self.vendor.name} — {self.name}"


class ShippingRate(models.Model):
    zone           = models.ForeignKey(ShippingZone, on_delete=models.CASCADE, related_name='rates')
    price          = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    estimated_days = models.PositiveSmallIntegerField(default=2)
    min_weight     = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    max_weight     = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering            = ['price']
        verbose_name        = 'Tarif de livraison'
        verbose_name_plural = 'Tarifs de livraison'

    def __str__(self):
        return f"{self.zone.name} — {self.price} FCFA ({self.estimated_days}j)"
