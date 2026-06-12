from decimal import Decimal

from django.urls import reverse
from rest_framework.test import APITestCase

from apps.orders.models import Order, OrderItem, VendorOrder
from apps.products.models import Product
from apps.users.models import CustomUser
from apps.vendors.models import Vendor
from apps.wallet.models import Transaction, Wallet


class AnalyticsApiTests(APITestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            email='admin@example.com',
            password='pass',
            first_name='Admin',
            last_name='User',
            role=CustomUser.Role.ADMIN,
            is_verified=True,
        )
        self.vendor_user = CustomUser.objects.create_user(
            email='vendor@example.com',
            password='pass',
            first_name='Vendor',
            last_name='User',
            role=CustomUser.Role.VENDOR,
            is_verified=True,
        )
        self.buyer = CustomUser.objects.create_user(
            email='buyer@example.com',
            password='pass',
            first_name='Buyer',
            last_name='User',
            is_verified=True,
        )
        self.vendor = Vendor.objects.create(user=self.vendor_user, name='Teranga Shop', status=Vendor.Status.APPROVED)
        self.wallet = Wallet.objects.create(vendor=self.vendor)
        self.product = Product.objects.create(
            vendor=self.vendor,
            name='Sac cuir',
            slug='sac-cuir',
            price=Decimal('5000.00'),
            status=Product.Status.PUBLISHED,
        )
        self.order = Order.objects.create(
            buyer=self.buyer,
            status=Order.Status.PAID,
            total=Decimal('11000.00'),
            delivery_address='Dakar',
        )
        self.vendor_order = VendorOrder.objects.create(
            order=self.order,
            vendor=self.vendor,
            status=VendorOrder.Status.DELIVERED,
            subtotal=Decimal('10000.00'),
            shipping_cost=Decimal('1000.00'),
        )
        OrderItem.objects.create(
            vendor_order=self.vendor_order,
            product=self.product,
            product_name=self.product.name,
            product_slug=self.product.slug,
            unit_price=Decimal('5000.00'),
            quantity=2,
        )
        Transaction.objects.create(
            wallet=self.wallet,
            type=Transaction.Type.COMMISSION,
            amount=Decimal('500.00'),
            reference='COMMISSION-1',
        )

    def test_admin_overview_returns_business_metrics(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(reverse('admin-analytics-overview'), {'period': '30d'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['gmv'], '11000.00')
        self.assertEqual(response.data['commissions'], '500.00')
        self.assertEqual(response.data['orders_count'], 1)
        self.assertEqual(len(response.data['daily']), 30)

    def test_admin_top_vendors_returns_ranked_vendors(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(reverse('admin-analytics-vendors'), {'period': '30d'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['name'], 'Teranga Shop')
        self.assertEqual(response.data[0]['revenue'], '11000.00')

    def test_vendor_analytics_is_scoped_to_authenticated_vendor(self):
        self.client.force_authenticate(self.vendor_user)
        response = self.client.get(reverse('vendor-analytics'), {'period': '7d'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['revenue'], '11000.00')
        self.assertEqual(response.data['items_sold'], 2)
        self.assertEqual(response.data['top_products'][0]['name'], 'Sac cuir')
