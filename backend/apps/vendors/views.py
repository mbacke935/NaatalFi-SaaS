from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Vendor, VendorPlan
from .serializers import VendorSerializer, CreateVendorSerializer, AdminVendorSerializer
from apps.users.models import CustomUser
from utils.storage import upload_to_supabase
from tasks.vendors import send_vendor_approval_email, send_vendor_rejection_email


class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == CustomUser.Role.ADMIN


class CreateVendorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in [CustomUser.Role.VENDOR, CustomUser.Role.ADMIN]:
            return Response(
                {"error": "Seuls les utilisateurs avec le rôle Vendeur peuvent créer une boutique."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if Vendor.objects.filter(user=request.user).exists():
            return Response(
                {"error": "Vous avez déjà une boutique."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CreateVendorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        vendor = serializer.save(user=request.user)

        # Assign FREE plan by default
        try:
            free_plan = VendorPlan.objects.get(name=VendorPlan.Name.FREE)
            vendor.plan = free_plan
            vendor.save(update_fields=['plan'])
        except VendorPlan.DoesNotExist:
            pass

        return Response(VendorSerializer(vendor).data, status=status.HTTP_201_CREATED)


class MyVendorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            vendor = request.user.vendor
        except Vendor.DoesNotExist:
            return Response({"error": "Vous n'avez pas de boutique."}, status=status.HTTP_404_NOT_FOUND)
        return Response(VendorSerializer(vendor).data)

    def patch(self, request):
        try:
            vendor = request.user.vendor
        except Vendor.DoesNotExist:
            return Response({"error": "Vous n'avez pas de boutique."}, status=status.HTTP_404_NOT_FOUND)

        serializer = VendorSerializer(vendor, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class UploadLogoView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            vendor = request.user.vendor
        except Vendor.DoesNotExist:
            return Response({"error": "Vous n'avez pas de boutique."}, status=status.HTTP_404_NOT_FOUND)

        file = request.FILES.get('logo')
        if not file:
            return Response({"error": "Aucun fichier fourni."}, status=status.HTTP_400_BAD_REQUEST)

        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if file.content_type not in allowed_types:
            return Response(
                {"error": "Format non supporté. Utilisez JPG, PNG ou WebP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if file.size > 5 * 1024 * 1024:
            return Response({"error": "Fichier trop volumineux (max 5 Mo)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            url = upload_to_supabase(file, bucket='vendor-logos', folder=str(vendor.id))
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception:
            return Response(
                {"error": "Erreur lors de l'upload. Réessayez."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        vendor.logo = url
        vendor.save(update_fields=['logo'])
        return Response({"logo": url})


class AdminVendorListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        status_filter = request.query_params.get('status')
        vendors = Vendor.objects.select_related('user', 'plan').order_by('-created_at')
        if status_filter:
            vendors = vendors.filter(status=status_filter.upper())
        return Response(AdminVendorSerializer(vendors, many=True).data)


class AdminVendorDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            vendor = Vendor.objects.select_related('user', 'plan').get(pk=pk)
        except Vendor.DoesNotExist:
            return Response({"error": "Vendeur introuvable."}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminVendorSerializer(vendor).data)


class AdminApproveVendorView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            vendor = Vendor.objects.select_related('user').get(pk=pk)
        except Vendor.DoesNotExist:
            return Response({"error": "Vendeur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if vendor.status == Vendor.Status.APPROVED:
            return Response({"error": "Ce vendeur est déjà approuvé."}, status=status.HTTP_400_BAD_REQUEST)

        vendor.status = Vendor.Status.APPROVED
        vendor.save(update_fields=['status'])
        send_vendor_approval_email.delay(str(vendor.user.id))
        return Response(AdminVendorSerializer(vendor).data)


class AdminSuspendVendorView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            vendor = Vendor.objects.select_related('user').get(pk=pk)
        except Vendor.DoesNotExist:
            return Response({"error": "Vendeur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', '')
        vendor.status = Vendor.Status.SUSPENDED
        vendor.save(update_fields=['status'])
        send_vendor_rejection_email.delay(str(vendor.user.id), reason)
        return Response(AdminVendorSerializer(vendor).data)
