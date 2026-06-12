from decimal import Decimal

from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.categories.models import Category
from apps.products.models import Product
from apps.users.models import CustomUser
from apps.vendors.models import Vendor


class MarketplaceApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.vendor_user = CustomUser.objects.create_user(
            email='market-vendor@example.com',
            password='pass',
            first_name='Market',
            last_name='Vendor',
            role=CustomUser.Role.VENDOR,
            is_verified=True,
        )
        self.vendor = Vendor.objects.create(
            user=self.vendor_user,
            name='Market Shop',
            status=Vendor.Status.APPROVED,
        )
        self.category = Category.objects.create(name='Mode')
        self.product = Product.objects.create(
            vendor=self.vendor,
            category=self.category,
            name='Boubou brode',
            description='Tenue traditionnelle',
            price=Decimal('25000.00'),
            status=Product.Status.PUBLISHED,
            trust_score=4.5,
        )
        Product.objects.create(
            vendor=self.vendor,
            category=self.category,
            name='Produit brouillon',
            price=Decimal('1000.00'),
            status=Product.Status.DRAFT,
        )

    def test_marketplace_only_exposes_published_products(self):
        response = self.client.get(reverse('mp-products'), {'page_size': 10})
        self.assertEqual(response.status_code, 200)
        names = [item['name'] for item in response.data['results']]
        self.assertIn('Boubou brode', names)
        self.assertNotIn('Produit brouillon', names)

    def test_search_requires_two_characters_and_finds_product(self):
        short_response = self.client.get(reverse('mp-search'), {'q': 'b'})
        self.assertEqual(short_response.status_code, 200)
        self.assertEqual(short_response.data['results'], [])

        response = self.client.get(reverse('mp-search'), {'q': 'boubou'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['results'][0]['name'], 'Boubou brode')

    def test_vendor_detail_only_approved_vendor(self):
        response = self.client.get(reverse('mp-vendor-detail', args=[self.vendor.slug]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'Market Shop')

        self.vendor.status = Vendor.Status.SUSPENDED
        self.vendor.save(update_fields=['status'])
        cache.clear()
        response = self.client.get(reverse('mp-vendor-detail', args=[self.vendor.slug]))
        self.assertEqual(response.status_code, 404)
