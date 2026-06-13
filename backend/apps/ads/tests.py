from datetime import timedelta
from decimal import Decimal

from django.utils import timezone
from rest_framework.test import APITestCase

from apps.ads.models import AdCampaign
from apps.products.models import Product
from apps.users.models import CustomUser
from apps.vendors.models import Vendor
from apps.wallet.models import Transaction, Wallet


class AdsApiTests(APITestCase):
    def setUp(self):
        self.vendor_user = CustomUser.objects.create_user(
            email='vendor@example.com',
            password='pass12345',
            first_name='Vendor',
            last_name='One',
            role=CustomUser.Role.VENDOR,
            is_verified=True,
        )
        self.vendor = Vendor.objects.create(
            user=self.vendor_user,
            name='Boutique Ads',
            status=Vendor.Status.APPROVED,
        )
        self.product = Product.objects.create(
            vendor=self.vendor,
            name='Produit Sponsor',
            price='10000.00',
            status=Product.Status.PUBLISHED,
        )
        self.wallet = Wallet.objects.create(
            vendor=self.vendor,
            available_balance='20000.00',
        )

    def test_vendor_can_create_campaign_and_wallet_is_debited(self):
        self.client.force_authenticate(self.vendor_user)
        today = timezone.localdate()

        response = self.client.post('/api/v1/vendors/me/ads/', {
            'product_id': self.product.id,
            'budget': '5000.00',
            'cost_per_click': '50.00',
            'start_date': today.isoformat(),
            'end_date': (today + timedelta(days=7)).isoformat(),
        })

        self.assertEqual(response.status_code, 201)
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.available_balance, Decimal('15000.00'))
        self.assertEqual(AdCampaign.objects.count(), 1)
        self.assertTrue(Transaction.objects.filter(type=Transaction.Type.AD_SPEND).exists())

    def test_campaign_requires_available_wallet_balance(self):
        self.client.force_authenticate(self.vendor_user)
        today = timezone.localdate()

        response = self.client.post('/api/v1/vendors/me/ads/', {
            'product_id': self.product.id,
            'budget': '50000.00',
            'cost_per_click': '50.00',
            'start_date': today.isoformat(),
            'end_date': (today + timedelta(days=7)).isoformat(),
        })

        self.assertEqual(response.status_code, 400)
        self.assertEqual(AdCampaign.objects.count(), 0)

    def test_active_campaign_is_returned_as_sponsored_product(self):
        today = timezone.localdate()
        campaign = AdCampaign.objects.create(
            vendor=self.vendor,
            product=self.product,
            budget='5000.00',
            cost_per_click='50.00',
            start_date=today,
            end_date=today + timedelta(days=7),
            status=AdCampaign.Status.ACTIVE,
        )

        response = self.client.get('/api/v1/ads/sponsored/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['id'], self.product.id)
        self.assertTrue(response.data[0]['is_sponsored'])
        self.assertEqual(response.data[0]['ad_campaign_id'], campaign.id)

    def test_suspended_vendor_campaign_is_not_returned_as_sponsored_product(self):
        today = timezone.localdate()
        campaign = AdCampaign.objects.create(
            vendor=self.vendor,
            product=self.product,
            budget='5000.00',
            cost_per_click='50.00',
            start_date=today,
            end_date=today + timedelta(days=7),
            status=AdCampaign.Status.ACTIVE,
        )
        self.vendor.status = Vendor.Status.SUSPENDED
        self.vendor.save(update_fields=['status'])

        response = self.client.get('/api/v1/ads/sponsored/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])
        campaign.refresh_from_db()
        self.assertEqual(campaign.impressions, 0)
