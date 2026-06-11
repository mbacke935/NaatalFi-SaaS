from rest_framework import serializers
from .models import Order, OrderItem


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


class OrderSerializer(serializers.ModelSerializer):
    items        = OrderItemSerializer(many=True, read_only=True)
    vendor_name  = serializers.CharField(source='vendor.name',          read_only=True)
    vendor_slug  = serializers.CharField(source='vendor.slug',          read_only=True)
    buyer_name   = serializers.SerializerMethodField()
    buyer_email  = serializers.EmailField(source='buyer.email',         read_only=True)

    class Meta:
        model  = Order
        fields = [
            'id', 'status', 'total', 'delivery_address', 'notes',
            'vendor_name', 'vendor_slug', 'buyer_name', 'buyer_email',
            'items', 'created_at', 'updated_at',
        ]

    def get_buyer_name(self, obj):
        return obj.buyer.get_full_name() or obj.buyer.email


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
