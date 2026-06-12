from decimal import Decimal
from unittest.mock import patch

from django.urls import reverse
from rest_framework.test import APITestCase

from apps.orders.models import Order, OrderItem, VendorOrder
from apps.payments.models import Payment
from apps.products.models import Product, ProductVariant
from apps.users.models import CustomUser
from apps.vendors.models import Vendor, VendorPlan
from apps.wallet.models import Transaction, Wallet
from apps.wallet.services import credit_wallet_from_order


class OrderPaymentWalletFlowTests(APITestCase):
    def setUp(self):
        self.buyer = CustomUser.objects.create_user(
            email='buyer-flow@example.com',
            password='pass',
            first_name='Buyer',
            last_name='Flow',
            is_verified=True,
        )
        self.vendor_user = CustomUser.objects.create_user(
            email='vendor-flow@example.com',
            password='pass',
            first_name='Vendor',
            last_name='Flow',
            role=CustomUser.Role.VENDOR,
            is_verified=True,
        )
        self.plan, _ = VendorPlan.objects.get_or_create(
            name=VendorPlan.Name.FREE,
            defaults={
                'commission_rate': Decimal('10.00'),
                'monthly_price': Decimal('0.00'),
            },
        )
        self.vendor = Vendor.objects.create(
            user=self.vendor_user,
            plan=self.plan,
            name='Flow Shop',
            status=Vendor.Status.APPROVED,
        )
        self.product = Product.objects.create(
            vendor=self.vendor,
            name='Panier tresse',
            price=Decimal('10000.00'),
            status=Product.Status.PUBLISHED,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            name='Taille',
            value='M',
            stock=5,
        )

    def test_checkout_payment_webhook_credits_vendor_wallet_once(self):
        self.client.force_authenticate(self.buyer)
        order_response = self.client.post(reverse('order-create'), {
            'delivery_address': 'Plateau, Dakar',
            'region': 'Dakar',
            'items': [{
                'product_id': self.product.id,
                'variant_id': self.variant.id,
                'quantity': 2,
            }],
        }, format='json')

        self.assertEqual(order_response.status_code, 201)
        order = Order.objects.get(pk=order_response.data['id'])
        self.assertEqual(order.vendor_orders.count(), 1)
        self.assertEqual(order.total, Decimal('20000.00'))

        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 3)

        payment = Payment.objects.create(
            order=order,
            buyer=self.buyer,
            amount=order.total,
            provider=Payment.Provider.PAYTECH,
        )

        with (
            patch('apps.payments.views.verify_webhook_signature', return_value=True),
            patch('apps.payments.views.credit_vendor_wallets_task.delay', side_effect=lambda order_id: credit_wallet_from_order(Order.objects.get(pk=order_id))),
            patch('apps.payments.views.send_payment_confirmation_email.delay', return_value=None),
        ):
            with self.captureOnCommitCallbacks(execute=True):
                webhook_response = self.client.post(reverse('payment-webhook'), {
                    'ref_command': payment.reference,
                    'status': 'PAID',
                    'token': 'paytech-token-1',
                }, format='json')

        self.assertEqual(webhook_response.status_code, 200)
        order.refresh_from_db()
        payment.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PAID)
        self.assertEqual(payment.status, Payment.Status.PAID)

        wallet = Wallet.objects.get(vendor=self.vendor)
        self.assertEqual(wallet.pending_balance, Decimal('18000.00'))
        self.assertEqual(Transaction.objects.filter(type=Transaction.Type.SALE).count(), 1)
        self.assertEqual(Transaction.objects.filter(type=Transaction.Type.COMMISSION).count(), 1)

        with (
            patch('apps.payments.views.verify_webhook_signature', return_value=True),
            patch('apps.payments.views.credit_vendor_wallets_task.delay', side_effect=lambda order_id: credit_wallet_from_order(Order.objects.get(pk=order_id))),
            patch('apps.payments.views.send_payment_confirmation_email.delay', return_value=None),
        ):
            with self.captureOnCommitCallbacks(execute=True):
                self.client.post(reverse('payment-webhook'), {
                    'ref_command': payment.reference,
                    'status': 'PAID',
                }, format='json')

        wallet.refresh_from_db()
        self.assertEqual(wallet.pending_balance, Decimal('18000.00'))
        self.assertEqual(Transaction.objects.filter(type=Transaction.Type.SALE).count(), 1)

    def test_cart_validation_rejects_insufficient_stock(self):
        response = self.client.post(reverse('cart-validate'), {
            'items': [{
                'product_id': self.product.id,
                'variant_id': self.variant.id,
                'quantity': 99,
            }],
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['valid'])


class OrderPermissionTests(APITestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            email='admin-orders@example.com',
            password='pass',
            first_name='Admin',
            last_name='Orders',
            role=CustomUser.Role.ADMIN,
            is_verified=True,
        )
        self.customer = CustomUser.objects.create_user(
            email='customer-orders@example.com',
            password='pass',
            first_name='Customer',
            last_name='Orders',
            is_verified=True,
        )
        self.other = CustomUser.objects.create_user(
            email='other-orders@example.com',
            password='pass',
            first_name='Other',
            last_name='Orders',
            is_verified=True,
        )
        self.order = Order.objects.create(
            buyer=self.customer,
            status=Order.Status.PENDING,
            total=Decimal('5000.00'),
            delivery_address='Dakar',
        )

    def test_customer_cannot_access_other_customer_order(self):
        self.client.force_authenticate(self.other)
        response = self.client.get(reverse('order-detail', args=[self.order.id]))
        self.assertEqual(response.status_code, 404)

    def test_customer_cannot_access_admin_orders(self):
        self.client.force_authenticate(self.customer)
        response = self.client.get(reverse('admin-order-list'))
        self.assertEqual(response.status_code, 403)

    def test_admin_can_access_admin_orders(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(reverse('admin-order-list'))
        self.assertEqual(response.status_code, 200)
