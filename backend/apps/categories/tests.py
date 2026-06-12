from django.urls import reverse
from rest_framework.test import APITestCase

from apps.categories.models import Category
from apps.users.models import CustomUser


class CategoryApiTests(APITestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            email='admin-categories@example.com',
            password='pass',
            first_name='Admin',
            last_name='Category',
            role=CustomUser.Role.ADMIN,
            is_verified=True,
        )
        self.customer = CustomUser.objects.create_user(
            email='customer-categories@example.com',
            password='pass',
            first_name='Customer',
            last_name='Category',
            is_verified=True,
        )

    def test_public_category_list_only_returns_active_roots(self):
        active = Category.objects.create(name='Active')
        Category.objects.create(name='Inactive', is_active=False)
        Category.objects.create(name='Child', parent=active)

        response = self.client.get(reverse('category-list'))
        self.assertEqual(response.status_code, 200)
        names = [item['name'] for item in response.data]
        self.assertEqual(names, ['Active'])
        self.assertEqual(response.data[0]['children'][0]['name'], 'Child')

    def test_non_admin_cannot_create_category(self):
        self.client.force_authenticate(self.customer)
        response = self.client.post(reverse('admin-category-list'), {'name': 'Denied'}, format='json')
        self.assertEqual(response.status_code, 403)

    def test_admin_can_create_and_reorder_category(self):
        self.client.force_authenticate(self.admin)
        create = self.client.post(reverse('admin-category-list'), {'name': 'Mode', 'order': 10}, format='json')
        self.assertEqual(create.status_code, 201)

        category = Category.objects.get(name='Mode')
        reorder = self.client.post(reverse('admin-category-reorder'), [
            {'id': category.id, 'order': 1},
        ], format='json')
        category.refresh_from_db()
        self.assertEqual(reorder.status_code, 200)
        self.assertEqual(category.order, 1)
