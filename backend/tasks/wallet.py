from celery import shared_task


@shared_task
def credit_vendor_wallets_task(order_id):
    from apps.orders.models import Order
    from apps.wallet.services import credit_wallet_from_order
    try:
        order = Order.objects.prefetch_related(
            'vendor_orders__vendor__plan'
        ).get(pk=order_id)
        credit_wallet_from_order(order)
    except Order.DoesNotExist:
        pass


@shared_task
def release_pending_balance_task(days=7):
    from apps.wallet.services import release_pending_balances
    return release_pending_balances(days=days)
