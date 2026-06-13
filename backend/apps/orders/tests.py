from decimal import Decimal
from unittest.mock import patch

from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.orders.models import Order, OrderItem, VendorOrder
from apps.orders.services import expire_unpaid_guest_orders
from apps.payments.models import Payment
from apps.products.models import Product, ProductVariant
from apps.users.models import CustomUser
from apps.vendors.models import Vendor, VendorPlan
from apps.wallet.models import Transaction, Wallet


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
            patch('apps.payments.views.send_payment_confirmation_email', return_value=None),
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
        # 20000 * 8% commission = 1600 → net = 18400 (MVP: 8% flat)
        self.assertEqual(wallet.pending_balance, Decimal('18400.00'))
        self.assertEqual(Transaction.objects.filter(type=Transaction.Type.SALE).count(), 1)
        self.assertEqual(Transaction.objects.filter(type=Transaction.Type.COMMISSION).count(), 1)

        with (
            patch('apps.payments.views.verify_webhook_signature', return_value=True),
            patch('apps.payments.views.send_payment_confirmation_email', return_value=None),
        ):
            with self.captureOnCommitCallbacks(execute=True):
                self.client.post(reverse('payment-webhook'), {
                    'ref_command': payment.reference,
                    'status': 'PAID',
                }, format='json')

        wallet.refresh_from_db()
        # Idempotence : deuxième webhook, le solde reste inchangé à 18400
        self.assertEqual(wallet.pending_balance, Decimal('18400.00'))
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

    def test_cart_validation_rejects_variant_from_another_product(self):
        other_product = Product.objects.create(
            vendor=self.vendor,
            name='Sac de plage',
            price=Decimal('8000.00'),
            status=Product.Status.PUBLISHED,
        )
        other_variant = ProductVariant.objects.create(
            product=other_product,
            name='Couleur',
            value='Bleu',
            stock=5,
        )

        response = self.client.post(reverse('cart-validate'), {
            'items': [{
                'product_id': self.product.id,
                'variant_id': other_variant.id,
                'quantity': 1,
            }],
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['valid'])
        self.assertEqual(response.data['errors'][0]['error'], 'Variante incompatible avec ce produit.')

    def test_guest_cannot_order_product_from_unapproved_vendor(self):
        pending_user = CustomUser.objects.create_user(
            email='pending-vendor@example.com',
            password='pass',
            role=CustomUser.Role.VENDOR,
            is_verified=True,
        )
        pending_vendor = Vendor.objects.create(
            user=pending_user,
            plan=self.plan,
            name='Pending Shop',
            status=Vendor.Status.PENDING,
        )
        pending_product = Product.objects.create(
            vendor=pending_vendor,
            name='Produit non approuve',
            price=Decimal('12000.00'),
            status=Product.Status.PUBLISHED,
        )

        response = self.client.post(reverse('order-create'), {
            'guest_name': 'Client Invite',
            'guest_email': 'guest-blocked@example.com',
            'guest_phone': '+221770000002',
            'delivery_address': 'Medina, Dakar',
            'region': 'Dakar',
            'items': [{
                'product_id': pending_product.id,
                'quantity': 1,
            }],
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('indisponible', response.data['error'])

    def test_guest_can_create_order_and_read_it_with_token(self):
        order_response = self.client.post(reverse('order-create'), {
            'guest_name': 'Client Invite',
            'guest_email': 'guest-checkout@example.com',
            'guest_phone': '+221770000000',
            'delivery_address': 'Ouakam, Dakar',
            'region': 'Dakar',
            'items': [{
                'product_id': self.product.id,
                'variant_id': self.variant.id,
                'quantity': 1,
            }],
        }, format='json')

        self.assertEqual(order_response.status_code, 201)
        order = Order.objects.get(pk=order_response.data['id'])
        self.assertIsNone(order.buyer)
        self.assertEqual(order.guest_email, 'guest-checkout@example.com')
        self.assertTrue(order_response.data['guest_access_token'])

        detail_response = self.client.get(
            reverse('guest-order-detail', args=[order.id]),
            HTTP_X_GUEST_TOKEN=order_response.data['guest_access_token'],
        )
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.data['buyer_email'], 'guest-checkout@example.com')

        forbidden_response = self.client.get(
            reverse('guest-order-detail', args=[order.id]),
            {'token': 'bad-token'},
        )
        self.assertEqual(forbidden_response.status_code, 404)

    def test_order_create_merges_duplicate_cart_lines(self):
        order_response = self.client.post(reverse('order-create'), {
            'guest_name': 'Client Invite',
            'guest_email': 'guest-duplicates@example.com',
            'guest_phone': '+221770000006',
            'delivery_address': 'Ouakam, Dakar',
            'region': 'Dakar',
            'items': [
                {
                    'product_id': self.product.id,
                    'variant_id': self.variant.id,
                    'quantity': 1,
                },
                {
                    'product_id': self.product.id,
                    'variant_id': self.variant.id,
                    'quantity': 2,
                },
            ],
        }, format='json')

        self.assertEqual(order_response.status_code, 201)
        order = Order.objects.get(pk=order_response.data['id'])
        item = OrderItem.objects.get(vendor_order__order=order)
        self.assertEqual(item.quantity, 3)
        self.assertEqual(order.total, Decimal('30000.00'))
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 2)

    def test_guest_order_requires_contact_information(self):
        response = self.client.post(reverse('order-create'), {
            'delivery_address': 'Ouakam, Dakar',
            'region': 'Dakar',
            'items': [{
                'product_id': self.product.id,
                'variant_id': self.variant.id,
                'quantity': 1,
            }],
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['missing'], ['guest_name', 'guest_email', 'guest_phone'])

    def test_vendor_order_list_exposes_guest_contact_information(self):
        order_response = self.client.post(reverse('order-create'), {
            'guest_name': 'Client Invite',
            'guest_email': 'guest-dashboard@example.com',
            'guest_phone': '+221770000003',
            'delivery_address': 'Almadies, Dakar',
            'region': 'Dakar',
            'items': [{
                'product_id': self.product.id,
                'variant_id': self.variant.id,
                'quantity': 1,
            }],
        }, format='json')
        self.assertEqual(order_response.status_code, 201)

        self.client.force_authenticate(self.vendor_user)
        response = self.client.get(reverse('vendor-order-list'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['buyer_name'], 'Client Invite')
        self.assertEqual(response.data[0]['buyer_email'], 'guest-dashboard@example.com')
        self.assertEqual(response.data[0]['buyer_phone'], '+221770000003')

    def test_expire_unpaid_guest_orders_cancels_order_and_restores_stock(self):
        order_response = self.client.post(reverse('order-create'), {
            'guest_name': 'Client Invite',
            'guest_email': 'guest-expire@example.com',
            'guest_phone': '+221770000004',
            'delivery_address': 'Liberte 6, Dakar',
            'region': 'Dakar',
            'items': [{
                'product_id': self.product.id,
                'variant_id': self.variant.id,
                'quantity': 2,
            }],
        }, format='json')
        self.assertEqual(order_response.status_code, 201)
        order = Order.objects.get(pk=order_response.data['id'])
        Order.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timezone.timedelta(minutes=90)
        )

        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 3)

        expired = expire_unpaid_guest_orders(minutes=60)

        self.assertEqual(expired, 1)
        order.refresh_from_db()
        self.variant.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CANCELLED)
        self.assertEqual(order.vendor_orders.first().status, VendorOrder.Status.CANCELLED)
        self.assertEqual(self.variant.stock, 5)

    def test_expire_unpaid_guest_orders_keeps_paid_order_and_stock(self):
        order_response = self.client.post(reverse('order-create'), {
            'guest_name': 'Client Invite',
            'guest_email': 'guest-paid@example.com',
            'guest_phone': '+221770000005',
            'delivery_address': 'Mermoz, Dakar',
            'region': 'Dakar',
            'items': [{
                'product_id': self.product.id,
                'variant_id': self.variant.id,
                'quantity': 1,
            }],
        }, format='json')
        self.assertEqual(order_response.status_code, 201)
        order = Order.objects.get(pk=order_response.data['id'])
        Order.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timezone.timedelta(minutes=90)
        )
        Payment.objects.create(
            order=order,
            buyer=None,
            amount=order.total,
            status=Payment.Status.PAID,
            provider=Payment.Provider.WAVE,
        )

        expired = expire_unpaid_guest_orders(minutes=60)

        self.assertEqual(expired, 0)
        order.refresh_from_db()
        self.variant.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PENDING)
        self.assertEqual(self.variant.stock, 4)


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
