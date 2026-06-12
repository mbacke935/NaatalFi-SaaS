from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from .models import EmailLog


def queue_email(*, subject, message, recipient, from_email=None, scheduled_at=None):
    return EmailLog.objects.create(
        to_email=recipient,
        subject=subject,
        message=message,
        from_email=from_email or settings.DEFAULT_FROM_EMAIL,
        scheduled_at=scheduled_at or timezone.now(),
    )


def process_pending_emails(limit=25):
    now = timezone.now()
    sent = 0
    failed = 0

    candidates = (
        EmailLog.objects
        .filter(status__in=[EmailLog.Status.PENDING, EmailLog.Status.FAILED], scheduled_at__lte=now)
        .filter(attempts__lt=F('max_attempts'))
        .order_by('scheduled_at', 'id')[:limit]
    )

    for email in candidates:
        with transaction.atomic():
            locked = EmailLog.objects.select_for_update().get(pk=email.pk)
            if locked.status == EmailLog.Status.SENT or locked.attempts >= locked.max_attempts:
                continue
            locked.status = EmailLog.Status.SENDING
            locked.attempts += 1
            locked.save(update_fields=['status', 'attempts', 'updated_at'])

        try:
            send_mail(
                subject=locked.subject,
                message=locked.message,
                from_email=locked.from_email or settings.DEFAULT_FROM_EMAIL,
                recipient_list=[locked.to_email],
                fail_silently=False,
            )
        except Exception as exc:
            locked.status = EmailLog.Status.FAILED
            locked.last_error = str(exc)[:2000]
            locked.save(update_fields=['status', 'last_error', 'updated_at'])
            failed += 1
        else:
            locked.status = EmailLog.Status.SENT
            locked.sent_at = timezone.now()
            locked.last_error = ''
            locked.save(update_fields=['status', 'sent_at', 'last_error', 'updated_at'])
            sent += 1

    return {'sent': sent, 'failed': failed}


def run_scheduled_tasks():
    from apps.wallet.services import release_pending_balances
    from tasks.analytics import aggregate_daily_analytics, expire_ad_campaigns

    return {
        'emails': process_pending_emails(),
        'wallet_released': release_pending_balances(days=7),
        'analytics': aggregate_daily_analytics(),
        'ads': expire_ad_campaigns(),
    }
