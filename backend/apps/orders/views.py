from decimal import Decimal
from collections import defaultdict

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from .models import Order, VendorOrder, OrderItem
from .serializers import (
    OrderSerializer,
    VendorOrderWithBuyerSerializer,
    CreateOrderSerializer,
    CartValidateSerializer,
)
from .services import restore_stock_for_vendor_order
from apps.products.models import Product, ProductVariant
from apps.shipping.services import get_shipping_rate
from apps.users.models import CustomUser
from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from tasks.orders import send_order_confirmation_email, send_vendor_new_order_email


# Transitions autorisées côté vendeur (sur VendorOrder)
VALID_TRANSITIONS = {
    'PENDING':    ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED':  ['PROCESSING', 'CANCELLED'],
    'PROCESSING': ['SHIPPED'],
    'SHIPPED':    ['DELIVERED'],
}


def _item_unit_price(product, variant):
    if variant and variant.price_delta > 0:
        return variant.price_delta
    return product.price


def _restore_stock_for_vendor_order(vendor_order):
    restore_stock_for_vendor_order(vendor_order)


# ── Phase 7 — Validation du panier ────────────────────────────────────

class CartValidateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = CartValidateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        errors = []
        for item in ser.validated_data['items']:
            vid = item.get('variant_id')
            if not vid and not Product.objects.filter(
                pk=item['product_id'],
                status=Product.Status.PUBLISHED,
                vendor__status='APPROVED',
            ).exists():
                errors.append({
                    'product_id': item['product_id'],
                    'error':      'Produit indisponible.',
                })
            if not vid:
                continue  # pas de variante = pas de stock à vérifier

            try:
                variant = (
                    ProductVariant.objects
                    .select_related('product__vendor')
                    .get(pk=vid)
                )
            except ProductVariant.DoesNotExist:
                errors.append({
                    'product_id': item['product_id'],
                    'variant_id': vid,
                    'error':      'Variante introuvable.',
                })
                continue

            if variant.product_id != item['product_id']:
                errors.append({
                    'product_id': item['product_id'],
                    'variant_id': vid,
                    'error':      'Variante incompatible avec ce produit.',
                })
                continue

            if (
                variant.product.status != Product.Status.PUBLISHED
                or variant.product.vendor.status != 'APPROVED'
            ):
                errors.append({
                    'product_id': item['product_id'],
                    'variant_id': vid,
                    'error':      'Produit indisponible.',
                })
                continue

            if variant.stock < item['quantity']:
                errors.append({
                    'product_id':    item['product_id'],
                    'variant_id':    vid,
                    'product_name':  variant.product.name,
                    'variant_label': f"{variant.name}: {variant.value}",
                    'requested':     item['quantity'],
                    'available':     variant.stock,
                })

        if errors:
            return Response({'valid': False, 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'valid': True})


# ── Acheteur ──────────────────────────────────────────────────────────

