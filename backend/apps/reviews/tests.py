from django.urls import reverse
from rest_framework.test import APITestCase

from apps.orders.models import Order, OrderItem, VendorOrder
from apps.products.models import Product
from apps.reviews.models import Review
from apps.users.models import CustomUser
from apps.vendors.models import Vendor


class ReviewApiTests(APITestCase):
    def setUp(self):
        self.buyer = CustomUser.objects.create_user(
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
        self.vendor_user = CustomUser.objects.create_user(
            email='vendor@example.com',
            password='pass12345',
            first_name='Vendor',
            last_name='One',
            role=CustomUser.Role.VENDOR,
            is_verified=True,
        )
        self.admin = CustomUser.objects.create_user(
            email='admin@example.com',
            password='pass12345',
            first_name='Admin',
            last_name='One',
            role=CustomUser.Role.ADMIN,
            is_verified=True,
        )
        self.vendor = Vendor.objects.create(
            user=self.vendor_user,
            name='Boutique Test',
            status=Vendor.Status.APPROVED,
        )
        self.product = Product.objects.create(
            vendor=self.vendor,
            name='Produit Test',
            price='1000.00',
            status=Product.Status.PUBLISHED,
        )
        self.order = Order.objects.create(
            buyer=self.buyer,
            status=Order.Status.PAID,
            delivery_address='Dakar',
            total='1000.00',
        )
        self.vendor_order = VendorOrder.objects.create(
            order=self.order,
            vendor=self.vendor,
            status=VendorOrder.Status.DELIVERED,
            subtotal='1000.00',
        )
        OrderItem.objects.create(
            vendor_order=self.vendor_order,
            product=self.product,
            product_name=self.product.name,
            product_slug=self.product.slug,
            unit_price='1000.00',
            quantity=1,
        )

    def test_buyer_can_review_delivered_product_once(self):
        self.client.force_authenticate(self.buyer)

        response = self.client.post(reverse('review-create'), {
            'vendor_order_id': self.vendor_order.id,
            'product_id': self.product.id,
            'rating': 5,
            'comment': 'Excellent produit.',
        })

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Review.objects.count(), 1)
        self.product.refresh_from_db()
        self.vendor.refresh_from_db()
        self.assertEqual(str(self.product.average_rating), '5.0')
        self.assertEqual(self.product.total_reviews, 1)
        self.assertEqual(str(self.vendor.trust_score), '5.0')

        duplicate = self.client.post(reverse('review-create'), {
            'vendor_order_id': self.vendor_order.id,
            'product_id': self.product.id,
            'rating': 4,
        })
        self.assertEqual(duplicate.status_code, 400)

    def test_cannot_review_other_users_order(self):
        self.client.force_authenticate(self.other)

        response = self.client.post(reverse('review-create'), {
            'vendor_order_id': self.vendor_order.id,
            'product_id': self.product.id,
            'rating': 5,
        })

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Review.objects.count(), 0)

    def test_admin_delete_review_recalculates_scores(self):
        review = Review.objects.create(
            author=self.buyer,
            product=self.product,
            vendor=self.vendor,
            vendor_order=self.vendor_order,
            rating=4,
            comment='Bien.',
        )
        from apps.reviews.services import recalculate_review_scores
        recalculate_review_scores(self.product, self.vendor)
        self.client.force_authenticate(self.admin)

        response = self.client.delete(reverse('admin-review-detail', args=[review.id]))

        self.assertEqual(response.status_code, 204)
        self.product.refresh_from_db()
        self.vendor.refresh_from_db()
        self.assertEqual(self.product.total_reviews, 0)
        self.assertEqual(str(self.product.average_rating), '0.0')
        self.assertEqual(str(self.vendor.trust_score), '0.0')
