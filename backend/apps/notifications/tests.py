from django.urls import reverse
from rest_framework.test import APITestCase

from apps.notifications.models import Notification
from apps.users.models import CustomUser


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email='buyer@example.com',
            password='pass12345',
            first_name='Buyer',
            last_name='One',
            is_verified=True,
        )
        self.other = CustomUser.objects.create_user(
            email='other@example.com',
            password='pass12345',
            first_name='Other',
            last_name='One',
            is_verified=True,
        )
        self.notification = Notification.objects.create(
            user=self.user,
            type=Notification.Type.ORDER,
            title='Commande creee',
            message='Votre commande est creee.',
            link_url='/account/orders/1',
        )
        Notification.objects.create(
            user=self.other,
            type=Notification.Type.SYSTEM,
            title='Autre',
            message='Notification autre utilisateur.',
        )

    def test_list_only_returns_authenticated_user_notifications(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(reverse('notification-list'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.notification.id)

    def test_mark_notification_read(self):
        self.client.force_authenticate(self.user)

        response = self.client.patch(reverse('notification-read', args=[self.notification.id]))

        self.assertEqual(response.status_code, 200)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_cannot_mark_other_user_notification_read(self):
        other_notification = Notification.objects.filter(user=self.other).first()
        self.client.force_authenticate(self.user)

        response = self.client.patch(reverse('notification-read', args=[other_notification.id]))

        self.assertEqual(response.status_code, 404)
        other_notification.refresh_from_db()
        self.assertFalse(other_notification.is_read)

    def test_mark_all_read_only_updates_authenticated_user(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(reverse('notification-read-all'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['updated'], 1)
        self.assertFalse(Notification.objects.get(user=self.other).is_read)
