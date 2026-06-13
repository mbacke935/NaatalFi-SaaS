from decimal import Decimal
import uuid

from django.conf import settings
from django.db import models


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'En attente'
        PAID = 'PAID', 'Payee'
        CANCELLED = 'CANCELLED', 'Annulee'

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='orders',
        null=True,
        blank=True,
    )
    guest_name = models.CharField(max_length=255, blank=True)
    guest_email = models.EmailField(blank=True)
    guest_phone = models.CharField(max_length=30, blank=True)
    guest_access_token = models.UUIDField(default=uuid.uuid4, editable=False, db_index=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    delivery_address = models.TextField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Commande'
        verbose_name_plural = 'Commandes'

    def __str__(self):
        buyer = self.buyer.email if self.buyer_id else self.guest_email
        return f"Commande #{self.pk} - {buyer}"


class VendorOrder(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'En attente'
        CONFIRMED = 'CONFIRMED', 'Confirmee'
        PROCESSING = 'PROCESSING', 'En preparation'
        SHIPPED = 'SHIPPED', 'Expediee'
        DELIVERED = 'DELIVERED', 'Livree'
        CANCELLED = 'CANCELLED', 'Annulee'
        REFUNDED = 'REFUNDED', 'Remboursee'

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='vendor_orders')
    vendor = models.ForeignKey('vendors.Vendor', on_delete=models.PROTECT, related_name='vendor_orders')
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Commande vendeur'
        verbose_name_plural = 'Commandes vendeurs'

    def __str__(self):
        return f"VendorOrder #{self.pk} - {self.vendor.name}"


class OrderItem(models.Model):
    vendor_order = models.ForeignKey(VendorOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(
        'products.Product', on_delete=models.SET_NULL, null=True, blank=True
    )
    variant = models.ForeignKey(
        'products.ProductVariant', on_delete=models.SET_NULL, null=True, blank=True
    )
    product_name = models.CharField(max_length=255)
    product_slug = models.SlugField(max_length=280)
    variant_label = models.CharField(max_length=200, blank=True)
    cover_image = models.URLField(max_length=500, blank=True, null=True)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField()

    class Meta:
        verbose_name = 'Article'
        verbose_name_plural = 'Articles'

    @property
    def subtotal(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.quantity}x {self.product_name}"
