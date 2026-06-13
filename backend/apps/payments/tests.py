import hashlib
from decimal import Decimal
from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.orders.models import Order
from apps.payments.models import Payment
from apps.payments.services import PayTechError, request_paytech_payment, request_wave_payment
from apps.users.models import CustomUser


class AdminPaymentApiTests(APITestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            email='admin-payments@example.com',
            password='password123',
            first_name='Admin',
            last_name='Payments',
            role=CustomUser.Role.ADMIN,
            is_verified=True,
        )
        self.buyer = CustomUser.objects.create_user(
            email='payment-buyer@example.com',
            password='password123',
            first_name='Payment',
            last_name='Buyer',
        )
        self.order = Order.objects.create(
            buyer=self.buyer,
            status=Order.Status.PAID,
            total=Decimal('15000.00'),
            delivery_address='Dakar',
        )
        self.payment = Payment.objects.create(
            order=self.order,
            buyer=self.buyer,
            amount=Decimal('15000.00'),
            status=Payment.Status.PAID,
            provider_reference='PAYTECH-123',
            raw_webhook={'type_event': 'sale_complete'},
        )
        self.client.force_authenticate(self.admin)

    def test_admin_payment_list_exposes_webhook_status(self):
        response = self.client.get('/api/v1/payments/admin/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['reference'], self.payment.reference)
        self.assertEqual(response.data[0]['buyer_email'], self.buyer.email)
        self.assertTrue(response.data[0]['has_webhook'])


class GuestPaymentApiTests(APITestCase):
    def setUp(self):
        self.order = Order.objects.create(
            buyer=None,
            guest_name='Client Invite',
            guest_email='guest-payment@example.com',
            guest_phone='+221770000001',
            status=Order.Status.PENDING,
            total=Decimal('7500.00'),
            delivery_address='Dakar',
        )

    def test_guest_payment_initiation_requires_order_token(self):
        response = self.client.post(reverse('payment-initiate'), {
            'order_id': self.order.id,
            'provider': Payment.Provider.PAYTECH,
        }, format='json')

        self.assertEqual(response.status_code, 403)

    def test_guest_can_initiate_payment_with_order_token(self):
        def fake_paytech(payment, request):
            payment.payment_url = 'https://paytech.sn/pay/test'
            payment.save(update_fields=['payment_url', 'updated_at'])
            return payment

        with patch('apps.payments.views.request_paytech_payment', side_effect=fake_paytech):
            response = self.client.post(reverse('payment-initiate'), {
                'order_id': self.order.id,
                'provider': Payment.Provider.PAYTECH,
                'access_token': str(self.order.guest_access_token),
            }, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['payment_url'], 'https://paytech.sn/pay/test')
        payment = Payment.objects.get(reference=response.data['reference'])
        self.assertIsNone(payment.buyer)

    def test_guest_payment_status_requires_order_token(self):
        payment = Payment.objects.create(
            order=self.order,
            buyer=None,
            amount=self.order.total,
            provider=Payment.Provider.PAYTECH,
        )

        blocked = self.client.get(reverse('payment-status', args=[payment.reference]))
        self.assertEqual(blocked.status_code, 403)

        allowed = self.client.get(
            reverse('payment-status', args=[payment.reference]),
            {'token': str(self.order.guest_access_token)},
        )
        self.assertEqual(allowed.status_code, 200)
        self.assertEqual(allowed.data['reference'], str(payment.reference))

    def test_guest_can_initiate_wave_payment_with_order_token(self):
        def fake_wave(payment):
            payment.payment_url = 'https://pay.wave.com/c/cos-test'
            payment.provider_reference = 'cos-test'
            payment.save(update_fields=['payment_url', 'provider_reference', 'updated_at'])
            return payment

        with patch('apps.payments.views.request_wave_payment', side_effect=fake_wave):
            response = self.client.post(reverse('payment-initiate'), {
                'order_id': self.order.id,
                'provider': Payment.Provider.WAVE,
                'access_token': str(self.order.guest_access_token),
            }, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['provider'], Payment.Provider.WAVE)
        self.assertEqual(response.data['payment_url'], 'https://pay.wave.com/c/cos-test')


@override_settings(
    PAYTECH_API_KEY='testkey',
    PAYTECH_API_SECRET='testsecret',
    PAYTECH_BASE_URL='https://paytech.example.test',
    PAYTECH_ENV='test',
    FRONTEND_URL='https://naatalfi.test',
    BACKEND_URL='https://api.naatalfi.test',
)
class PayTechPaymentRequestTests(APITestCase):
    def setUp(self):
        self.buyer = CustomUser.objects.create_user(
            email='paytech-buyer@example.com',
            password='password123',
            first_name='PayTech',
            last_name='Buyer',
        )
        self.order = Order.objects.create(
            buyer=self.buyer,
            status=Order.Status.PENDING,
            total=Decimal('5000.00'),
            delivery_address='Dakar',
        )
        self.payment = Payment.objects.create(
            order=self.order,
            buyer=self.buyer,
            amount=self.order.total,
        )

    @patch('apps.payments.services.requests.post')
    def test_paytech_redirect_url_camel_case_is_accepted(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            'success': 1,
            'token': 'paytech-token',
            'redirectUrl': 'https://paytech.sn/payment/checkout/paytech-token',
        }

        payment = request_paytech_payment(self.payment, request=None)

        self.assertEqual(payment.payment_url, 'https://paytech.sn/payment/checkout/paytech-token')
        self.assertEqual(payment.provider_reference, 'paytech-token')

    @patch('apps.payments.services.requests.post')
    def test_paytech_nested_redirect_url_is_accepted(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            'success': 1,
            'data': {
                'token': 'nested-token',
                'redirect_url': 'https://paytech.sn/payment/checkout/nested-token',
            },
        }

        payment = request_paytech_payment(self.payment, request=None)

        self.assertEqual(payment.payment_url, 'https://paytech.sn/payment/checkout/nested-token')
        self.assertEqual(payment.provider_reference, 'nested-token')

    @patch('apps.payments.services.requests.post')
    def test_paytech_response_is_saved_when_url_is_missing(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {'success': 1, 'message': 'accepted without url'}

        with self.assertRaises(PayTechError):
            request_paytech_payment(self.payment, request=None)

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.raw_response, {'success': 1, 'message': 'accepted without url'})

    @patch('apps.payments.services.requests.post')
    def test_paytech_negative_success_is_rejected_with_provider_message(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            'success': -1,
            'error': ['Compte PayTech non active'],
        }

        with self.assertRaisesMessage(PayTechError, 'Compte PayTech non active'):
            request_paytech_payment(self.payment, request=None)

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.raw_response['success'], -1)


