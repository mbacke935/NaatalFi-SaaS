from datetime import timedelta
from decimal import Decimal

from django.db import transaction as db_transaction
from django.db.models import F
from django.utils import timezone

from .models import Wallet, Transaction

# Taux de commission plateforme par defaut, utilise si les settings n'existent pas encore.
PLATFORM_COMMISSION_RATE = Decimal('8.00')


def get_platform_commission_rate():
    from apps.platform.services import get_platform_settings

    settings = get_platform_settings()
    return Decimal(settings.commission_rate)


def credit_wallet_from_order(order):
    """
    Credite le wallet de chaque vendeur implique dans une commande PAID.
    Net = subtotal - commission plateforme + shipping_cost -> pending_balance.
    """
    rate = get_platform_commission_rate()
    for vendor_order in order.vendor_orders.select_related('vendor').all():
        vendor = vendor_order.vendor

        product_amount = vendor_order.subtotal
        commission = (product_amount * rate / Decimal('100')).quantize(Decimal('0.01'))
        net_amount = product_amount - commission + vendor_order.shipping_cost

        sale_reference = f"ORDER-{order.id}-VENDOR-{vendor.id}-SALE"
        commission_reference = f"ORDER-{order.id}-VENDOR-{vendor.id}-COMMISSION"
        legacy_reference = f"ORDER-{order.id}-VENDOR-{vendor.id}"

        with db_transaction.atomic():
            wallet, _ = Wallet.objects.select_for_update().get_or_create(vendor=vendor)

            if Transaction.objects.filter(reference__in=[sale_reference, legacy_reference]).exists():
                continue

            Wallet.objects.filter(pk=wallet.pk).update(
                pending_balance=F('pending_balance') + net_amount,
            )
            Transaction.objects.create(
                wallet=wallet,
                type=Transaction.Type.SALE,
                amount=net_amount,
                description=f"Vente #{order.id} - commission {rate}% deduite",
                reference=sale_reference,
            )
            if commission > 0:
                Transaction.objects.create(
                    wallet=wallet,
                    type=Transaction.Type.COMMISSION,
                    amount=commission,
                    description=f"Commission plateforme #{order.id} ({rate}%)",
                    reference=commission_reference,
                )


def release_pending_balances(days=7):
    """
    Transfere les ventes confirmees de pending vers available apres le delai.
    Chaque transaction SALE est liberee une seule fois via sa reference RELEASE.
    """
    cutoff = timezone.now() - timedelta(days=days)
    released_count = 0

    sales = (
        Transaction.objects
        .select_related('wallet')
        .filter(type=Transaction.Type.SALE, created_at__lte=cutoff)
        .exclude(reference='')
        .order_by('created_at')
    )

    for sale in sales:
        release_reference = f"{sale.reference}-RELEASE"
        if Transaction.objects.filter(reference=release_reference).exists():
            continue

        with db_transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(pk=sale.wallet_id)
            if wallet.pending_balance < sale.amount:
                continue

            Wallet.objects.filter(pk=wallet.pk).update(
                pending_balance=F('pending_balance') - sale.amount,
                available_balance=F('available_balance') + sale.amount,
            )
            Transaction.objects.create(
                wallet=wallet,
                type=Transaction.Type.RELEASE,
                amount=sale.amount,
                description=f"Solde disponible pour {sale.reference}",
                reference=release_reference,
            )
            released_count += 1

    return released_count
