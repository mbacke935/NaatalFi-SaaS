from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import CustomUser
from .models import AdminAuditLog
from .serializers import AdminAuditLogSerializer
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
