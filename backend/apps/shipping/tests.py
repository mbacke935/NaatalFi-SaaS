from decimal import Decimal

from django.test import TestCase

from apps.shipping.models import ShippingRate, ShippingZone
from apps.shipping.services import estimate_shipping_for_vendors, get_shipping_rate
from apps.users.models import CustomUser
from apps.vendors.models import Vendor


class ShippingServiceTests(TestCase):
    def setUp(self):
        user = CustomUser.objects.create_user(
            email='shipper@example.com',
            password='password123',
            first_name='Ship',
            last_name='Vendor',
            role=CustomUser.Role.VENDOR,
        )
        self.vendor = Vendor.objects.create(
            user=user,
            name='Shipping Vendor',
            status=Vendor.Status.APPROVED,
        )
        self.zone = ShippingZone.objects.create(
            vendor=self.vendor,
            name='Dakar',
            regions=['Dakar'],
        )
        ShippingRate.objects.create(
            zone=self.zone,
            price=Decimal('1000.00'),
            estimated_days=1,
            min_weight=Decimal('0.00'),
            max_weight=Decimal('5.00'),
        )
        ShippingRate.objects.create(
            zone=self.zone,
            price=Decimal('2500.00'),
            estimated_days=3,
            min_weight=Decimal('5.01'),
            max_weight=Decimal('20.00'),
        )

    def test_get_shipping_rate_uses_weight_range(self):
        light_price, light_days = get_shipping_rate(self.vendor.id, 'Dakar', weight=Decimal('2.00'))
        heavy_price, heavy_days = get_shipping_rate(self.vendor.id, 'Dakar', weight=Decimal('10.00'))

        self.assertEqual(light_price, Decimal('1000.00'))
        self.assertEqual(light_days, 1)
        self.assertEqual(heavy_price, Decimal('2500.00'))
        self.assertEqual(heavy_days, 3)

    def test_estimate_shipping_returns_vendor_mapping(self):
        result = estimate_shipping_for_vendors([self.vendor.id], 'Dakar', weight=Decimal('10.00'))

        self.assertEqual(result[self.vendor.id]['price'], '2500.00')
        self.assertEqual(result[self.vendor.id]['estimated_days'], 3)
