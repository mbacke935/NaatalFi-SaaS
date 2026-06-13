from django.db import transaction as db_transaction
from django.db.models import F
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.users.models import CustomUser
from apps.internal.audit import log_admin_action
from apps.internal.models import AdminAuditLog
from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from .models import PlatformPayoutAccount, Wallet, Transaction, PayoutRequest
from .serializers import (
    WalletSerializer,
    TransactionSerializer,
    PayoutRequestSerializer,
    CreatePayoutRequestSerializer,
    AdminWalletSerializer,
    AdminPayoutRequestSerializer,
    PlatformPayoutAccountSerializer,
)


class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == CustomUser.Role.ADMIN


def _get_vendor_or_404(request):
    """Retourne le vendor du user connecté ou lève une réponse 404."""
    try:
        return request.user.vendor, None
    except Exception:
        return None, Response({'error': 'Boutique introuvable.'}, status=status.HTTP_404_NOT_FOUND)


# ── Vendor ─────────────────────────────────────────────────────────────

class WalletDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vendor, err = _get_vendor_or_404(request)
        if err:
            return err
        wallet, _ = Wallet.objects.select_related('vendor__plan').get_or_create(vendor=vendor)
        return Response(WalletSerializer(wallet).data)


class TransactionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vendor, err = _get_vendor_or_404(request)
        if err:
            return err
        try:
            wallet = vendor.wallet
        except Wallet.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)

        qs = wallet.transactions.all()
        if t := request.query_params.get('type'):
            qs = qs.filter(type=t)

        return Response(TransactionSerializer(qs, many=True).data)


class PayoutRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vendor, err = _get_vendor_or_404(request)
        if err:
            return err
        try:
            wallet = vendor.wallet
        except Wallet.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)

        qs = wallet.payout_requests.all()
        return Response(PayoutRequestSerializer(qs, many=True).data)

    @db_transaction.atomic
    def post(self, request):
        vendor, err = _get_vendor_or_404(request)
        if err:
            return err

        wallet, _ = Wallet.objects.get_or_create(vendor=vendor)
        wallet.refresh_from_db()

        ser = CreatePayoutRequestSerializer(data=request.data, context={'wallet': wallet})
        ser.is_valid(raise_exception=True)

        amount       = ser.validated_data['amount']
        bank_info    = {
            'bank_name':      ser.validated_data['bank_name'],
            'account_number': ser.validated_data['account_number'],
            'account_name':   ser.validated_data['account_name'],
        }

        # Déduire du solde disponible immédiatement
        Wallet.objects.filter(pk=wallet.pk).update(
            available_balance=F('available_balance') - amount,
        )

        payout = PayoutRequest.objects.create(
            wallet=wallet,
            amount=amount,
            bank_info=bank_info,
        )

        Transaction.objects.create(
            wallet=wallet,
            type=Transaction.Type.PAYOUT,
            amount=amount,
            description=f"Demande de retrait #{payout.id}",
            reference=f"PAYOUT-{payout.id}",
        )
        db_transaction.on_commit(
            lambda payout_id=payout.id, payout_amount=amount, user=vendor.user: create_notification(
                user=user,
                type=Notification.Type.WALLET,
                title=f"Retrait #{payout_id} demande",
                message=f"Votre demande de retrait de {payout_amount} FCFA est en attente de validation.",
                link_url="/dashboard/wallet",
            )
        )

        return Response(PayoutRequestSerializer(payout).data, status=status.HTTP_201_CREATED)


# ── Admin ───────────────────────────────────────────────────────────────

class AdminWalletListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        wallets = (
            Wallet.objects
            .select_related('vendor__plan')
            .order_by('-available_balance')
        )
        return Response(AdminWalletSerializer(wallets, many=True).data)


