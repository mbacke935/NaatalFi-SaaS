from rest_framework import serializers
from .models import Order, VendorOrder, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model  = OrderItem
        fields = [
            'id', 'product', 'variant',
            'product_name', 'product_slug', 'variant_label',
            'cover_image', 'unit_price', 'quantity', 'subtotal',
        ]

    def get_subtotal(self, obj):
        return obj.unit_price * obj.quantity


class VendorOrderSerializer(serializers.ModelSerializer):
    items        = OrderItemSerializer(many=True, read_only=True)
    vendor_name  = serializers.CharField(source='vendor.name', read_only=True)
    vendor_slug  = serializers.CharField(source='vendor.slug', read_only=True)

    class Meta:
        model  = VendorOrder
        fields = [
            'id', 'vendor_name', 'vendor_slug',
            'status', 'subtotal', 'shipping_cost',
            'items', 'created_at', 'updated_at',
        ]


class VendorOrderWithBuyerSerializer(serializers.ModelSerializer):
    """Used by vendor dashboard — includes buyer info."""
    items        = OrderItemSerializer(many=True, read_only=True)
    vendor_name  = serializers.CharField(source='vendor.name', read_only=True)
    vendor_slug  = serializers.CharField(source='vendor.slug', read_only=True)
    buyer_name   = serializers.SerializerMethodField()
    buyer_email  = serializers.SerializerMethodField()
    buyer_phone  = serializers.CharField(source='order.guest_phone', read_only=True)
    delivery_address = serializers.CharField(source='order.delivery_address', read_only=True)
    notes        = serializers.CharField(source='order.notes', read_only=True)
    total        = serializers.SerializerMethodField()

    class Meta:
        model  = VendorOrder
        fields = [
            'id', 'vendor_name', 'vendor_slug',
            'status', 'subtotal', 'shipping_cost', 'total',
            'buyer_name', 'buyer_email', 'buyer_phone',
            'delivery_address', 'notes',
            'items', 'created_at', 'updated_at',
        ]

    def get_buyer_name(self, obj):
        if obj.order.buyer_id:
            return obj.order.buyer.get_full_name() or obj.order.buyer.email
        return obj.order.guest_name

    def get_buyer_email(self, obj):
        return obj.order.buyer.email if obj.order.buyer_id else obj.order.guest_email

    def get_total(self, obj):
        return obj.subtotal + obj.shipping_cost


class OrderSerializer(serializers.ModelSerializer):
    vendor_orders = VendorOrderSerializer(many=True, read_only=True)
    buyer_name    = serializers.SerializerMethodField()
    buyer_email   = serializers.SerializerMethodField()
    buyer_phone   = serializers.CharField(source='guest_phone', read_only=True)
    cover_image   = serializers.SerializerMethodField()
    item_count    = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            'id', 'status', 'total', 'delivery_address', 'notes',
            'buyer_name', 'buyer_email', 'buyer_phone', 'guest_access_token',
            'vendor_orders', 'cover_image', 'item_count',
            'created_at', 'updated_at',
        ]

    def get_buyer_name(self, obj):
        if obj.buyer_id:
            return obj.buyer.get_full_name() or obj.buyer.email
        return obj.guest_name

    def get_buyer_email(self, obj):
        return obj.buyer.email if obj.buyer_id else obj.guest_email

    def get_cover_image(self, obj):
        for vo in obj.vendor_orders.all():
            first = vo.items.first()
            if first and first.cover_image:
                return first.cover_image
        return None

    def get_item_count(self, obj):
        return sum(
            item.quantity
            for vo in obj.vendor_orders.all()
            for item in vo.items.all()
        )


# ── Sérializers d'entrée ──────────────────────────────────────────────

class CartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    variant_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    quantity   = serializers.IntegerField(min_value=1, max_value=99)


class CreateOrderSerializer(serializers.Serializer):
    guest_name       = serializers.CharField(required=False, allow_blank=True, default='')
    guest_email      = serializers.EmailField(required=False, allow_blank=True, default='')
    guest_phone      = serializers.CharField(required=False, allow_blank=True, default='')
    delivery_address = serializers.CharField(min_length=5)
    region           = serializers.CharField(required=False, allow_blank=True, default='')
    notes            = serializers.CharField(required=False, allow_blank=True, default='')
    items            = CartItemSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Au moins un article est requis.")
        return value


class CartValidateSerializer(serializers.Serializer):
    items = CartItemSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Au moins un article est requis.")
        return value
