from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import CustomUser
from .audit import log_admin_action
from .models import AdminAuditLog, EmailLog
from .serializers import AdminAuditLogSerializer, EmailLogSerializer
from .services import run_scheduled_tasks


class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == CustomUser.Role.ADMIN


class CronRunView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        expected = getattr(settings, 'CRON_SECRET', '')
        provided = request.headers.get('X-CRON-SECRET', '')

        if not expected or provided != expected:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        result = run_scheduled_tasks()
        return Response(result)


class AdminAuditLogListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = AdminAuditLog.objects.select_related('actor').order_by('-created_at')
        if action := request.query_params.get('action'):
            qs = qs.filter(action=action.upper())
        if target_type := request.query_params.get('target_type'):
            qs = qs.filter(target_type=target_type)
        return Response(AdminAuditLogSerializer(qs[:200], many=True).data)


class AdminEmailLogListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = EmailLog.objects.order_by('-created_at', '-id')
        if status_filter := request.query_params.get('status'):
            qs = qs.filter(status=status_filter.upper())
        return Response(EmailLogSerializer(qs[:200], many=True).data)


class AdminEmailLogRetryView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            email = EmailLog.objects.get(pk=pk)
        except EmailLog.DoesNotExist:
            return Response({'detail': 'Email introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if email.status == EmailLog.Status.SENT:
            return Response({'detail': 'Cet email est deja envoye.'}, status=status.HTTP_400_BAD_REQUEST)
        if email.status != EmailLog.Status.FAILED:
            return Response({'detail': 'Seuls les emails echoues peuvent etre relances.'}, status=status.HTTP_400_BAD_REQUEST)

        previous_error = email.last_error
        email.status = EmailLog.Status.PENDING
        email.attempts = 0
        email.last_error = ''
        email.sent_at = None
        email.scheduled_at = timezone.now()
        email.save(update_fields=['status', 'attempts', 'last_error', 'sent_at', 'scheduled_at', 'updated_at'])

        log_admin_action(
            request,
            AdminAuditLog.Action.EMAIL_RETRY_REQUESTED,
            target=email,
            target_repr=f'{email.to_email} - {email.subject}',
            metadata={'previous_error': previous_error[:500]},
        )

        return Response(EmailLogSerializer(email).data)


class AdminAlertSummaryView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from apps.disputes.models import Dispute
        from apps.payments.models import Payment
        from apps.vendors.models import Vendor
        from apps.wallet.models import PayoutRequest

        return Response({
            'pending_vendors': Vendor.objects.filter(status=Vendor.Status.PENDING).count(),
            'pending_payouts': PayoutRequest.objects.filter(status=PayoutRequest.Status.PENDING).count(),
            'open_disputes': Dispute.objects.filter(
                status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW],
            ).count(),
            'pending_payments': Payment.objects.filter(status=Payment.Status.PENDING).count(),
            'failed_payments': Payment.objects.filter(status=Payment.Status.FAILED).count(),
            'failed_emails': EmailLog.objects.filter(status=EmailLog.Status.FAILED).count(),
        })
