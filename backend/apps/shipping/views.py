from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from .models import ShippingZone, ShippingRate
from .serializers import (
    ShippingZoneSerializer,
    CreateShippingZoneSerializer,
    EstimateShippingSerializer,
    SENEGAL_REGIONS,
)
from .services import estimate_shipping_for_vendors


def _get_vendor_or_404(request):
    try:
        return request.user.vendor, None
    except Exception:
        return None, Response({'error': 'Boutique introuvable.'}, status=status.HTTP_404_NOT_FOUND)


class ShippingZoneListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vendor, err = _get_vendor_or_404(request)
        if err:
            return err
        zones = vendor.shipping_zones.prefetch_related('rates').all()
        return Response(ShippingZoneSerializer(zones, many=True).data)

    def post(self, request):
        vendor, err = _get_vendor_or_404(request)
        if err:
            return err

        ser = CreateShippingZoneSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        zone = ShippingZone.objects.create(
            vendor=vendor,
            name=d['name'],
            regions=d['regions'],
        )
        ShippingRate.objects.create(
            zone=zone,
            price=d['price'],
            estimated_days=d['estimated_days'],
        )
        zone = ShippingZone.objects.prefetch_related('rates').get(pk=zone.pk)
        return Response(ShippingZoneSerializer(zone).data, status=status.HTTP_201_CREATED)


class ShippingZoneDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_zone(self, request, pk):
        vendor, err = _get_vendor_or_404(request)
        if err:
            return None, err
        try:
            zone = vendor.shipping_zones.prefetch_related('rates').get(pk=pk)
            return zone, None
        except ShippingZone.DoesNotExist:
            return None, Response({'error': 'Zone introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    def get(self, request, pk):
        zone, err = self._get_zone(request, pk)
        if err:
            return err
        return Response(ShippingZoneSerializer(zone).data)

    def patch(self, request, pk):
        zone, err = self._get_zone(request, pk)
        if err:
            return err

        for field in ('name', 'is_active'):
            if field in request.data:
                setattr(zone, field, request.data[field])

        if 'regions' in request.data:
            regions = request.data['regions']
            if not regions:
                return Response({'error': 'Au moins une région est requise.'}, status=400)
            for r in regions:
                if r not in SENEGAL_REGIONS:
                    return Response({'error': f"Région '{r}' non reconnue."}, status=400)
            zone.regions = regions

        zone.save()

        rate = zone.rates.first()
        price_changed = 'price' in request.data
        days_changed  = 'estimated_days' in request.data
        if rate and (price_changed or days_changed):
            if price_changed:
                rate.price = request.data['price']
            if days_changed:
                rate.estimated_days = request.data['estimated_days']
            rate.save()
        elif not rate and price_changed:
            ShippingRate.objects.create(
                zone=zone,
                price=request.data['price'],
                estimated_days=request.data.get('estimated_days', 2),
            )

        zone = ShippingZone.objects.prefetch_related('rates').get(pk=zone.pk)
        return Response(ShippingZoneSerializer(zone).data)

    def delete(self, request, pk):
        zone, err = self._get_zone(request, pk)
        if err:
            return err
        zone.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EstimateShippingView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = EstimateShippingSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = estimate_shipping_for_vendors(
            ser.validated_data['vendor_ids'],
            ser.validated_data['region'],
        )
        return Response(result)


class RegionListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(SENEGAL_REGIONS)
