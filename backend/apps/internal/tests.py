from django.core import mail
from django.test import Client
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from unittest.mock import Mock, patch
from rest_framework.test import APITestCase

from apps.users.models import CustomUser
from apps.internal.models import EmailLog
from apps.internal.models import AdminAuditLog
from apps.internal.services import process_pending_emails, queue_email


@override_settings(
    CRON_SECRET='test-secret',
    EMAIL_PROVIDER='',
    RESEND_API_KEY='',
    BREVO_API_KEY='',
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

    @override_settings(EMAIL_PROVIDER='brevo', BREVO_API_KEY='xkeysib-test-key')
    @patch('apps.internal.services.requests.post')
    def test_process_pending_emails_uses_brevo_api_when_configured(self, mock_post):
        mock_post.return_value = Mock(status_code=201, text='{"messageId":"message-id"}')
        queue_email(
            subject='Brevo',
            message='Bonjour',
            recipient='client@example.com',
        )

        result = process_pending_emails()

        email = EmailLog.objects.get()
        self.assertEqual(result['sent'], 1)
        self.assertEqual(email.status, EmailLog.Status.SENT)
        self.assertEqual(len(mail.outbox), 0)
        mock_post.assert_called_once()
        self.assertEqual(mock_post.call_args.kwargs['headers']['api-key'], 'xkeysib-test-key')
        payload = mock_post.call_args.kwargs['json']
        self.assertEqual(payload['sender'], {'name': 'NaatalFi', 'email': 'noreply@naatalfi.com'})
        self.assertEqual(payload['to'], [{'email': 'client@example.com'}])
        self.assertEqual(payload['textContent'], 'Bonjour')

    @override_settings(EMAIL_PROVIDER='brevo', BREVO_API_KEY='xkeysib-test-key')
    @patch('apps.internal.services.requests.post')
    def test_process_pending_emails_marks_failed_on_brevo_api_error(self, mock_post):
        mock_post.return_value = Mock(status_code=401, text='invalid api key')
        queue_email(
            subject='Brevo error',
            message='Bonjour',
            recipient='client@example.com',
        )

        result = process_pending_emails()

        email = EmailLog.objects.get()
        self.assertEqual(result['failed'], 1)
        self.assertEqual(email.status, EmailLog.Status.FAILED)
        self.assertIn('Brevo API 401', email.last_error)

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

    def test_cron_rejects_invalid_secret(self):
        """Un secret incorrect (pas seulement absent) doit etre refuse."""
        response = self.client.post(
            reverse('internal-cron-run'),
            HTTP_X_CRON_SECRET='wrong-secret',
        )
        self.assertEqual(response.status_code, 403)

    def test_cron_rejects_authenticated_user_without_secret(self):
        """Un utilisateur JWT (meme admin) ne peut pas declencher le cron sans le header secret."""
        from apps.users.models import CustomUser
        admin = CustomUser.objects.create_user(
            email='cron-admin@example.com',
            password='pass',
            role=CustomUser.Role.ADMIN,
            is_verified=True,
        )
        self.client.force_authenticate(admin)

        response = self.client.post(reverse('internal-cron-run'))
        self.assertEqual(response.status_code, 403)

    @override_settings(CRON_SECRET='')
    def test_cron_disabled_when_secret_not_configured(self):
        """Sans CRON_SECRET configure cote serveur, l'endpoint est ferme (403)."""
        response = self.client.post(
            reverse('internal-cron-run'),
            HTTP_X_CRON_SECRET='',
        )
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

    # ── Couverture supplementaire (audit 2026-06-13) ────────────────────

    def test_queue_email_creates_pending_entry(self):
        email = queue_email(
            subject='Bienvenue',
            message='Bonjour et bienvenue.',
            recipient='nouveau@example.com',
        )

        self.assertEqual(email.status, EmailLog.Status.PENDING)
        self.assertEqual(email.to_email, 'nouveau@example.com')
        self.assertEqual(email.subject, 'Bienvenue')
        self.assertEqual(email.attempts, 0)
        self.assertIsNotNone(email.scheduled_at)
        self.assertIsNone(email.sent_at)

    def test_process_pending_emails_skips_email_at_max_attempts(self):
        """Un email FAILED ayant epuise ses tentatives n'est plus retraite."""
        email = queue_email(
            subject='Epuise',
            message='Bonjour',
            recipient='client@example.com',
        )
        EmailLog.objects.filter(pk=email.pk).update(
            status=EmailLog.Status.FAILED,
            attempts=3,  # max_attempts par defaut = 3
        )

        result = process_pending_emails()

        email.refresh_from_db()
        self.assertEqual(result['sent'], 0)
        self.assertEqual(result['failed'], 0)
        self.assertEqual(email.status, EmailLog.Status.FAILED)
        self.assertEqual(email.attempts, 3)
        self.assertEqual(len(mail.outbox), 0)

    def test_run_scheduled_tasks_reports_all_tasks(self):
        """run_scheduled_tasks retourne le statut des taches, toutes OK sur base vide."""
        from apps.internal.services import run_scheduled_tasks

        report = run_scheduled_tasks()

        self.assertEqual(set(report.keys()), {'emails', 'orders_expired', 'wallet_released', 'analytics', 'ads'})
        for name, outcome in report.items():
            self.assertTrue(outcome['ok'], f"Tache {name} en echec: {outcome}")

    def test_expire_ad_campaigns_expires_past_campaigns(self):
        """Une campagne ACTIVE dont end_date est passee devient EXPIRED via la tache cron."""
        from apps.ads.models import AdCampaign
        from apps.products.models import Product
        from apps.users.models import CustomUser
        from apps.vendors.models import Vendor
        from tasks.analytics import expire_ad_campaigns

        vendor_user = CustomUser.objects.create_user(
            email='ads-vendor@example.com',
            password='pass',
            role=CustomUser.Role.VENDOR,
        )
        vendor = Vendor.objects.create(
            user=vendor_user,
            name='Ads Shop',
            status=Vendor.Status.APPROVED,
        )
        product = Product.objects.create(
            vendor=vendor,
            name='Produit Ad',
            price='5000.00',
            status=Product.Status.PUBLISHED,
        )
        today = timezone.localdate()
        past = AdCampaign.objects.create(
            vendor=vendor, product=product,
            budget='5000.00',
            start_date=today - timezone.timedelta(days=10),
            end_date=today - timezone.timedelta(days=1),
            status=AdCampaign.Status.ACTIVE,
        )
        current = AdCampaign.objects.create(
            vendor=vendor, product=product,
            budget='5000.00',
            start_date=today,
            end_date=today + timezone.timedelta(days=7),
            status=AdCampaign.Status.ACTIVE,
        )

        result = expire_ad_campaigns()

        past.refresh_from_db()
        current.refresh_from_db()
        self.assertEqual(result['expired'], 1)
        self.assertEqual(past.status, AdCampaign.Status.EXPIRED)
        self.assertEqual(current.status, AdCampaign.Status.ACTIVE)


class SecurityHeadersTests(APITestCase):
    @override_settings(
        SECURITY_HEADERS_ENABLED=True,
        EXTRA_SECURITY_HEADERS={
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
            'X-Permitted-Cross-Domain-Policies': 'none',
        },
    )
    def test_extra_security_headers_are_added_to_api_responses(self):
        response = self.client.get('/api/v1/platform/public/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Cross-Origin-Opener-Policy'], 'same-origin')
        self.assertEqual(response['Permissions-Policy'], 'camera=(), microphone=(), geolocation=()')
        self.assertEqual(response['X-Permitted-Cross-Domain-Policies'], 'none')

    @override_settings(
        SECURITY_HEADERS_ENABLED=True,
        EXTRA_SECURITY_HEADERS={
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
            'X-Permitted-Cross-Domain-Policies': 'none',
        },
    )
    def test_extra_security_headers_do_not_break_django_admin_login(self):
        response = Client().get('/admin/login/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Cross-Origin-Opener-Policy'], 'same-origin')
        self.assertIn('text/html', response['Content-Type'])


