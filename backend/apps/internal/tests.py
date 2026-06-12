from django.core import mail
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from unittest.mock import Mock, patch
from rest_framework.test import APITestCase

from apps.internal.models import EmailLog
from apps.internal.services import process_pending_emails, queue_email


@override_settings(
    CRON_SECRET='test-secret',
    EMAIL_PROVIDER='',
    RESEND_API_KEY='',
    AWS_SES_ACCESS_KEY_ID='',
    AWS_SES_SECRET_ACCESS_KEY='',
)
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

    @override_settings(
        EMAIL_PROVIDER='aws_ses',
        AWS_SES_ACCESS_KEY_ID='test-access-key',
        AWS_SES_SECRET_ACCESS_KEY='test-secret-key',
        AWS_SES_REGION='eu-west-1',
    )
    @patch('apps.internal.services.get_aws_ses_client')
    def test_process_pending_emails_uses_aws_ses_when_configured(self, mock_get_client):
        client = Mock()
        mock_get_client.return_value = client
        queue_email(
            subject='SES',
            message='Bonjour',
            recipient='client@example.com',
        )

        result = process_pending_emails()

        email = EmailLog.objects.get()
        self.assertEqual(result['sent'], 1)
        self.assertEqual(email.status, EmailLog.Status.SENT)
        self.assertEqual(len(mail.outbox), 0)
        client.send_email.assert_called_once()
        payload = client.send_email.call_args.kwargs
        self.assertEqual(payload['Destination']['ToAddresses'], ['client@example.com'])
        self.assertEqual(payload['Content']['Simple']['Body']['Text']['Data'], 'Bonjour')

    @override_settings(
        EMAIL_PROVIDER='aws_ses',
        AWS_SES_ACCESS_KEY_ID='test-access-key',
        AWS_SES_SECRET_ACCESS_KEY='test-secret-key',
    )
    @patch('apps.internal.services.get_aws_ses_client')
    def test_process_pending_emails_marks_failed_on_aws_ses_error(self, mock_get_client):
        client = Mock()
        client.send_email.side_effect = RuntimeError('SES sandbox recipient not verified')
        mock_get_client.return_value = client
        queue_email(
            subject='SES error',
            message='Bonjour',
            recipient='client@example.com',
        )

        result = process_pending_emails()

        email = EmailLog.objects.get()
        self.assertEqual(result['failed'], 1)
        self.assertEqual(email.status, EmailLog.Status.FAILED)
        self.assertIn('SES sandbox recipient not verified', email.last_error)

    @override_settings(RESEND_API_KEY='re_test_key')
    @patch('apps.internal.services.requests.post')
    def test_process_pending_emails_uses_resend_api_when_configured(self, mock_post):
        mock_post.return_value = Mock(status_code=200, text='{"id":"email-id"}')
        queue_email(
            subject='Resend',
            message='Bonjour',
            recipient='client@example.com',
        )

        result = process_pending_emails()

        email = EmailLog.objects.get()
        self.assertEqual(result['sent'], 1)
        self.assertEqual(email.status, EmailLog.Status.SENT)
        self.assertEqual(len(mail.outbox), 0)
        mock_post.assert_called_once()
        payload = mock_post.call_args.kwargs['json']
        self.assertEqual(payload['to'], ['client@example.com'])
        self.assertEqual(payload['text'], 'Bonjour')

    @override_settings(RESEND_API_KEY='re_test_key')
    @patch('apps.internal.services.requests.post')
    def test_process_pending_emails_marks_failed_on_resend_api_error(self, mock_post):
        mock_post.return_value = Mock(status_code=403, text='domain not verified')
        queue_email(
            subject='Resend error',
            message='Bonjour',
            recipient='client@example.com',
        )

        result = process_pending_emails()

        email = EmailLog.objects.get()
        self.assertEqual(result['failed'], 1)
        self.assertEqual(email.status, EmailLog.Status.FAILED)
        self.assertIn('Resend API 403', email.last_error)

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
