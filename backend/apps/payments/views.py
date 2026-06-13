from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order
from apps.wallet.services import credit_wallet_from_order
from .models import Payment
from .serializers import InitiatePaymentSerializer, PaymentSerializer, AdminPaymentSerializer
from .services import (
    PayTechError,
    request_paytech_payment,
    verify_webhook_signature,
    webhook_marks_paid,
)
from tasks.payments import send_payment_confirmation_email


class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'ADMIN'


class InitiatePaymentView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = Order.objects.select_for_update().get(pk=serializer.validated_data['order_id'])
        except Order.DoesNotExist:
            return Response({'error': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if order.buyer_id:
            if not request.user.is_authenticated or (
                order.buyer_id != request.user.id and request.user.role != 'ADMIN'
            ):
                return Response({'error': 'Acces refuse.'}, status=status.HTTP_403_FORBIDDEN)
        else:
            token = serializer.validated_data.get('access_token', '')
            if not token or str(order.guest_access_token) != token:
                return Response({'error': 'Acces refuse.'}, status=status.HTTP_403_FORBIDDEN)

        if order.status == Order.Status.CANCELLED:
            return Response({'error': 'Impossible de payer une commande annulee.'}, status=status.HTTP_400_BAD_REQUEST)

        if order.status == Order.Status.PAID:
            payment = order.payments.filter(status=Payment.Status.PAID).first()
            return Response(PaymentSerializer(payment).data if payment else {'status': 'PAID'})

        provider = serializer.validated_data['provider']
        payment = order.payments.filter(provider=provider, status=Payment.Status.PENDING).first()
        if not payment:
            payment = Payment.objects.create(
                order=order,
                buyer=order.buyer,
                provider=provider,
                amount=order.total,
            )

        if provider != Payment.Provider.PAYTECH:
            return Response(
                {'error': 'Ce fournisseur de paiement sera active dans une phase ulterieure.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payment = request_paytech_payment(payment, request)
        except PayTechError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(PaymentSerializer(payment).data)


class PaymentStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, reference):
        try:
            payment = Payment.objects.select_related('order', 'buyer').get(reference=reference)
        except Payment.DoesNotExist:
            return Response({'error': 'Paiement introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if payment.buyer_id:
            if not request.user.is_authenticated or (
                payment.buyer_id != request.user.id and request.user.role != 'ADMIN'
            ):
                return Response({'error': 'Acces refuse.'}, status=status.HTTP_403_FORBIDDEN)
        else:
            token = request.query_params.get('token', '')
            if not token or str(payment.order.guest_access_token) != token:
                return Response({'error': 'Acces refuse.'}, status=status.HTTP_403_FORBIDDEN)

        return Response(PaymentSerializer(payment).data)


class AdminPaymentListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        payments = Payment.objects.select_related('order', 'buyer').order_by('-created_at')
        if status_filter := request.query_params.get('status'):
            payments = payments.filter(status=status_filter.upper())
        if provider := request.query_params.get('provider'):
            payments = payments.filter(provider=provider.upper())
        return Response(AdminPaymentSerializer(payments[:100], many=True).data)


class PayTechWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @transaction.atomic
    def post(self, request):
        if not verify_webhook_signature(request):
            return Response({'error': 'Signature invalide.'}, status=status.HTTP_403_FORBIDDEN)

        payload = request.data.copy()
        reference = (
            payload.get('ref_command')
            or payload.get('reference')
            or payload.get('custom_field')
        )
        if not reference:
            return Response({'error': 'Reference manquante.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.select_for_update().select_related('order').get(reference=reference)
        except Payment.DoesNotExist:
            return Response({'error': 'Paiement introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        payment.raw_webhook = dict(payload)
        if webhook_marks_paid(payload):
            payment.status = Payment.Status.PAID
            payment.paid_at = timezone.now()
            provider_ref = payload.get('token') or payload.get('payment_reference') or payload.get('transaction_id')
            if provider_ref:
                payment.provider_reference = str(provider_ref)
            payment.save(update_fields=['status', 'paid_at', 'provider_reference', 'raw_webhook', 'updated_at'])

            order = payment.order
            if order.status != Order.Status.PAID:
                order.status = Order.Status.PAID
                order.save(update_fields=['status', 'updated_at'])
                transaction.on_commit(
                    lambda paid_order=order: credit_wallet_from_order(paid_order)
                )
            transaction.on_commit(
                lambda payment_id=payment.id: send_payment_confirmation_email(payment_id)
            )
        else:
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=['status', 'raw_webhook', 'updated_at'])

        return Response({'received': True})
