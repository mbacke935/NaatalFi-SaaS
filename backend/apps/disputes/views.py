from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import CustomUser
from .models import Dispute
from .serializers import CreateDisputeSerializer, DisputeSerializer, ResolveDisputeSerializer
from .services import create_dispute, resolve_dispute


class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == CustomUser.Role.ADMIN


def _queryset():
    return (
        Dispute.objects
        .select_related('order__buyer', 'vendor_order__vendor__user')
        .order_by('-created_at')
    )


class DisputeListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        disputes = _queryset().filter(initiator=request.user)
        return Response(DisputeSerializer(disputes, many=True).data)

    def post(self, request):
        serializer = CreateDisputeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        dispute = create_dispute(
            vendor_order=serializer.validated_data['vendor_order'],
            initiator=request.user,
            reason=serializer.validated_data['reason'],
            description=serializer.validated_data.get('description', ''),
        )
        return Response(DisputeSerializer(dispute).data, status=status.HTTP_201_CREATED)


class DisputeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            dispute = _queryset().get(pk=pk)
        except Dispute.DoesNotExist:
            return Response({'error': 'Litige introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        is_buyer = dispute.initiator_id == request.user.id
        is_vendor = hasattr(request.user, 'vendor') and dispute.vendor_order.vendor_id == request.user.vendor.id
        is_admin = request.user.role == CustomUser.Role.ADMIN
        if not (is_buyer or is_vendor or is_admin):
            return Response({'error': 'Acces refuse.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(DisputeSerializer(dispute).data)


class VendorDisputeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            vendor = request.user.vendor
        except Exception:
            return Response({'error': 'Boutique introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        disputes = _queryset().filter(vendor_order__vendor=vendor)
        return Response(DisputeSerializer(disputes, many=True).data)


class AdminDisputeListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        disputes = _queryset()
        if status_filter := request.query_params.get('status'):
            disputes = disputes.filter(status=status_filter.upper())
        return Response(DisputeSerializer(disputes[:200], many=True).data)


class AdminResolveDisputeView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            dispute = Dispute.objects.get(pk=pk)
        except Dispute.DoesNotExist:
            return Response({'error': 'Litige introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ResolveDisputeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            dispute = resolve_dispute(
                dispute=dispute,
                resolution=serializer.validated_data['resolution'],
                note=serializer.validated_data.get('note', ''),
            )
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DisputeSerializer(dispute).data)

