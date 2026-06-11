from celery import shared_task
from django.utils import timezone


@shared_task
def aggregate_daily_analytics():
    from apps.orders.models import Order, VendorOrder
    from apps.payments.models import Payment

    today = timezone.localdate()
    return {
        'date': today.isoformat(),
        'orders': Order.objects.filter(created_at__date=today).count(),
        'vendor_orders': VendorOrder.objects.filter(created_at__date=today).count(),
        'paid_payments': Payment.objects.filter(
            status=Payment.Status.PAID,
            paid_at__date=today,
        ).count(),
    }


@shared_task
def expire_ad_campaigns():
    # The ads model arrives in a later roadmap phase. Keep the beat task present
    # now so production workers can start without missing-task errors.
    try:
        from apps.ads.models import AdCampaign
    except Exception:
        return {'expired': 0, 'reason': 'ads_app_not_ready'}

    today = timezone.localdate()
    qs = AdCampaign.objects.filter(status='ACTIVE', end_date__lt=today)
    expired = qs.update(status='EXPIRED')
    return {'expired': expired}
