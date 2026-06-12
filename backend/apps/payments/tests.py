import hashlib
from decimal import Decimal

from django.test import override_settings
from rest_framework.test import APITestCase

from apps.orders.models import Order
from apps.payments.models import Payment
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
