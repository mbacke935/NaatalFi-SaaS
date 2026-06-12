from django.core import mail
from django.test import override_settings
from django.urls import reverse
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
