from django.urls import reverse
from unittest.mock import patch

from rest_framework.test import APITestCase

from apps.users.models import CustomUser
from apps.vendors.models import Vendor, VendorPlan


class VendorApiTests(APITestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            email='admin-vendors@example.com',
            password='pass',
            first_name='Admin',
            last_name='Vendor',
            role=CustomUser.Role.ADMIN,
            is_verified=True,
        )
        self.vendor_user = CustomUser.objects.create_user(
            email='vendor-create@example.com',
            password='pass',
            first_name='Vendor',
            last_name='Create',
            role=CustomUser.Role.VENDOR,
            is_verified=True,
        )
        self.customer = CustomUser.objects.create_user(
            email='customer-vendors@example.com',
            password='pass',
            first_name='Customer',
            last_name='Vendor',
            is_verified=True,
        )

    def test_customer_cannot_create_vendor_shop(self):
        self.client.force_authenticate(self.customer)
        response = self.client.post(reverse('vendor-create'), {'name': 'Denied Shop'}, format='json')
        self.assertEqual(response.status_code, 403)

    def test_vendor_can_create_only_one_shop(self):
        self.client.force_authenticate(self.vendor_user)
        first = self.client.post(reverse('vendor-create'), {'name': 'Unique Shop'}, format='json')
        second = self.client.post(reverse('vendor-create'), {'name': 'Second Shop'}, format='json')
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 400)
        vendor = Vendor.objects.get(user=self.vendor_user)
        self.assertEqual(vendor.plan.name, VendorPlan.Name.FREE)
        self.assertEqual(str(vendor.plan.commission_rate), '8.00')
        self.assertIsNone(vendor.plan.max_products)

    def test_vendor_can_update_public_contact_info(self):
        Vendor.objects.create(user=self.vendor_user, name='Editable Shop')
        self.client.force_authenticate(self.vendor_user)

        response = self.client.patch(reverse('vendor-me'), {
            'phone': '+221770000000',
            'whatsapp': '+221780000000',
            'contact_email': 'shop@example.com',
            'address': 'Parcelles Assainies',
            'city': 'Dakar',
            'region': 'Dakar',
            'facebook_url': 'https://facebook.com/editableshop',
            'instagram_url': 'https://instagram.com/editableshop',
            'tiktok_url': 'https://www.tiktok.com/@editableshop',
            'website_url': 'https://example.com',
        }, format='json')

        self.assertEqual(response.status_code, 200)
        vendor = Vendor.objects.get(user=self.vendor_user)
        self.assertEqual(vendor.phone, '+221770000000')
        self.assertEqual(vendor.whatsapp, '+221780000000')
        self.assertEqual(vendor.contact_email, 'shop@example.com')
        self.assertEqual(vendor.city, 'Dakar')
        self.assertEqual(vendor.region, 'Dakar')
        self.assertEqual(vendor.website_url, 'https://example.com')

    def test_admin_can_approve_and_suspend_vendor(self):
        vendor = Vendor.objects.create(user=self.vendor_user, name='Pending Shop')
        self.client.force_authenticate(self.admin)

        with patch('apps.vendors.views.send_vendor_approval_email.delay', return_value=None):
            approve = self.client.patch(reverse('admin-vendor-approve', args=[vendor.id]))
        vendor.refresh_from_db()
        self.assertEqual(approve.status_code, 200)
        self.assertEqual(vendor.status, Vendor.Status.APPROVED)

        with patch('apps.vendors.views.send_vendor_rejection_email.delay', return_value=None):
            suspend = self.client.patch(reverse('admin-vendor-suspend', args=[vendor.id]), {'reason': 'test'}, format='json')
        vendor.refresh_from_db()
        self.assertEqual(suspend.status_code, 200)
        self.assertEqual(vendor.status, Vendor.Status.SUSPENDED)
