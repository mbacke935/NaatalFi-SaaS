from decimal import Decimal

from rest_framework.test import APITestCase

from apps.products.models import Product
from apps.users.models import CustomUser
from apps.vendors.models import Vendor


class AdminProductApiTests(APITestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            email='admin-products@example.com',
            password='password123',
            first_name='Admin',
            last_name='Products',
            role=CustomUser.Role.ADMIN,
            is_verified=True,
        )
        vendor_user = CustomUser.objects.create_user(
            email='product-vendor@example.com',
            password='password123',
            first_name='Product',
            last_name='Vendor',
            role=CustomUser.Role.VENDOR,
        )
        self.vendor = Vendor.objects.create(
            user=vendor_user,
            name='Product Vendor',
            status=Vendor.Status.APPROVED,
        )
        self.product = Product.objects.create(
            vendor=self.vendor,
            name='Test Product',
            price=Decimal('12000.00'),
            status=Product.Status.DRAFT,
        )
        self.client.force_authenticate(self.admin)

    def test_admin_route_is_not_captured_as_public_slug(self):
        response = self.client.get('/api/v1/products/admin/')

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)

    def test_admin_can_moderate_product_status(self):
        response = self.client.patch(
            f'/api/v1/products/admin/{self.product.id}/',
            {'status': Product.Status.PUBLISHED},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, Product.Status.PUBLISHED)
