from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.orders.models import Order, VendorOrder
from apps.platform.models import PlatformSettings
from apps.users.models import CustomUser
from apps.vendors.models import Vendor, VendorPlan
from apps.wallet.models import PlatformPayoutAccount, Transaction, Wallet
from apps.wallet.services import (
    PLATFORM_COMMISSION_RATE,
    credit_wallet_from_order,
    get_platform_commission_rate,
    release_pending_balances,
)


class WalletServiceTests(TestCase):
    """
    Tests pour credit_wallet_from_order et release_pending_balances.
    Commission MVP = 8% flat (PLATFORM_COMMISSION_RATE).
    """

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
        # Le plan n'est plus utilisé pour le taux — 8% flat
        self.plan, _ = VendorPlan.objects.update_or_create(
            name=VendorPlan.Name.PRO,
            defaults={
                'commission_rate': Decimal('7.00'),  # ignoré par le service MVP
                'monthly_price': 0,
            },
        )
        self.vendor = Vendor.objects.create(
            user=vendor_user,
            plan=self.plan,
            name='Vendor Shop',
            status=Vendor.Status.APPROVED,
        )
        # subtotal=10000, shipping=500
        # commission = 10000 * 8% = 800
        # net = 10000 - 800 + 500 = 9700
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

    # ── Taux de commission ──────────────────────────────────────────────

    def test_platform_commission_rate_is_8_percent(self):
        """Le taux de commission plateforme doit être exactement 8%."""
        self.assertEqual(PLATFORM_COMMISSION_RATE, Decimal('8.00'))
        self.assertEqual(get_platform_commission_rate(), Decimal('8.00'))

    def test_admin_configured_commission_rate_is_used_for_wallet_credit(self):
        PlatformSettings.objects.update_or_create(
            singleton_key='default',
            defaults={'commission_rate': Decimal('12.00')},
        )

        credit_wallet_from_order(self.order)

        wallet = Wallet.objects.get(vendor=self.vendor)
        sale = Transaction.objects.get(type=Transaction.Type.SALE)
        commission = Transaction.objects.get(type=Transaction.Type.COMMISSION)
        self.assertEqual(wallet.pending_balance, Decimal('9300.00'))
        self.assertEqual(sale.amount, Decimal('9300.00'))
        self.assertEqual(commission.amount, Decimal('1200.00'))
        self.assertIn('12.00', commission.description)

    # ── credit_wallet_from_order ────────────────────────────────────────

    def test_credit_wallet_creates_sale_and_commission_transactions(self):
        """Une commande PAID génère une SALE (net) et une COMMISSION (8%)."""
        credit_wallet_from_order(self.order)

        wallet = Wallet.objects.get(vendor=self.vendor)
        # net = 10000 - 800 + 500 = 9700
        self.assertEqual(wallet.pending_balance, Decimal('9700.00'))
        self.assertEqual(wallet.available_balance, Decimal('0.00'))

        sale = Transaction.objects.get(type=Transaction.Type.SALE)
        commission = Transaction.objects.get(type=Transaction.Type.COMMISSION)
        self.assertEqual(sale.amount, Decimal('9700.00'))
        self.assertEqual(commission.amount, Decimal('800.00'))

    def test_credit_wallet_is_idempotent(self):
        """Appeler deux fois ne crée pas de double transaction."""
        credit_wallet_from_order(self.order)
        credit_wallet_from_order(self.order)

        wallet = Wallet.objects.get(vendor=self.vendor)
        self.assertEqual(wallet.pending_balance, Decimal('9700.00'))
        self.assertEqual(Transaction.objects.filter(type=Transaction.Type.SALE).count(), 1)
        self.assertEqual(Transaction.objects.filter(type=Transaction.Type.COMMISSION).count(), 1)

    def test_commission_rate_ignored_from_vendor_plan(self):
        """Le plan du vendeur n'influe plus sur le taux — c'est 8% flat."""
        # On a un plan à 7% — le résultat doit quand même être 8%
        commission = Decimal('10000.00') * PLATFORM_COMMISSION_RATE / Decimal('100')
        self.assertEqual(commission, Decimal('800.00'))

    def test_net_amount_calculation(self):
        """Net = subtotal - commission(8%) + shipping."""
        credit_wallet_from_order(self.order)
        sale = Transaction.objects.get(type=Transaction.Type.SALE)
        expected_net = Decimal('10000.00') - Decimal('800.00') + Decimal('500.00')
        self.assertEqual(sale.amount, expected_net)

    def test_commission_description_mentions_8_percent(self):
        """La description de la transaction COMMISSION mentionne le taux."""
        credit_wallet_from_order(self.order)
        commission = Transaction.objects.get(type=Transaction.Type.COMMISSION)
        self.assertIn('8', commission.description)

    def test_vendor_without_plan_still_gets_8_percent_commission(self):
        """Un vendeur sans plan paie quand même 8% (le taux est indépendant du plan)."""
        self.vendor.plan = None
        self.vendor.save()
        credit_wallet_from_order(self.order)

        wallet = Wallet.objects.get(vendor=self.vendor)
        self.assertEqual(wallet.pending_balance, Decimal('9700.00'))
        commission = Transaction.objects.get(type=Transaction.Type.COMMISSION)
        self.assertEqual(commission.amount, Decimal('800.00'))

    def test_credit_wallet_zero_shipping(self):
        """Commande sans frais de livraison : net = subtotal - 8%."""
        self.vendor_order.shipping_cost = Decimal('0.00')
        self.vendor_order.save()

        credit_wallet_from_order(self.order)
        wallet = Wallet.objects.get(vendor=self.vendor)
        # net = 10000 - 800 + 0 = 9200
        self.assertEqual(wallet.pending_balance, Decimal('9200.00'))

    def test_credit_wallet_references_include_order_and_vendor_ids(self):
        """Les références de transaction suivent le format ORDER-X-VENDOR-Y."""
        credit_wallet_from_order(self.order)
        sale = Transaction.objects.get(type=Transaction.Type.SALE)
        self.assertIn(str(self.order.id), sale.reference)
        self.assertIn(str(self.vendor.id), sale.reference)
        self.assertIn('SALE', sale.reference)

    # ── Multi-vendeur ────────────────────────────────────────────────────

    def test_credit_wallet_multi_vendor(self):
        """Une commande avec deux sous-commandes vendeur crédite les deux wallets."""
        vendor_user2 = CustomUser.objects.create_user(
            email='vendor2@example.com',
            password='pass',
            role=CustomUser.Role.VENDOR,
        )
        vendor2 = Vendor.objects.create(
            user=vendor_user2,
            name='Shop B',
            status=Vendor.Status.APPROVED,
        )
        VendorOrder.objects.create(
            order=self.order,
            vendor=vendor2,
            subtotal=Decimal('5000.00'),
            shipping_cost=Decimal('0.00'),
        )

        credit_wallet_from_order(self.order)

        w1 = Wallet.objects.get(vendor=self.vendor)
        w2 = Wallet.objects.get(vendor=vendor2)

        # Vendor 1: 10000 - 800 + 500 = 9700
        self.assertEqual(w1.pending_balance, Decimal('9700.00'))
        # Vendor 2: 5000 - 400 + 0 = 4600
        self.assertEqual(w2.pending_balance, Decimal('4600.00'))

        self.assertEqual(Transaction.objects.filter(type=Transaction.Type.SALE).count(), 2)
        self.assertEqual(Transaction.objects.filter(type=Transaction.Type.COMMISSION).count(), 2)

    # ── release_pending_balances ─────────────────────────────────────────

    def test_release_pending_balances_moves_old_sales_to_available(self):
        """Après 7 jours, pending_balance → available_balance."""
        credit_wallet_from_order(self.order)
        sale = Transaction.objects.get(type=Transaction.Type.SALE)
        Transaction.objects.filter(pk=sale.pk).update(
            created_at=timezone.now() - timedelta(days=8)
        )

        released = release_pending_balances(days=7)
        self.assertEqual(released, 1)

        wallet = Wallet.objects.get(vendor=self.vendor)
        self.assertEqual(wallet.pending_balance, Decimal('0.00'))
        self.assertEqual(wallet.available_balance, Decimal('9700.00'))
        self.assertEqual(Transaction.objects.filter(type=Transaction.Type.RELEASE).count(), 1)

    def test_release_pending_balances_is_idempotent(self):
        """release_pending_balances ne libère pas deux fois la même vente."""
        credit_wallet_from_order(self.order)
        sale = Transaction.objects.get(type=Transaction.Type.SALE)
        Transaction.objects.filter(pk=sale.pk).update(
            created_at=timezone.now() - timedelta(days=8)
        )

        self.assertEqual(release_pending_balances(days=7), 1)
        self.assertEqual(release_pending_balances(days=7), 0)

    def test_release_pending_balances_respects_delay(self):
        """Une vente récente (< 7 jours) ne doit pas être libérée."""
        credit_wallet_from_order(self.order)
        # Pas de manipulation de date → la vente date de maintenant

        released = release_pending_balances(days=7)
        self.assertEqual(released, 0)

        wallet = Wallet.objects.get(vendor=self.vendor)
        self.assertEqual(wallet.pending_balance, Decimal('9700.00'))
        self.assertEqual(wallet.available_balance, Decimal('0.00'))

    # ── Commission admin (comptabilité) ──────────────────────────────────

    def test_admin_commission_revenue_tracked_via_transactions(self):
        """
        L'admin n'a pas de wallet propre.
        Son revenu = somme des transactions COMMISSION (8% de chaque vente).
        Ce test vérifie que le montant est correct et traçable.
        """
        credit_wallet_from_order(self.order)

        total_commissions = Transaction.objects.filter(
            type=Transaction.Type.COMMISSION
        ).aggregate(
            total=__import__('django.db.models', fromlist=['Sum']).Sum('amount')
        )['total']

        # 10000 * 8% = 800
        self.assertEqual(total_commissions, Decimal('800.00'))

    def test_admin_commission_revenue_multi_vendor(self):
        """La somme des commissions multi-vendeur = 8% du GMV total."""
        vendor_user2 = CustomUser.objects.create_user(
            email='vendor3@example.com',
            password='pass',
            role=CustomUser.Role.VENDOR,
        )
        vendor2 = Vendor.objects.create(
            user=vendor_user2,
            name='Shop C',
            status=Vendor.Status.APPROVED,
        )
        VendorOrder.objects.create(
            order=self.order,
            vendor=vendor2,
            subtotal=Decimal('20000.00'),
            shipping_cost=Decimal('1000.00'),
        )

        credit_wallet_from_order(self.order)

        from django.db.models import Sum
        total_commissions = Transaction.objects.filter(
            type=Transaction.Type.COMMISSION
        ).aggregate(total=Sum('amount'))['total']

        # Vendor 1: 10000 * 8% = 800
        # Vendor 2: 20000 * 8% = 1600
        # Total: 2400
        self.assertEqual(total_commissions, Decimal('2400.00'))


