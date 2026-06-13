from decimal import Decimal

from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from apps.account.models import Address, Favorite
from apps.products.models import Product
from apps.users.models import CustomUser
from apps.vendors.models import Vendor


class AccountApiTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email='account@example.com',
            password='pass',
            first_name='Account',
            last_name='User',
            is_verified=True,
        )
        self.other = CustomUser.objects.create_user(
            email='other-account@example.com',
            password='pass',
            first_name='Other',
            last_name='User',
            is_verified=True,
        )
        vendor_user = CustomUser.objects.create_user(
            email='account-vendor@example.com',
            password='pass',
            first_name='Vendor',
            last_name='Account',
            role=CustomUser.Role.VENDOR,
            is_verified=True,
        )
        self.vendor = Vendor.objects.create(user=vendor_user, name='Account Shop', status=Vendor.Status.APPROVED)
        self.product = Product.objects.create(
            vendor=self.vendor,
            name='Bracelet',
            price=Decimal('3000.00'),
            status=Product.Status.PUBLISHED,
        )

    def test_default_address_is_unique_per_user(self):
        self.client.force_authenticate(self.user)
        first = self.client.post('/api/v1/account/addresses/', {
            'label': 'Maison',
            'full_name': 'Account User',
            'phone': '770000000',
            'street': 'Rue 1',
            'city': 'Dakar',
            'region': 'Dakar',
            'is_default': True,
        }, format='json')
        second = self.client.post('/api/v1/account/addresses/', {
            'label': 'Bureau',
            'full_name': 'Account User',
            'phone': '770000001',
            'street': 'Rue 2',
            'city': 'Thies',
            'region': 'Thies',
            'is_default': True,
        }, format='json')

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertFalse(Address.objects.get(pk=first.data['id']).is_default)
        self.assertTrue(Address.objects.get(pk=second.data['id']).is_default)

    def test_user_cannot_update_other_user_address(self):
        address = Address.objects.create(
            user=self.other,
            full_name='Other User',
            phone='771111111',
            street='Rue X',
            city='Dakar',
        )
        self.client.force_authenticate(self.user)
        response = self.client.patch(f'/api/v1/account/addresses/{address.id}/', {'city': 'Thies'}, format='json')
        self.assertEqual(response.status_code, 404)

    def test_favorite_is_idempotent_and_removable(self):
        self.client.force_authenticate(self.user)
        url = f'/api/v1/account/favorites/{self.product.id}/'
        first = self.client.post(url)
        second = self.client.post(url)
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(Favorite.objects.filter(user=self.user, product=self.product).count(), 1)

        delete_response = self.client.delete(url)
        self.assertEqual(delete_response.status_code, 204)
        self.assertFalse(Favorite.objects.filter(user=self.user, product=self.product).exists())

    def test_avatar_upload_rejects_file_with_spoofed_image_mime(self):
        self.client.force_authenticate(self.user)
        fake_image = SimpleUploadedFile(
            'avatar.jpg',
            b'<script>alert("xss")</script>',
            content_type='image/jpeg',
        )

        response = self.client.post('/api/v1/account/profile/avatar/', {'avatar': fake_image}, format='multipart')

        self.assertEqual(response.status_code, 400)
        self.assertIn('image valide', response.data['error'])
