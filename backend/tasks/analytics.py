from celery import shared_task
from django.utils import timezone


@shared_task
def aggregate_daily_analytics():
    from apps.analytics.services import admin_overview, admin_top_vendors

    today = timezone.localdate()
    return {
        'date': today.isoformat(),
        'overview': admin_overview('1d'),
        'top_vendors': admin_top_vendors('1d', limit=10),
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
