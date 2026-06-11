from rest_framework.test import APITestCase

from apps.users.models import CustomUser


class AdminUserApiTests(APITestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            email='admin@example.com',
            password='password123',
            first_name='Admin',
            last_name='User',
            role=CustomUser.Role.ADMIN,
            is_verified=True,
        )
        self.user = CustomUser.objects.create_user(
            email='customer@example.com',
            password='password123',
            first_name='Customer',
            last_name='User',
        )
        self.client.force_authenticate(self.admin)

    def test_admin_can_update_user_role_and_active_state(self):
        response = self.client.patch(
            f'/api/v1/auth/admin/users/{self.user.id}/',
            {'role': 'VENDOR', 'is_active': False},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, CustomUser.Role.VENDOR)
        self.assertFalse(self.user.is_active)

    def test_admin_cannot_deactivate_self(self):
        response = self.client.patch(
            f'/api/v1/auth/admin/users/{self.admin.id}/',
            {'is_active': False},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)
