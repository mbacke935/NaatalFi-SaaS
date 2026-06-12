from django.core import mail
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.internal.models import EmailLog
from apps.internal.services import process_pending_emails, queue_email


@override_settings(CRON_SECRET='test-secret')
class InternalCronTests(APITestCase):
    def test_process_pending_emails_sends_and_marks_sent(self):
        queue_email(
            subject='Test',
            message='Bonjour',
            recipient='client@example.com',
        )

        result = process_pending_emails()

        email = EmailLog.objects.get()
        self.assertEqual(result['sent'], 1)
        self.assertEqual(email.status, EmailLog.Status.SENT)
        self.assertEqual(len(mail.outbox), 1)

    def test_process_pending_emails_ignores_active_sending_email(self):
        email = queue_email(
            subject='Sending',
            message='Bonjour',
            recipient='client@example.com',
        )
        EmailLog.objects.filter(pk=email.pk).update(status=EmailLog.Status.SENDING, attempts=1)

        result = process_pending_emails()

        email.refresh_from_db()
        self.assertEqual(result['sent'], 0)
        self.assertEqual(email.status, EmailLog.Status.SENDING)
        self.assertEqual(email.attempts, 1)
        self.assertEqual(len(mail.outbox), 0)

    def test_process_pending_emails_retries_stale_sending_email(self):
        email = queue_email(
            subject='Stale sending',
            message='Bonjour',
            recipient='client@example.com',
        )
        stale_time = timezone.now() - timezone.timedelta(minutes=15)
        EmailLog.objects.filter(pk=email.pk).update(
            status=EmailLog.Status.SENDING,
            attempts=1,
            updated_at=stale_time,
        )

        result = process_pending_emails()

        email.refresh_from_db()
        self.assertEqual(result['sent'], 1)
        self.assertEqual(email.status, EmailLog.Status.SENT)
        self.assertEqual(email.attempts, 2)
        self.assertEqual(len(mail.outbox), 1)

    def test_cron_requires_secret(self):
        response = self.client.post(reverse('internal-cron-run'))
        self.assertEqual(response.status_code, 403)

    def test_cron_runs_with_secret(self):
        queue_email(subject='Cron', message='Message', recipient='client@example.com')

        response = self.client.post(
            reverse('internal-cron-run'),
            HTTP_X_CRON_SECRET='test-secret',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['emails']['ok'])
        self.assertEqual(response.data['emails']['result']['sent'], 1)
