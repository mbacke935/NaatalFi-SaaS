from decimal import Decimal
from django.db import transaction as db_transaction
from django.db.models import F

from .models import Wallet, Transaction


def credit_wallet_from_order(order):
    """
    Crédite le wallet de chaque vendeur impliqué dans une commande PAID.
    Net = subtotal - commission (selon VendorPlan) + shipping_cost → pending_balance.
    """
    for vendor_order in order.vendor_orders.select_related('vendor__plan').all():
        vendor = vendor_order.vendor
        rate = vendor.plan.commission_rate if vendor.plan else Decimal('10.00')

        product_amount = vendor_order.subtotal
        commission     = (product_amount * rate / Decimal('100')).quantize(Decimal('0.01'))
        net_amount     = product_amount - commission + vendor_order.shipping_cost

        with db_transaction.atomic():
            wallet, _ = Wallet.objects.select_for_update().get_or_create(vendor=vendor)
            Wallet.objects.filter(pk=wallet.pk).update(
                pending_balance=F('pending_balance') + net_amount,
            )
            Transaction.objects.create(
                wallet=wallet,
                type=Transaction.Type.SALE,
                amount=net_amount,
                description=f"Vente #{order.id} — commission {rate}% déduite",
                reference=f"ORDER-{order.id}-VENDOR-{vendor.id}",
            )
