from django.urls import reverse
from rest_framework.test import APITestCase

from apps.platform.models import PlatformSettings
from apps.users.models import CustomUser
from apps.vendors.models import VendorPlan


class PlatformSettingsApiTests(APITestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            email='platform-settings-admin@example.com',
            password='pass',
            first_name='Platform',
            last_name='Admin',
            role=CustomUser.Role.ADMIN,
            is_verified=True,
        )
        self.customer = CustomUser.objects.create_user(
            email='platform-settings-customer@example.com',
            password='pass',
            first_name='Platform',
            last_name='Customer',
            is_verified=True,
        )

    def test_public_settings_are_readable_without_auth(self):
        PlatformSettings.objects.create(
            contact_email='contact@naatalfi.com',
            phone_number='+221771234567',
            instagram_url='https://instagram.com/naatalfi',
            popular_categories=[
                {
                    'title': 'Artisanat',
                    'image': 'https://images.example.com/artisanat.jpg',
                    'query': 'artisanat',
                    'href': '/marketplace?category=artisanat',
                },
            ],
        )

        response = self.client.get(reverse('platform-public-settings'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['contact_email'], 'contact@naatalfi.com')
        self.assertEqual(response.data['instagram_url'], 'https://instagram.com/naatalfi')
        self.assertEqual(response.data['popular_categories'][0]['title'], 'Artisanat')
        self.assertEqual(response.data['commission_rate'], '8.00')

    def test_only_admin_can_update_platform_settings(self):
        self.client.force_authenticate(self.customer)
        denied = self.client.patch(reverse('platform-admin-settings'), {
            'contact_email': 'client@example.com',
        }, format='json')
        self.assertEqual(denied.status_code, 403)

        self.client.force_authenticate(self.admin)
        VendorPlan.objects.update_or_create(
            name=VendorPlan.Name.FREE,
            defaults={
                'commission_rate': '8.00',
                'monthly_price': '0.00',
            },
        )
        response = self.client.patch(reverse('platform-admin-settings'), {
            'contact_email': 'support@naatalfi.com',
            'phone_number': '+221770000000',
            'facebook_url': 'https://facebook.com/naatalfi',
            'instagram_url': 'https://instagram.com/naatalfi',
            'tiktok_url': 'https://www.tiktok.com/@naatalfi',
            'linkedin_url': 'https://linkedin.com/company/naatalfi',
            'hero_image_url': 'https://images.example.com/hero.jpg',
            'commission_rate': '9.50',
            'popular_categories': [
                {
                    'title': 'Mode',
                    'image': 'https://images.example.com/mode.jpg',
                    'query': 'mode',
                    'href': '/marketplace?category=mode',
                },
            ],
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['contact_email'], 'support@naatalfi.com')
        self.assertEqual(response.data['hero_image_url'], 'https://images.example.com/hero.jpg')
        self.assertEqual(response.data['commission_rate'], '9.50')
        self.assertEqual(response.data['popular_categories'][0]['title'], 'Mode')
        self.assertEqual(PlatformSettings.objects.count(), 1)
        self.assertEqual(str(VendorPlan.objects.get(name=VendorPlan.Name.FREE).commission_rate), '9.50')

    def test_admin_commission_rate_must_be_between_0_and_100(self):
        self.client.force_authenticate(self.admin)

        too_high = self.client.patch(reverse('platform-admin-settings'), {
            'commission_rate': '120.00',
        }, format='json')
        negative = self.client.patch(reverse('platform-admin-settings'), {
            'commission_rate': '-1.00',
        }, format='json')

        self.assertEqual(too_high.status_code, 400)
        self.assertEqual(negative.status_code, 400)
