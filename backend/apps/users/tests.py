from unittest import mock

from django.core.cache import cache
from rest_framework.test import APITestCase
from rest_framework.throttling import ScopedRateThrottle

from apps.internal.models import AdminAuditLog
from apps.users.models import CustomUser
from apps.users.serializers import AdminUserSerializer, UserSerializer
from apps.users.views import LoginView


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
        audit = AdminAuditLog.objects.get(action=AdminAuditLog.Action.USER_UPDATED)
        self.assertEqual(audit.actor, self.admin)
        self.assertEqual(audit.target_id, str(self.user.id))
        self.assertEqual(audit.metadata['changed_fields'], ['is_active', 'role'])

    def test_admin_cannot_deactivate_self(self):
        response = self.client.patch(
            f'/api/v1/auth/admin/users/{self.admin.id}/',
            {'is_active': False},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)

    def test_admin_can_delete_user(self):
        response = self.client.delete(f'/api/v1/auth/admin/users/{self.user.id}/')

        self.assertEqual(response.status_code, 204)
        self.assertFalse(CustomUser.objects.filter(pk=self.user.pk).exists())
        audit = AdminAuditLog.objects.get(action=AdminAuditLog.Action.USER_DELETED)
        self.assertEqual(audit.actor, self.admin)
        self.assertEqual(audit.metadata['email'], 'customer@example.com')

    def test_admin_cannot_delete_self(self):
        response = self.client.delete(f'/api/v1/auth/admin/users/{self.admin.id}/')

        self.assertEqual(response.status_code, 400)
        self.assertTrue(CustomUser.objects.filter(pk=self.admin.pk).exists())

    def test_admin_cannot_delete_another_admin(self):
        """Un compte ADMIN ne peut pas etre supprime directement (il faut d'abord retirer le role)."""
        other_admin = CustomUser.objects.create_user(
            email='admin2@example.com',
            password='password123',
            first_name='Admin',
            last_name='Two',
            role=CustomUser.Role.ADMIN,
            is_verified=True,
        )

        response = self.client.delete(f'/api/v1/auth/admin/users/{other_admin.id}/')

        self.assertEqual(response.status_code, 400)
        self.assertTrue(CustomUser.objects.filter(pk=other_admin.pk).exists())

    def test_non_admin_cannot_delete_user(self):
        """Un client authentifie sans role ADMIN recoit 403 sur DELETE."""
        self.client.force_authenticate(self.user)

        response = self.client.delete(f'/api/v1/auth/admin/users/{self.admin.id}/')

        self.assertEqual(response.status_code, 403)
        self.assertTrue(CustomUser.objects.filter(pk=self.admin.pk).exists())


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
        self.assertNotIn('refresh', response.data)
        refresh_cookie = response.cookies.get('naatalfi_refresh')
        self.assertIsNotNone(refresh_cookie)
        self.assertTrue(refresh_cookie['httponly'])

    def test_refresh_uses_httponly_cookie(self):
        login_response = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'login@example.com', 'password': 'password123'},
            format='json',
        )
        self.client.cookies['naatalfi_refresh'] = login_response.cookies['naatalfi_refresh'].value

        response = self.client.post('/api/v1/auth/token/refresh/', {}, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertNotIn('refresh', response.data)
        self.assertIsNotNone(response.cookies.get('naatalfi_refresh'))

    def test_logout_clears_refresh_cookie(self):
        login_response = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'login@example.com', 'password': 'password123'},
            format='json',
        )
        self.client.cookies['naatalfi_refresh'] = login_response.cookies['naatalfi_refresh'].value

        response = self.client.post('/api/v1/auth/logout/', {}, format='json')

        self.assertEqual(response.status_code, 204)
        refresh_cookie = response.cookies.get('naatalfi_refresh')
        self.assertIsNotNone(refresh_cookie)
        self.assertEqual(refresh_cookie.value, '')

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


class PasswordStorageTests(APITestCase):
    def test_create_user_hashes_password_and_serializers_do_not_expose_it(self):
        user = CustomUser.objects.create_user(
            email='hash@example.com',
            password='plain-password-123',
            first_name='Hash',
            last_name='User',
            is_verified=True,
        )

        self.assertNotEqual(user.password, 'plain-password-123')
        self.assertTrue(user.check_password('plain-password-123'))
        self.assertTrue(user.password.startswith(('pbkdf2_', 'argon2', 'bcrypt', 'md5$')))
        self.assertNotIn('password', UserSerializer(user).data)
        self.assertNotIn('password', AdminUserSerializer(user).data)

    def test_register_api_never_returns_or_stores_plain_password(self):
        response = self.client.post('/api/v1/auth/register/', {
            'email': 'register-hash@example.com',
            'password': 'plain-password-456',
            'first_name': 'Register',
            'last_name': 'Hash',
            'role': CustomUser.Role.CUSTOMER,
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertNotIn('password', response.data)
        user = CustomUser.objects.get(email='register-hash@example.com')
        self.assertNotEqual(user.password, 'plain-password-456')
        self.assertTrue(user.check_password('plain-password-456'))


class _LoginRateThrottle(ScopedRateThrottle):
    """Throttle de test : 3 requêtes/min sur le scope login."""
    THROTTLE_RATES = {'login': '3/min'}


class LoginThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = CustomUser.objects.create_user(
            email='throttle@example.com',
            password='password123',
            first_name='Throttle',
            last_name='User',
            is_verified=True,
        )

    def tearDown(self):
        cache.clear()

    @mock.patch.object(LoginView, 'throttle_classes', [_LoginRateThrottle])
    def test_login_is_throttled_after_rate_limit(self):
        """Au-delà de la limite, l'endpoint login renvoie 429."""
        creds = {'email': 'throttle@example.com', 'password': 'wrong-password'}

        # 3 requêtes autorisées (rate = 3/min), peu importe le résultat auth.
        for _ in range(3):
            self.client.post('/api/v1/auth/login/', creds, format='json')

        # La 4e doit être bloquée par le throttle.
        response = self.client.post('/api/v1/auth/login/', creds, format='json')
        self.assertEqual(response.status_code, 429)
