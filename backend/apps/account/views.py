from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Address, Favorite
from .serializers import AddressSerializer, FavoriteSerializer
from apps.products.models import Product
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer
from apps.users.serializers import UserSerializer


# ── Profil ────────────────────────────────────────────────────────────

class AccountProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        ser = UserSerializer(request.user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


# ── Commandes ─────────────────────────────────────────────────────────

class AccountOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = (
            Order.objects
            .filter(buyer=request.user)
            .select_related('vendor')
            .prefetch_related('items')
            .order_by('-created_at')
        )
        return Response(OrderSerializer(orders, many=True).data)


class AccountOrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            order = (
                Order.objects
                .select_related('vendor', 'buyer')
                .prefetch_related('items__product', 'items__variant')
                .get(pk=pk, buyer=request.user)
            )
        except Order.DoesNotExist:
            return Response({'error': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order).data)


# ── Adresses ──────────────────────────────────────────────────────────

class AddressListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs  = Address.objects.filter(user=request.user)
        return Response(AddressSerializer(qs, many=True).data)

    @transaction.atomic
    def post(self, request):
        ser = AddressSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        if ser.validated_data.get('is_default'):
            Address.objects.filter(user=request.user, is_default=True).update(is_default=False)

        addr = ser.save(user=request.user)
        return Response(AddressSerializer(addr).data, status=status.HTTP_201_CREATED)


class AddressDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, pk):
        try:
            return Address.objects.get(pk=pk, user=request.user)
        except Address.DoesNotExist:
            return None

    @transaction.atomic
    def patch(self, request, pk):
        addr = self._get(request, pk)
        if not addr:
            return Response({'error': 'Adresse introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        ser = AddressSerializer(addr, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)

        if ser.validated_data.get('is_default'):
            Address.objects.filter(user=request.user, is_default=True).update(is_default=False)

        ser.save()
        return Response(ser.data)

    def delete(self, request, pk):
        addr = self._get(request, pk)
        if not addr:
            return Response({'error': 'Adresse introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        addr.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Favoris ───────────────────────────────────────────────────────────

class FavoriteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            Favorite.objects
            .filter(user=request.user)
            .select_related('product__category', 'product__vendor')
            .prefetch_related('product__images')
        )
        return Response(FavoriteSerializer(qs, many=True).data)


class FavoriteDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, product_id):
        try:
            product = Product.objects.get(pk=product_id, status=Product.Status.PUBLISHED)
        except Product.DoesNotExist:
            return Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        fav, created = Favorite.objects.get_or_create(user=request.user, product=product)
        return Response(
            {'favorited': True},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, product_id):
        deleted, _ = Favorite.objects.filter(user=request.user, product_id=product_id).delete()
        if not deleted:
            return Response({'error': 'Favori introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
