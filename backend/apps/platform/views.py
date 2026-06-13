from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.internal.audit import log_admin_action
from apps.internal.models import AdminAuditLog
from apps.users.models import CustomUser
from apps.vendors.models import VendorPlan

from .serializers import PlatformSettingsSerializer
from .services import get_platform_settings


def _money(value):
    return f'{value:.2f}'


class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == CustomUser.Role.ADMIN


class PublicPlatformSettingsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response(PlatformSettingsSerializer(get_platform_settings()).data)


class AdminPlatformSettingsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(PlatformSettingsSerializer(get_platform_settings()).data)

    def patch(self, request):
        settings = get_platform_settings()
        old_commission_rate = settings.commission_rate
        serializer = PlatformSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if 'commission_rate' in serializer.validated_data:
            VendorPlan.objects.update(commission_rate=serializer.validated_data['commission_rate'])
            log_admin_action(
                request,
                AdminAuditLog.Action.PLATFORM_COMMISSION_UPDATED,
                target=settings,
                metadata={
                    'before': _money(old_commission_rate),
                    'after': _money(serializer.validated_data['commission_rate']),
                },
            )
        else:
            log_admin_action(
                request,
                AdminAuditLog.Action.PLATFORM_SETTINGS_UPDATED,
                target=settings,
                metadata={'changed_fields': sorted(serializer.validated_data.keys())},
            )
        return Response(serializer.data)
