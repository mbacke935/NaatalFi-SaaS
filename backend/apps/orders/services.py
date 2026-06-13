from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from apps.payments.models import Payment
from apps.products.models import ProductVariant
from .models import Order, VendorOrder


def restore_stock_for_vendor_order(vendor_order):
    for item in vendor_order.items.filter(variant__isnull=False):
        ProductVariant.objects.filter(pk=item.variant_id).update(
            stock=F('stock') + item.quantity
        )


def expire_unpaid_guest_orders(minutes=None, limit=100):
    expiration_minutes = minutes or getattr(settings, 'GUEST_ORDER_EXPIRATION_MINUTES', 60)
    cutoff = timezone.now() - timezone.timedelta(minutes=expiration_minutes)
    expired = 0

    order_ids = list(
        Order.objects
        .filter(
            buyer__isnull=True,
            status=Order.Status.PENDING,
            created_at__lte=cutoff,
        )
        .exclude(payments__status=Payment.Status.PAID)
        .order_by('created_at')
        .values_list('id', flat=True)[:limit]
    )

    for order_id in order_ids:
        with transaction.atomic():
            try:
                order = (
                    Order.objects
                    .select_for_update()
                    .prefetch_related('vendor_orders__items')
                    .get(pk=order_id, buyer__isnull=True, status=Order.Status.PENDING)
                )
            except Order.DoesNotExist:
                continue

            if order.payments.filter(status=Payment.Status.PAID).exists():
                continue

            for vendor_order in order.vendor_orders.filter(
                status__in=[VendorOrder.Status.PENDING, VendorOrder.Status.CONFIRMED]
            ):
                restore_stock_for_vendor_order(vendor_order)
                vendor_order.status = VendorOrder.Status.CANCELLED
                vendor_order.save(update_fields=['status', 'updated_at'])

            order.status = Order.Status.CANCELLED
            order.save(update_fields=['status', 'updated_at'])
            expired += 1

    return expired
