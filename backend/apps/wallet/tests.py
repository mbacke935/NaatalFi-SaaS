from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.orders.models import Order, VendorOrder
from apps.users.models import CustomUser
from apps.vendors.models import Vendor, VendorPlan
from apps.wallet.models import Transaction, Wallet
from apps.wallet.services import credit_wallet_from_order, release_pending_balances


class WalletServiceTests(TestCase):
    def setUp(self):
        self.buyer = CustomUser.objects.create_user(
            email='buyer@example.com',
            password='password123',
            first_name='Buyer',
            last_name='Test',
        )
        vendor_user = CustomUser.objects.create_user(
            email='vendor@example.com',
            password='password123',
            first_name='Vendor',
            last_name='Test',
            role=CustomUser.Role.VENDOR,
        )
        self.plan, _ = VendorPlan.objects.update_or_create(
            name=VendorPlan.Name.PRO,
            defaults={
                'commission_rate': Decimal('7.00'),
                'monthly_price': 0,
            },
        )
        self.vendor = Vendor.objects.create(
            user=vendor_user,
            plan=self.plan,
            name='Vendor Shop',
            status=Vendor.Status.APPROVED,
        )
        self.order = Order.objects.create(
            buyer=self.buyer,
            status=Order.Status.PAID,
            total=Decimal('10500.00'),
            delivery_address='Dakar',
        )
        self.vendor_order = VendorOrder.objects.create(
            order=self.order,
            vendor=self.vendor,
            subtotal=Decimal('10000.00'),
            shipping_cost=Decimal('500.00'),
        )

    def test_credit_wallet_records_sale_and_commission_once(self):
        credit_wallet_from_order(self.order)
        credit_wallet_from_order(self.order)

        wallet = Wallet.objects.get(vendor=self.vendor)
        self.assertEqual(wallet.pending_balance, Decimal('9800.00'))
        self.assertEqual(wallet.available_balance, Decimal('0.00'))

        sale = Transaction.objects.get(type=Transaction.Type.SALE)
        commission = Transaction.objects.get(type=Transaction.Type.COMMISSION)
        self.assertEqual(sale.amount, Decimal('9800.00'))
        self.assertEqual(commission.amount, Decimal('700.00'))
        self.assertEqual(Transaction.objects.filter(type=Transaction.Type.SALE).count(), 1)
        self.assertEqual(Transaction.objects.filter(type=Transaction.Type.COMMISSION).count(), 1)

    def test_release_pending_balances_moves_old_sales_once(self):
        credit_wallet_from_order(self.order)
        sale = Transaction.objects.get(type=Transaction.Type.SALE)
        Transaction.objects.filter(pk=sale.pk).update(
            created_at=timezone.now() - timedelta(days=8)
        )

        self.assertEqual(release_pending_balances(days=7), 1)
        self.assertEqual(release_pending_balances(days=7), 0)

        wallet = Wallet.objects.get(vendor=self.vendor)
        self.assertEqual(wallet.pending_balance, Decimal('0.00'))
        self.assertEqual(wallet.available_balance, Decimal('9800.00'))
        self.assertEqual(Transaction.objects.filter(type=Transaction.Type.RELEASE).count(), 1)