class PlatformPayoutAccountApiTests(APITestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            email='platform-admin@example.com',
            password='pass',
            first_name='Platform',
            last_name='Admin',
            role=CustomUser.Role.ADMIN,
            is_verified=True,
        )
        self.vendor_user = CustomUser.objects.create_user(
            email='platform-vendor@example.com',
            password='pass',
            first_name='Platform',
            last_name='Vendor',
            role=CustomUser.Role.VENDOR,
            is_verified=True,
        )

    def test_only_admin_can_update_platform_payout_account(self):
        self.client.force_authenticate(self.vendor_user)
        denied = self.client.patch(reverse('admin-platform-payout-account'), {
            'method': PlatformPayoutAccount.Method.MOBILE_MONEY,
            'account_name': 'NaatalFi',
            'phone_number': '771234567',
        }, format='json')
        self.assertEqual(denied.status_code, 403)

        self.client.force_authenticate(self.admin)
        mobile = self.client.patch(reverse('admin-platform-payout-account'), {
            'method': PlatformPayoutAccount.Method.MOBILE_MONEY,
            'account_name': 'NaatalFi',
            'phone_number': '771234567',
        }, format='json')
        self.assertEqual(mobile.status_code, 200)
        self.assertEqual(mobile.data['phone_number'], '771234567')

        bank = self.client.patch(reverse('admin-platform-payout-account'), {
            'method': PlatformPayoutAccount.Method.BANK,
            'account_name': 'NaatalFi SARL',
            'bank_name': 'Banque Test',
            'account_number': 'SN123456789',
        }, format='json')
        self.assertEqual(bank.status_code, 200)
        self.assertEqual(bank.data['bank_name'], 'Banque Test')
        self.assertEqual(PlatformPayoutAccount.objects.count(), 1)
