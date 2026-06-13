from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import CustomUser
from apps.vendors.models import VendorPlan

from .serializers import PlatformSettingsSerializer
from .services import get_platform_settings


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
        serializer = PlatformSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if 'commission_rate' in serializer.validated_data:
            VendorPlan.objects.update(commission_rate=serializer.validated_data['commission_rate'])
        return Response(serializer.data)