class AdminApprovePayoutView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            payout = PayoutRequest.objects.select_related('wallet__vendor__user').get(pk=pk)
        except PayoutRequest.DoesNotExist:
            return Response({'error': 'Demande introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if payout.status != PayoutRequest.Status.PENDING:
            return Response({'error': 'Cette demande a déjà été traitée.'}, status=status.HTTP_400_BAD_REQUEST)

        payout.status     = PayoutRequest.Status.APPROVED
        payout.admin_note = request.data.get('admin_note', '')
        payout.save(update_fields=['status', 'admin_note', 'updated_at'])
        log_admin_action(
            request,
            AdminAuditLog.Action.PAYOUT_APPROVED,
            target=payout,
            target_repr=f"Retrait #{payout.id}",
            metadata={'amount': str(payout.amount), 'vendor_id': payout.wallet.vendor_id},
        )
        create_notification(
            user=payout.wallet.vendor.user,
            type=Notification.Type.WALLET,
            title=f"Retrait #{payout.id} approuve",
            message=f"Votre demande de retrait de {payout.amount} FCFA a ete approuvee.",
            link_url="/dashboard/wallet",
        )

        return Response(PayoutRequestSerializer(payout).data)


class AdminRejectPayoutView(APIView):
    permission_classes = [IsAdmin]

    @db_transaction.atomic
    def patch(self, request, pk):
        try:
            payout = PayoutRequest.objects.select_related('wallet__vendor__user').select_for_update().get(pk=pk)
        except PayoutRequest.DoesNotExist:
            return Response({'error': 'Demande introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if payout.status != PayoutRequest.Status.PENDING:
            return Response({'error': 'Cette demande a déjà été traitée.'}, status=status.HTTP_400_BAD_REQUEST)

        payout.status     = PayoutRequest.Status.REJECTED
        payout.admin_note = request.data.get('admin_note', '')
        payout.save(update_fields=['status', 'admin_note', 'updated_at'])
        log_admin_action(
            request,
            AdminAuditLog.Action.PAYOUT_REJECTED,
            target=payout,
            target_repr=f"Retrait #{payout.id}",
            metadata={'amount': str(payout.amount), 'vendor_id': payout.wallet.vendor_id},
        )

        # Rembourser le montant dans le solde disponible
        Wallet.objects.filter(pk=payout.wallet_id).update(
            available_balance=F('available_balance') + payout.amount,
        )

        Transaction.objects.create(
            wallet=payout.wallet,
            type=Transaction.Type.REFUND,
            amount=payout.amount,
            description=f"Retrait #{payout.id} rejeté — montant restitué",
            reference=f"REJECT-PAYOUT-{payout.id}",
        )
        db_transaction.on_commit(
            lambda payout_id=payout.id, amount=payout.amount, user=payout.wallet.vendor.user: create_notification(
                user=user,
                type=Notification.Type.WALLET,
                title=f"Retrait #{payout_id} rejete",
                message=f"Votre demande de retrait de {amount} FCFA a ete rejetee et le solde a ete restitue.",
                link_url="/dashboard/wallet",
            )
        )

        return Response(PayoutRequestSerializer(payout).data)


class AdminPayoutListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = PayoutRequest.objects.select_related('wallet__vendor').order_by('-created_at')
        if s := request.query_params.get('status'):
            qs = qs.filter(status=s.upper())
        return Response(AdminPayoutRequestSerializer(qs, many=True).data)


class PlatformPayoutAccountView(APIView):
    permission_classes = [IsAdmin]

    def get_object(self):
        obj, _ = PlatformPayoutAccount.objects.get_or_create(
            singleton_key='default',
            defaults={
                'method': PlatformPayoutAccount.Method.MOBILE_MONEY,
                'account_name': 'NaatalFi',
                'phone_number': '',
            },
        )
        return obj

    def get(self, request):
        return Response(PlatformPayoutAccountSerializer(self.get_object()).data)

    def patch(self, request):
        account = self.get_object()
        changed_fields = sorted(request.data.keys())
        serializer = PlatformPayoutAccountSerializer(account, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_admin_action(
            request,
            AdminAuditLog.Action.PLATFORM_PAYOUT_ACCOUNT_UPDATED,
            target=account,
            metadata={'changed_fields': changed_fields},
        )
        return Response(serializer.data)
