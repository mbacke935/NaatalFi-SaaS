from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import CustomUser

from .services import admin_overview, admin_top_vendors, vendor_analytics


class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == CustomUser.Role.ADMIN


class AdminAnalyticsOverviewView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(admin_overview(request.query_params.get('period', '30d')))


class AdminAnalyticsVendorsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(admin_top_vendors(request.query_params.get('period', '30d')))


class VendorAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            vendor = request.user.vendor
        except Exception:
            return Response({'error': 'Boutique introuvable.'}, status=404)
        return Response(vendor_analytics(vendor, request.query_params.get('period', '30d')))

