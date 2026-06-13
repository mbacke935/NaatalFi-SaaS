import hashlib
from decimal import Decimal
from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
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
