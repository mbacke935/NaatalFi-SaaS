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
    buyer_email  = serializers.EmailField(source='order.buyer.email', read_only=True)
    delivery_address = serializers.CharField(source='order.delivery_address', read_only=True)
    notes        = serializers.CharField(source='order.notes', read_only=True)

    class Meta:
        model  = VendorOrder
        fields = [
            'id', 'vendor_name', 'vendor_slug',
            'status', 'subtotal', 'shipping_cost',
            'buyer_name', 'buyer_email',
            'delivery_address', 'notes',
            'items', 'created_at', 'updated_at',
        ]

    def get_buyer_name(self, obj):
        return obj.order.buyer.get_full_name() or obj.order.buyer.email


class OrderSerializer(serializers.ModelSerializer):
    vendor_orders = VendorOrderSerializer(many=True, read_only=True)
    buyer_name    = serializers.SerializerMethodField()
    buyer_email   = serializers.EmailField(source='buyer.email', read_only=True)
    cover_image   = serializers.SerializerMethodField()
    item_count    = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            'id', 'status', 'total', 'delivery_address', 'notes',
            'buyer_name', 'buyer_email',
            'vendor_orders', 'cover_image', 'item_count',
            'created_at', 'updated_at',
        ]

    def get_buyer_name(self, obj):
        return obj.buyer.get_full_name() or obj.buyer.email

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
    delivery_address = serializers.CharField(min_length=5)
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