class CreateOrderView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'checkout_guest'

    @transaction.atomic
    def post(self, request):
        ser = CreateOrderSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        user = request.user if request.user.is_authenticated else None
        if not user:
            missing = []
            if not data.get('guest_name', '').strip():
                missing.append('guest_name')
            if not data.get('guest_email', '').strip():
                missing.append('guest_email')
            if not data.get('guest_phone', '').strip():
                missing.append('guest_phone')
            if missing:
                return Response(
                    {'error': 'Nom, email et telephone sont requis pour commander sans compte.', 'missing': missing},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Résolution des produits + variantes
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
            if product.vendor.status != 'APPROVED':
                return Response(
                    {'error': f"Produit #{product.id} indisponible."},
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
                        {'error': (
                            f"Stock insuffisant pour {product.name} "
                            f"({variant.name}: {variant.value}). "
                            f"Disponible : {variant.stock}."
                        )},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            resolved.append({
                'product':  product,
                'variant':  variant,
                'quantity': cart_item['quantity'],
            })

        # Créer le Order parent (1 par checkout)
        order = Order.objects.create(
            buyer            = user,
            guest_name       = data.get('guest_name', '').strip() if not user else '',
            guest_email      = data.get('guest_email', '').strip() if not user else '',
            guest_phone      = data.get('guest_phone', '').strip() if not user else '',
            status           = Order.Status.PENDING,
            delivery_address = data['delivery_address'],
            notes            = data.get('notes', ''),
        )

        # Regrouper par vendeur → créer N VendorOrders
        by_vendor = defaultdict(list)
        for item in resolved:
            by_vendor[item['product'].vendor_id].append(item)

        region = data.get('region', '')
        grand_total = Decimal('0.00')
        vendor_order_ids = []
        for vendor_id, vitems in by_vendor.items():
            subtotal = Decimal('0.00')
            for item in vitems:
                subtotal += _item_unit_price(item['product'], item['variant']) * item['quantity']

            shipping_cost, _ = get_shipping_rate(vendor_id, region)

            vendor_order = VendorOrder.objects.create(
                order         = order,
                vendor_id     = vendor_id,
                status        = VendorOrder.Status.PENDING,
                subtotal      = subtotal,
                shipping_cost = shipping_cost,
            )
            vendor_order_ids.append(vendor_order.id)

            for item in vitems:
                unit_price    = _item_unit_price(item['product'], item['variant'])
                variant_label = f"{item['variant'].name}: {item['variant'].value}" if item['variant'] else ''
                cover         = item['product'].images.filter(is_cover=True).first() or item['product'].images.first()

                OrderItem.objects.create(
                    vendor_order  = vendor_order,
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

            grand_total += subtotal + shipping_cost

        order.total = grand_total
        order.save(update_fields=['total'])

        transaction.on_commit(
            lambda order_id=order.id: send_order_confirmation_email(order_id)
        )
        for vendor_order_id in vendor_order_ids:
            transaction.on_commit(
                lambda vo_id=vendor_order_id: send_vendor_new_order_email(vo_id)
            )

        # Recharger avec toutes les relations pour la réponse
        order = (
            Order.objects
            .prefetch_related('vendor_orders__items', 'vendor_orders__vendor')
            .get(pk=order.pk)
        )
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class BuyerOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = (
            Order.objects
            .filter(buyer=request.user)
            .prefetch_related('vendor_orders__items', 'vendor_orders__vendor')
        )
        return Response(OrderSerializer(orders, many=True).data)


class BuyerOrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            order = (
                Order.objects
                .prefetch_related('vendor_orders__items__product', 'vendor_orders__items__variant', 'vendor_orders__vendor')
                .get(pk=pk, buyer=request.user)
            )
        except Order.DoesNotExist:
            return Response({'error': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order).data)


class GuestOrderDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        token = request.headers.get('X-Guest-Token') or request.query_params.get('token', '')
        try:
            order = (
                Order.objects
                .prefetch_related('vendor_orders__items__product', 'vendor_orders__items__variant', 'vendor_orders__vendor')
                .get(pk=pk, buyer__isnull=True, guest_access_token=token)
            )
        except (Order.DoesNotExist, ValueError, ValidationError):
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

        cancellable = order.vendor_orders.filter(
            status__in=[VendorOrder.Status.PENDING, VendorOrder.Status.CONFIRMED]
        )
        for vo in cancellable:
            _restore_stock_for_vendor_order(vo)
            vo.status = VendorOrder.Status.CANCELLED
            vo.save(update_fields=['status', 'updated_at'])

        order.status = Order.Status.CANCELLED
        order.save(update_fields=['status', 'updated_at'])

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
            VendorOrder.objects
            .filter(vendor=vendor)
            .select_related('order__buyer')
            .prefetch_related('items')
        )
        if s := request.query_params.get('status'):
            qs = qs.filter(status=s)

        return Response(VendorOrderWithBuyerSerializer(qs, many=True).data)


class VendorOrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            vendor = request.user.vendor
        except Exception:
            return Response({'error': 'Boutique introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            vo = (
                VendorOrder.objects
                .select_related('order__buyer', 'vendor')
                .prefetch_related('items__product', 'items__variant')
                .get(pk=pk, vendor=vendor)
            )
        except VendorOrder.DoesNotExist:
            return Response({'error': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(VendorOrderWithBuyerSerializer(vo).data)


class VendorOrderStatusView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, pk):
        try:
            vendor = request.user.vendor
        except Exception:
            return Response({'error': 'Boutique introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            vo = VendorOrder.objects.select_for_update().select_related('order__buyer').get(pk=pk, vendor=vendor)
        except VendorOrder.DoesNotExist:
            return Response({'error': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status', '')
        allowed    = VALID_TRANSITIONS.get(vo.status, [])

        if new_status not in allowed:
            msg = f"Transition invalide depuis {vo.status}. Autorisé : {', '.join(allowed) if allowed else 'aucun'}."
            return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)

        if new_status == 'CANCELLED':
            _restore_stock_for_vendor_order(vo)

        vo.status = new_status
        vo.save(update_fields=['status', 'updated_at'])
        if vo.order.buyer_id:
            create_notification(
                user=vo.order.buyer,
                type=Notification.Type.ORDER,
                title=f"Commande vendeur #{vo.id} : {vo.status}",
                message=f"Une partie de votre commande #{vo.order_id} est maintenant {vo.status}.",
                link_url=f"/account/orders/{vo.order_id}",
            )

        return Response({'status': vo.status})


# ── Admin ─────────────────────────────────────────────────────────────

class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == CustomUser.Role.ADMIN


class AdminOrderListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = (
            VendorOrder.objects
            .select_related('order__buyer', 'vendor')
            .prefetch_related('items')
            .order_by('-created_at')
        )
        if s := request.query_params.get('status'):
            qs = qs.filter(status=s.upper())
        return Response(VendorOrderWithBuyerSerializer(qs[:100], many=True).data)


class AdminStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from django.db.models import Sum, Count
        from apps.vendors.models import Vendor
        from apps.wallet.models import PayoutRequest

        paid_statuses = [
            VendorOrder.Status.CONFIRMED, VendorOrder.Status.PROCESSING,
            VendorOrder.Status.SHIPPED,   VendorOrder.Status.DELIVERED,
        ]
        gmv_agg = VendorOrder.objects.filter(status__in=paid_statuses).aggregate(
            subtotal=Sum('subtotal'), shipping=Sum('shipping_cost')
        )
        gmv = (gmv_agg['subtotal'] or 0) + (gmv_agg['shipping'] or 0)

        payout_agg = PayoutRequest.objects.filter(
            status=PayoutRequest.Status.PENDING
        ).aggregate(count=Count('id'), amount=Sum('amount'))

        return Response({
            'total_users':            CustomUser.objects.count(),
            'total_vendors':          Vendor.objects.count(),
            'pending_vendors':        Vendor.objects.filter(status=Vendor.Status.PENDING).count(),
            'total_orders':           Order.objects.count(),
            'paid_orders':            Order.objects.filter(status=Order.Status.PAID).count(),
            'gmv':                    str(gmv),
            'pending_payouts':        payout_agg['count'] or 0,
            'pending_payouts_amount': str(payout_agg['amount'] or 0),
        })
