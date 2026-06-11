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


class LoginApiTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email='login@example.com',
            password='password123',
            first_name='Login',
            last_name='User',
            is_verified=True,
        )

    def test_login_accepts_case_insensitive_email(self):
        response = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'LOGIN@EXAMPLE.COM', 'password': 'password123'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)

    def test_login_returns_clear_error_for_inactive_user(self):
        self.user.is_active = False
        self.user.save(update_fields=['is_active'])

        response = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'login@example.com', 'password': 'password123'},
            format='json',
        )

        self.assertEqual(response.status_code, 403)
        self.assertIn('desactive', response.data['error'])
