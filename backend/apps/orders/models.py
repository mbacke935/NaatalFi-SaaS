from decimal import Decimal
from django.db import models
from django.conf import settings


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING    = 'PENDING',    'En attente'
        CONFIRMED  = 'CONFIRMED',  'Confirmée'
        PROCESSING = 'PROCESSING', 'En préparation'
        SHIPPED    = 'SHIPPED',    'Expédiée'
        DELIVERED  = 'DELIVERED',  'Livrée'
        CANCELLED  = 'CANCELLED',  'Annulée'
        REFUNDED   = 'REFUNDED',   'Remboursée'

    buyer            = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='orders',
    )
    vendor           = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.PROTECT,
        related_name='orders',
    )
    status           = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    total            = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    delivery_address = models.TextField()
    notes            = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        ordering            = ['-created_at']
        verbose_name        = 'Commande'
        verbose_name_plural = 'Commandes'

    def __str__(self):
        return f"Commande #{self.pk} — {self.buyer.email}"


class OrderItem(models.Model):
    order         = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product       = models.ForeignKey(
        'products.Product', on_delete=models.SET_NULL, null=True, blank=True
    )
    variant       = models.ForeignKey(
        'products.ProductVariant', on_delete=models.SET_NULL, null=True, blank=True
    )
    product_name  = models.CharField(max_length=255)
    product_slug  = models.SlugField(max_length=280)
    variant_label = models.CharField(max_length=200, blank=True)
    cover_image   = models.URLField(max_length=500, blank=True, null=True)
    unit_price    = models.DecimalField(max_digits=12, decimal_places=2)
    quantity      = models.PositiveIntegerField()

    class Meta:
        verbose_name        = 'Article'
        verbose_name_plural = 'Articles'

    @property
    def subtotal(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.quantity}× {self.product_name}"
