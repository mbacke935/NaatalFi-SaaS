from decimal import Decimal

from django.db import transaction as db_transaction
from django.db.models import F
from django.utils import timezone

from apps.orders.models import VendorOrder
from apps.wallet.models import Transaction, Wallet
from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from apps.disputes.models import Dispute


def _dispute_amount(vendor_order):
    return vendor_order.subtotal + vendor_order.shipping_cost


def freeze_vendor_order_amount(dispute):
    vendor = dispute.vendor_order.vendor
    wallet, _ = Wallet.objects.select_for_update().get_or_create(vendor=vendor)
    amount = min(wallet.available_balance, _dispute_amount(dispute.vendor_order))
    if amount <= 0:
        return Decimal('0.00')

    Wallet.objects.filter(pk=wallet.pk).update(
        available_balance=F('available_balance') - amount,
        frozen_balance=F('frozen_balance') + amount,
    )
    Transaction.objects.create(
        wallet=wallet,
        type=Transaction.Type.FREEZE,
        amount=amount,
        description=f"Gel litige #{dispute.id}",
        reference=f"DISPUTE-{dispute.id}-FREEZE",
    )
    dispute.frozen_amount = amount
    dispute.save(update_fields=['frozen_amount', 'updated_at'])
    return amount


def create_dispute(*, vendor_order, initiator, reason, description=''):
    with db_transaction.atomic():
        dispute = Dispute.objects.create(
            order=vendor_order.order,
            vendor_order=vendor_order,
            initiator=initiator,
            reason=reason,
            description=description,
            status=Dispute.Status.OPEN,
        )
        freeze_vendor_order_amount(dispute)
        create_notification(
            user=vendor_order.vendor.user,
            type=Notification.Type.SYSTEM,
            title=f"Litige ouvert #{dispute.id}",
            message=f"Un litige a ete ouvert sur la commande vendeur #{vendor_order.id}.",
            link_url="/dashboard/disputes",
        )
        return dispute


def resolve_dispute(*, dispute, resolution, note=''):
    with db_transaction.atomic():
        dispute = Dispute.objects.select_for_update().select_related(
            'vendor_order__vendor__user',
            'order__buyer',
        ).get(pk=dispute.pk)
        if dispute.status in [Dispute.Status.RESOLVED, Dispute.Status.CLOSED]:
            raise ValueError('Ce litige est deja resolu.')

        wallet, _ = Wallet.objects.select_for_update().get_or_create(vendor=dispute.vendor_order.vendor)
        amount = min(wallet.frozen_balance, dispute.frozen_amount)

        if resolution == Dispute.Resolution.REFUND:
            if amount > 0:
                Wallet.objects.filter(pk=wallet.pk).update(
                    frozen_balance=F('frozen_balance') - amount,
                )
                Transaction.objects.create(
                    wallet=wallet,
                    type=Transaction.Type.REFUND,
                    amount=amount,
                    description=f"Remboursement litige #{dispute.id}",
                    reference=f"DISPUTE-{dispute.id}-REFUND",
                )
            dispute.vendor_order.status = VendorOrder.Status.REFUNDED
            dispute.vendor_order.save(update_fields=['status', 'updated_at'])
        else:
            if amount > 0:
                Wallet.objects.filter(pk=wallet.pk).update(
                    frozen_balance=F('frozen_balance') - amount,
                    available_balance=F('available_balance') + amount,
                )
                Transaction.objects.create(
                    wallet=wallet,
                    type=Transaction.Type.UNFREEZE,
                    amount=amount,
                    description=f"Liberation litige #{dispute.id}",
                    reference=f"DISPUTE-{dispute.id}-UNFREEZE",
                )

        dispute.status = Dispute.Status.RESOLVED
        dispute.resolution = resolution
        dispute.admin_note = note
        dispute.resolved_at = timezone.now()
        dispute.save(update_fields=['status', 'resolution', 'admin_note', 'resolved_at', 'updated_at'])

        create_notification(
            user=dispute.order.buyer,
            type=Notification.Type.SYSTEM,
            title=f"Litige #{dispute.id} resolu",
            message=f"Resolution : {dispute.get_resolution_display()}",
            link_url="/account/orders",
        )
        create_notification(
            user=dispute.vendor_order.vendor.user,
            type=Notification.Type.SYSTEM,
            title=f"Litige #{dispute.id} resolu",
            message=f"Resolution : {dispute.get_resolution_display()}",
            link_url="/dashboard/disputes",
        )
        return dispute

