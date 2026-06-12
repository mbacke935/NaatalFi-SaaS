from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone
import requests

from .models import EmailLog


def get_email_provider():
    provider = getattr(settings, 'EMAIL_PROVIDER', '').strip().lower()
    if provider:
        return provider
    if getattr(settings, 'BREVO_API_KEY', ''):
        return 'brevo'
    if getattr(settings, 'AWS_SES_ACCESS_KEY_ID', '') and getattr(settings, 'AWS_SES_SECRET_ACCESS_KEY', ''):
        return 'aws_ses'
    if getattr(settings, 'RESEND_API_KEY', ''):
        return 'resend'
    return 'smtp'


def get_aws_ses_client():
    import boto3

    return boto3.client(
        'sesv2',
        region_name=getattr(settings, 'AWS_SES_REGION', 'us-east-1'),
        aws_access_key_id=getattr(settings, 'AWS_SES_ACCESS_KEY_ID', ''),
        aws_secret_access_key=getattr(settings, 'AWS_SES_SECRET_ACCESS_KEY', ''),
    )


def queue_email(*, subject, message, recipient, from_email=None, scheduled_at=None):
    return EmailLog.objects.create(
        to_email=recipient,
        subject=subject,
        message=message,
        from_email=from_email or settings.DEFAULT_FROM_EMAIL,
        scheduled_at=scheduled_at or timezone.now(),
    )


def send_email_with_aws_ses(email):
    client = get_aws_ses_client()
    try:
        client.send_email(
            FromEmailAddress=email.from_email or settings.DEFAULT_FROM_EMAIL,
            Destination={'ToAddresses': [email.to_email]},
            Content={
                'Simple': {
                    'Subject': {'Data': email.subject, 'Charset': 'UTF-8'},
                    'Body': {'Text': {'Data': email.message, 'Charset': 'UTF-8'}},
                }
            },
        )
    except Exception as exc:
        raise RuntimeError(f'AWS SES: {exc}') from exc


def send_email_with_resend(email):
    resend_api_key = getattr(settings, 'RESEND_API_KEY', '')
    if not resend_api_key:
        raise RuntimeError('RESEND_API_KEY is not configured')

    response = requests.post(
        getattr(settings, 'RESEND_API_URL', 'https://api.resend.com/emails'),
        headers={
            'Authorization': f'Bearer {resend_api_key}',
            'Content-Type': 'application/json',
            'Idempotency-Key': f'email-log-{email.pk}-{email.attempts}',
        },
        json={
            'from': email.from_email or settings.DEFAULT_FROM_EMAIL,
            'to': [email.to_email],
            'subject': email.subject,
            'text': email.message,
        },
        timeout=getattr(settings, 'EMAIL_TIMEOUT', 10),
    )
    if response.status_code >= 400:
        raise RuntimeError(f'Resend API {response.status_code}: {response.text[:1000]}')


def parse_sender(from_email):
    value = (from_email or settings.DEFAULT_FROM_EMAIL).strip()
    if '<' in value and '>' in value:
        name = value.split('<', 1)[0].strip().strip('"')
        address = value.split('<', 1)[1].split('>', 1)[0].strip()
        return {'name': name, 'email': address}
    return {'email': value}


def send_email_with_brevo(email):
    brevo_api_key = getattr(settings, 'BREVO_API_KEY', '')
    if not brevo_api_key:
        raise RuntimeError('BREVO_API_KEY is not configured')

    response = requests.post(
        getattr(settings, 'BREVO_API_URL', 'https://api.brevo.com/v3/smtp/email'),
        headers={
            'api-key': brevo_api_key,
            'Content-Type': 'application/json',
        },
        json={
            'sender': parse_sender(email.from_email or settings.DEFAULT_FROM_EMAIL),
            'to': [{'email': email.to_email}],
            'subject': email.subject,
            'textContent': email.message,
        },
        timeout=getattr(settings, 'EMAIL_TIMEOUT', 10),
    )
    if response.status_code >= 400:
        raise RuntimeError(f'Brevo API {response.status_code}: {response.text[:1000]}')


def send_email_with_smtp(email):
    send_mail(
        subject=email.subject,
        message=email.message,
        from_email=email.from_email or settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email.to_email],
        fail_silently=False,
    )


def send_logged_email(email):
    provider = get_email_provider()
    if provider == 'aws_ses':
        send_email_with_aws_ses(email)
        return
    if provider == 'brevo':
        send_email_with_brevo(email)
        return
    if provider == 'resend':
        send_email_with_resend(email)
        return
    send_email_with_smtp(email)


def process_pending_emails(limit=25):
    now = timezone.now()
    sending_timeout_minutes = getattr(settings, 'EMAIL_SENDING_TIMEOUT_MINUTES', 10)
    stale_sending_before = now - timezone.timedelta(minutes=sending_timeout_minutes)
    sent = 0
    failed = 0

    candidates = (
        EmailLog.objects
        .filter(
            Q(status__in=[EmailLog.Status.PENDING, EmailLog.Status.FAILED])
            | Q(status=EmailLog.Status.SENDING, updated_at__lte=stale_sending_before),
            scheduled_at__lte=now,
        )
        .filter(attempts__lt=F('max_attempts'))
        .order_by('scheduled_at', 'id')[:limit]
    )

    for email in candidates:
        with transaction.atomic():
            locked = EmailLog.objects.select_for_update().get(pk=email.pk)
            is_stale_sending = (
                locked.status == EmailLog.Status.SENDING
                and locked.updated_at <= stale_sending_before
            )
            if (
                locked.status == EmailLog.Status.SENT
                or locked.attempts >= locked.max_attempts
                or (locked.status == EmailLog.Status.SENDING and not is_stale_sending)
            ):
                continue
            locked.status = EmailLog.Status.SENDING
            locked.attempts += 1
            locked.save(update_fields=['status', 'attempts', 'updated_at'])

        try:
            send_logged_email(locked)
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


def run_task_safely(fn):
    try:
        return {'ok': True, 'result': fn()}
    except Exception as exc:
        return {
            'ok': False,
            'error': str(exc)[:2000],
            'error_type': exc.__class__.__name__,
        }


def run_scheduled_tasks():
    from apps.wallet.services import release_pending_balances
    from tasks.analytics import aggregate_daily_analytics, expire_ad_campaigns

    return {
        'emails': run_task_safely(process_pending_emails),
        'wallet_released': run_task_safely(lambda: release_pending_balances(days=7)),
        'analytics': run_task_safely(aggregate_daily_analytics),
        'ads': run_task_safely(expire_ad_campaigns),
    }
