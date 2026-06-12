from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.serializers import ProductListSerializer
from apps.users.models import CustomUser
from apps.vendors.models import Vendor
from .models import AdCampaign
from .serializers import AdCampaignSerializer, CreateAdCampaignSerializer, UpdateAdCampaignSerializer
from .services import active_campaigns_queryset, create_campaign, register_click


class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == CustomUser.Role.ADMIN


def _get_vendor_or_404(request):
    try:
        return request.user.vendor, None
    except Vendor.DoesNotExist:
        return None, Response({'error': 'Boutique introuvable.'}, status=status.HTTP_404_NOT_FOUND)


class VendorAdCampaignListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vendor, err = _get_vendor_or_404(request)
        if err:
            return err
        campaigns = AdCampaign.objects.filter(vendor=vendor).select_related('product', 'vendor')
        return Response(AdCampaignSerializer(campaigns, many=True).data)

    def post(self, request):
        vendor, err = _get_vendor_or_404(request)
        if err:
            return err
        if vendor.status != Vendor.Status.APPROVED:
            return Response({'error': 'Votre boutique doit etre approuvee.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = CreateAdCampaignSerializer(data=request.data, context={'vendor': vendor})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            campaign = create_campaign(
                vendor=vendor,
                product=data['product'],
                budget=data['budget'],
                cost_per_click=data['cost_per_click'],
                start_date=data['start_date'],
                end_date=data['end_date'],
            )
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(AdCampaignSerializer(campaign).data, status=status.HTTP_201_CREATED)


class VendorAdCampaignDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        vendor, err = _get_vendor_or_404(request)
        if err:
            return err
        try:
            campaign = AdCampaign.objects.get(pk=pk, vendor=vendor)
        except AdCampaign.DoesNotExist:
            return Response({'error': 'Campagne introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateAdCampaignSerializer(campaign, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AdCampaignSerializer(campaign).data)


class SponsoredProductListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        campaigns = list(active_campaigns_queryset()[:3])
        products = []
        for campaign in campaigns:
            product = campaign.product
            product.is_sponsored = True
            product.ad_campaign_id = campaign.id
            products.append(product)
        return Response(ProductListSerializer(products, many=True).data)


class AdCampaignClickView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, pk):
        try:
            campaign = AdCampaign.objects.get(pk=pk, status=AdCampaign.Status.ACTIVE)
        except AdCampaign.DoesNotExist:
            return Response({'error': 'Campagne introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        register_click(campaign)
        return Response({'tracked': True})


class AdminAdCampaignListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        campaigns = AdCampaign.objects.select_related('vendor', 'product').order_by('-created_at')
        if status_filter := request.query_params.get('status'):
            campaigns = campaigns.filter(status=status_filter.upper())
        return Response(AdCampaignSerializer(campaigns[:200], many=True).data)