@override_settings(
    WAVE_BUSINESS_PAYMENT_URL='https://pay.wave.com/m/naatalfi',
    WAVE_BUSINESS_ACCOUNT_NAME='NaatalFi',
    WAVE_BUSINESS_PHONE='+221770000000',
    FRONTEND_URL='https://naatalfi.test',
    BACKEND_URL='https://api.naatalfi.test',
)
class WaveBusinessPaymentTests(APITestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            email='wave-admin@example.com',
            password='password123',
            first_name='Wave',
            last_name='Admin',
            role=CustomUser.Role.ADMIN,
            is_verified=True,
        )
        self.buyer = CustomUser.objects.create_user(
            email='wave-buyer@example.com',
            password='password123',
            first_name='Wave',
            last_name='Buyer',
        )
        self.order = Order.objects.create(
            buyer=self.buyer,
            status=Order.Status.PENDING,
            total=Decimal('5000.00'),
            delivery_address='Dakar',
        )
        self.payment = Payment.objects.create(
            order=self.order,
            buyer=self.buyer,
            amount=self.order.total,
            provider=Payment.Provider.WAVE,
        )

    def test_wave_business_payment_uses_configured_payment_link(self):
        payment = request_wave_payment(self.payment)

        self.assertEqual(payment.payment_url, 'https://pay.wave.com/m/naatalfi')
        self.assertEqual(payment.provider_reference, self.payment.reference)
        self.assertEqual(payment.raw_response['type'], 'wave_business_manual')

    def test_admin_can_mark_wave_business_payment_paid(self):
        self.payment.provider_reference = self.payment.reference
        self.payment.save(update_fields=['provider_reference'])
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            reverse('admin-payment-mark-paid', args=[self.payment.id]),
            {'provider_reference': 'wave-business-notification-1'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.payment.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.Status.PAID)
        self.assertEqual(self.payment.provider_reference, 'wave-business-notification-1')
        self.assertTrue(self.payment.raw_webhook['manual_admin_confirmation'])
        self.assertEqual(self.order.status, Order.Status.PAID)


@override_settings(
    PAYTECH_API_KEY='testkey',
    PAYTECH_API_SECRET='testsecret',
    PAYTECH_WEBHOOK_SECRET='',
)
class PayTechWebhookSignatureTests(APITestCase):
    """Vérifie le durcissement de la signature webhook PayTech (IPN natif)."""

    def setUp(self):
        self.buyer = CustomUser.objects.create_user(
            email='webhook-buyer@example.com',
            password='password123',
            first_name='Webhook',
            last_name='Buyer',
        )
        self.order = Order.objects.create(
            buyer=self.buyer,
            status=Order.Status.PENDING,
            total=Decimal('5000.00'),
            delivery_address='Dakar',
        )
        self.payment = Payment.objects.create(
            order=self.order,
            buyer=self.buyer,
            amount=Decimal('5000.00'),
        )

    def _payload(self, **extra):
        data = {'ref_command': self.payment.reference, 'status': 'SUCCESS'}
        data.update(extra)
        return data

    def test_valid_native_signature_is_accepted(self):
        payload = self._payload(
            api_key_sha256=hashlib.sha256(b'testkey').hexdigest(),
            api_secret_sha256=hashlib.sha256(b'testsecret').hexdigest(),
        )
        response = self.client.post('/api/v1/payments/webhook/', payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['received'])

    def test_invalid_native_signature_is_rejected(self):
        payload = self._payload(api_key_sha256='wrong', api_secret_sha256='wrong')
        response = self.client.post('/api/v1/payments/webhook/', payload, format='json')
        self.assertEqual(response.status_code, 403)

    def test_unsigned_webhook_is_rejected_in_production(self):
        with override_settings(DEBUG=False):
            response = self.client.post('/api/v1/payments/webhook/', self._payload(), format='json')
        self.assertEqual(response.status_code, 403)

    def test_unsigned_webhook_is_allowed_in_debug(self):
        with override_settings(DEBUG=True):
            response = self.client.post('/api/v1/payments/webhook/', self._payload(), format='json')
        self.assertEqual(response.status_code, 200)
