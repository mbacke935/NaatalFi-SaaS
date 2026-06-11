from decimal import Decimal

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
