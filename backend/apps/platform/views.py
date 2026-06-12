from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import CustomUser

from .models import PlatformSettings
from .serializers import PlatformSettingsSerializer


def get_platform_settings():
    obj, _ = PlatformSettings.objects.get_or_create(singleton_key='default')
    return obj


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
        return Response(serializer.data)