class AdminAuditLogApiTests(APITestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            email='audit-admin@example.com',
            password='pass',
            role=CustomUser.Role.ADMIN,
            is_verified=True,
        )
        self.customer = CustomUser.objects.create_user(
            email='audit-customer@example.com',
            password='pass',
            is_verified=True,
        )
        AdminAuditLog.objects.create(
            actor=self.admin,
            action=AdminAuditLog.Action.USER_UPDATED,
            target_type='CustomUser',
            target_id=str(self.customer.id),
            target_repr=self.customer.email,
        )

    def test_only_admin_can_read_audit_logs(self):
        self.client.force_authenticate(self.customer)
        denied = self.client.get(reverse('admin-audit-log-list'))
        self.assertEqual(denied.status_code, 403)

        self.client.force_authenticate(self.admin)
        response = self.client.get(reverse('admin-audit-log-list'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['action'], AdminAuditLog.Action.USER_UPDATED)
        self.assertEqual(response.data[0]['actor_email'], self.admin.email)

    def test_only_admin_can_read_alert_summary(self):
        from apps.disputes.models import Dispute
        from apps.orders.models import Order, VendorOrder
        from apps.payments.models import Payment
        from apps.vendors.models import Vendor
        from apps.wallet.models import PayoutRequest, Wallet

        vendor_user = CustomUser.objects.create_user(
            email='alert-vendor@example.com',
            password='pass',
            role=CustomUser.Role.VENDOR,
        )
        vendor = Vendor.objects.create(user=vendor_user, name='Alert Shop', status=Vendor.Status.PENDING)
        order = Order.objects.create(buyer=self.customer, delivery_address='Dakar', total='1000.00')
        vendor_order = VendorOrder.objects.create(order=order, vendor=vendor, subtotal='1000.00')
        wallet = Wallet.objects.create(vendor=vendor)
        PayoutRequest.objects.create(wallet=wallet, amount='1000.00')
        Dispute.objects.create(
            order=order,
            vendor_order=vendor_order,
            initiator=self.customer,
            reason='Livraison',
        )
        Payment.objects.create(order=order, buyer=self.customer, amount='1000.00', status=Payment.Status.FAILED)
        EmailLog.objects.create(to_email='x@example.com', subject='Erreur', message='x', status=EmailLog.Status.FAILED)

        self.client.force_authenticate(self.customer)
        denied = self.client.get(reverse('admin-alert-summary'))
        self.assertEqual(denied.status_code, 403)

        self.client.force_authenticate(self.admin)
        response = self.client.get(reverse('admin-alert-summary'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['pending_vendors'], 1)
        self.assertEqual(response.data['pending_payouts'], 1)
        self.assertEqual(response.data['open_disputes'], 1)
        self.assertEqual(response.data['failed_payments'], 1)
        self.assertEqual(response.data['failed_emails'], 1)

    def test_only_admin_can_read_email_logs(self):
        EmailLog.objects.create(
            to_email='failed@example.com',
            subject='Erreur',
            message='Bonjour',
            status=EmailLog.Status.FAILED,
            attempts=3,
            last_error='Brevo API 401',
        )
        EmailLog.objects.create(
            to_email='sent@example.com',
            subject='Envoye',
            message='Bonjour',
            status=EmailLog.Status.SENT,
        )

        self.client.force_authenticate(self.customer)
        denied = self.client.get(reverse('admin-email-log-list'))
        self.assertEqual(denied.status_code, 403)

        self.client.force_authenticate(self.admin)
        response = self.client.get(reverse('admin-email-log-list'), {'status': 'FAILED'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['to_email'], 'failed@example.com')
        self.assertEqual(response.data[0]['last_error'], 'Brevo API 401')

    def test_admin_can_retry_failed_email(self):
        email = EmailLog.objects.create(
            to_email='failed@example.com',
            subject='Verification',
            message='Bonjour',
            status=EmailLog.Status.FAILED,
            attempts=3,
            last_error='timed out',
        )

        self.client.force_authenticate(self.admin)
        response = self.client.post(reverse('admin-email-log-retry', args=[email.id]))

        self.assertEqual(response.status_code, 200)
        email.refresh_from_db()
        self.assertEqual(email.status, EmailLog.Status.PENDING)
        self.assertEqual(email.attempts, 0)
        self.assertEqual(email.last_error, '')
        self.assertIsNone(email.sent_at)
        self.assertTrue(AdminAuditLog.objects.filter(
            action=AdminAuditLog.Action.EMAIL_RETRY_REQUESTED,
            target_type='EmailLog',
            target_id=str(email.id),
        ).exists())

    def test_admin_cannot_retry_sent_email(self):
        email = EmailLog.objects.create(
            to_email='sent@example.com',
            subject='Envoye',
            message='Bonjour',
            status=EmailLog.Status.SENT,
            sent_at=timezone.now(),
        )

        self.client.force_authenticate(self.admin)
        response = self.client.post(reverse('admin-email-log-retry', args=[email.id]))

        self.assertEqual(response.status_code, 400)
        email.refresh_from_db()
        self.assertEqual(email.status, EmailLog.Status.SENT)
