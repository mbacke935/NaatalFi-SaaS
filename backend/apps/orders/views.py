from decimal import Decimal
from collections import defaultdict

from django.db import transaction
from django.db.models import F
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Order, OrderItem
from .serializers import OrderSerializer, CreateOrderSerializer
from apps.products.models import Product, ProductVariant


# Transitions autorisées par le vendeur
VALID_TRANSITIONS = {
    'PENDING':    ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED':  ['PROCESSING', 'CANCELLED'],
    'PROCESSING': ['SHIPPED'],
    'SHIPPED':    ['DELIVERED'],
}


def _restore_stock(order):
    for item in order.items.filter(variant__isnull=False):
        ProductVariant.objects.filter(pk=item.variant_id).update(
            stock=F('stock') + item.quantity
        )


# ── Acheteur ──────────────────────────────────────────────────────────

class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        ser = CreateOrderSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        resolved = []
        for cart_item in data['items']:
            try:
                product = (
                    Product.objects
                    .select_related('vendor')
                    .prefetch_related('images')
                    .get(pk=cart_item['product_id'], status=Product.Status.PUBLISHED)
                )
            except Product.DoesNotExist:
                return Response(
                    {'error': f"Produit #{cart_item['product_id']} introuvable ou indisponible."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            variant = None
            if cart_item.get('variant_id'):
                try:
                    variant = ProductVariant.objects.select_for_update().get(
                        pk=cart_item['variant_id'], product=product
                    )
                except ProductVariant.DoesNotExist:
                    return Response(
                        {'error': f"Variante introuvable pour {product.name}."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if variant.stock < cart_item['quantity']:
                    return Response(
                        {
                            'error': (
                                f"Stock insuffisant pour {product.name} "
                                f"({variant.name}: {variant.value}). "
                                f"Disponible : {variant.stock}."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            resolved.append({
                'product':  product,
                'variant':  variant,
                'quantity': cart_item['quantity'],
            })

        # Regrouper par vendeur
        by_vendor = defaultdict(list)
        for item in resolved:
            by_vendor[item['product'].vendor_id].append(item)

        created_orders = []
        for vendor_id, vitems in by_vendor.items():
            total = Decimal('0.00')
            for item in vitems:
                price  = item['product'].price
                price += item['variant'].price_delta if item['variant'] else Decimal('0.00')
                total += price * item['quantity']

            order = Order.objects.create(
                buyer=request.user,
                vendor_id=vendor_id,
                status=Order.Status.PENDING,
                total=total,
                delivery_address=data['delivery_address'],
                notes=data.get('notes', ''),
            )

            for item in vitems:
                unit_price    = item['product'].price + (item['variant'].price_delta if item['variant'] else Decimal('0.00'))
                variant_label = f"{item['variant'].name}: {item['variant'].value}" if item['variant'] else ''
                cover         = item['product'].images.filter(is_cover=True).first() or item['product'].images.first()

                OrderItem.objects.create(
                    order         = order,
                    product       = item['product'],
                    variant       = item['variant'],
                    product_name  = item['product'].name,
                    product_slug  = item['product'].slug,
                    variant_label = variant_label,
                    cover_image   = cover.image_url if cover else None,
                    unit_price    = unit_price,
                    quantity      = item['quantity'],
                )

                if item['variant']:
                    ProductVariant.objects.filter(pk=item['variant'].pk).update(
                        stock=F('stock') - item['quantity']
                    )

            created_orders.append(order)

        return Response(
            OrderSerializer(created_orders, many=True).data,
            status=status.HTTP_201_CREATED,
        )


class BuyerOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = (
            Order.objects
            .filter(buyer=request.user)
            .select_related('vendor')
            .prefetch_related('items')
        )
        return Response(OrderSerializer(orders, many=True).data)


class BuyerOrderDetailView(APIView):
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


class BuyerOrderCancelView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            order = Order.objects.select_for_update().get(pk=pk, buyer=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if order.status != Order.Status.PENDING:
            return Response(
                {'error': 'Seules les commandes en attente peuvent être annulées.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = Order.Status.CANCELLED
        order.save(update_fields=['status', 'updated_at'])
        _restore_stock(order)

        return Response({'status': 'CANCELLED'})


# ── Vendeur ───────────────────────────────────────────────────────────

class VendorOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            vendor = request.user.vendor
        except Exception:
            return Response({'error': 'Boutique introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        qs = (
            Order.objects
            .filter(vendor=vendor)
            .select_related('buyer')
            .prefetch_related('items')
        )
        if s := request.query_params.get('status'):
            qs = qs.filter(status=s)

        return Response(OrderSerializer(qs, many=True).data)


class VendorOrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            vendor = request.user.vendor
        except Exception:
            return Response({'error': 'Boutique introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            order = (
                Order.objects
                .select_related('vendor', 'buyer')
                .prefetch_related('items__product', 'items__variant')
                .get(pk=pk, vendor=vendor)
            )
        except Order.DoesNotExist:
            return Response({'error': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(OrderSerializer(order).data)


class VendorOrderStatusView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, pk):
        try:
            vendor = request.user.vendor
        except Exception:
            return Response({'error': 'Boutique introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            order = Order.objects.select_for_update().get(pk=pk, vendor=vendor)
        except Order.DoesNotExist:
            return Response({'error': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status', '')
        allowed    = VALID_TRANSITIONS.get(order.status, [])

        if new_status not in allowed:
            msg = f"Transition invalide depuis {order.status}. Autorisé : {', '.join(allowed) if allowed else 'aucun'}."
            return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)

        if new_status == 'CANCELLED':
            _restore_stock(order)

        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])

        return Response({'status': order.status})
