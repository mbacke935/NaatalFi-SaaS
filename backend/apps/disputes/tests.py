from decimal import Decimal

from django.urls import reverse
from rest_framework.test import APITestCase

from apps.disputes.models import Dispute
from apps.orders.models import Order, VendorOrder
from apps.users.models import CustomUser
from apps.vendors.models import Vendor
from apps.wallet.models import Transaction, Wallet


class DisputeApiTests(APITestCase):
    def setUp(self):
        self.buyer = CustomUser.objects.create_user(
            email='buyer@example.com',
            password='pass12345',
            first_name='Buyer',
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
            name='Boutique Litige',
            status=Vendor.Status.APPROVED,
        )
        self.wallet = Wallet.objects.create(
            vendor=self.vendor,
            available_balance='10000.00',
        )
        self.order = Order.objects.create(
            buyer=self.buyer,
            status=Order.Status.PAID,
            total='5000.00',
            delivery_address='Dakar',
        )
        self.vendor_order = VendorOrder.objects.create(
            order=self.order,
            vendor=self.vendor,
            status=VendorOrder.Status.DELIVERED,
            subtotal='5000.00',
        )

    def test_buyer_can_open_dispute_and_freeze_vendor_wallet(self):
        self.client.force_authenticate(self.buyer)

        response = self.client.post(reverse('dispute-list-create'), {
            'vendor_order_id': self.vendor_order.id,
            'reason': 'ITEM_NOT_RECEIVED',
            'description': 'Commande non recue.',
        })

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Dispute.objects.count(), 1)
        dispute = Dispute.objects.get()
        self.assertEqual(dispute.frozen_amount, Decimal('5000.00'))
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.available_balance, Decimal('5000.00'))
        self.assertEqual(self.wallet.frozen_balance, Decimal('5000.00'))
        self.assertTrue(Transaction.objects.filter(type=Transaction.Type.FREEZE).exists())

    def test_admin_refund_resolution_consumes_frozen_balance(self):
        dispute = Dispute.objects.create(
            order=self.order,
            vendor_order=self.vendor_order,
            initiator=self.buyer,
            reason='DAMAGED',
            frozen_amount='5000.00',
        )
        self.wallet.available_balance = Decimal('5000.00')
        self.wallet.frozen_balance = Decimal('5000.00')
        self.wallet.save()
        self.client.force_authenticate(self.admin)

        response = self.client.post(reverse('admin-dispute-resolve', args=[dispute.id]), {
            'resolution': Dispute.Resolution.REFUND,
            'note': 'Remboursement valide.',
        })

        self.assertEqual(response.status_code, 200)
        self.wallet.refresh_from_db()
        self.vendor_order.refresh_from_db()
        dispute.refresh_from_db()
        self.assertEqual(self.wallet.frozen_balance, Decimal('0.00'))
        self.assertEqual(self.wallet.available_balance, Decimal('5000.00'))
        self.assertEqual(self.vendor_order.status, VendorOrder.Status.REFUNDED)
        self.assertEqual(dispute.status, Dispute.Status.RESOLVED)
        self.assertTrue(Transaction.objects.filter(type=Transaction.Type.REFUND).exists())

    def test_admin_no_refund_resolution_releases_frozen_balance(self):
        dispute = Dispute.objects.create(
            order=self.order,
            vendor_order=self.vendor_order,
            initiator=self.buyer,
            reason='LATE',
            frozen_amount='5000.00',
        )
        self.wallet.available_balance = Decimal('5000.00')
        self.wallet.frozen_balance = Decimal('5000.00')
        self.wallet.save()
        self.client.force_authenticate(self.admin)

        response = self.client.post(reverse('admin-dispute-resolve', args=[dispute.id]), {
            'resolution': Dispute.Resolution.NO_REFUND,
            'note': 'Vendeur non responsable.',
        })

        self.assertEqual(response.status_code, 200)
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.frozen_balance, Decimal('0.00'))
        self.assertEqual(self.wallet.available_balance, Decimal('10000.00'))
        self.assertTrue(Transaction.objects.filter(type=Transaction.Type.UNFREEZE).exists())
