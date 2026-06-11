from rest_framework import serializers

from apps.orders.models import VendorOrder
from apps.products.models import Product
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    vendor_slug = serializers.CharField(source='vendor.slug', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id',
            'author_name',
            'product',
            'product_name',
            'product_slug',
            'vendor',
            'vendor_name',
            'vendor_slug',
            'vendor_order',
            'rating',
            'comment',
            'is_verified_purchase',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'author_name',
            'product',
            'product_name',
            'product_slug',
            'vendor',
            'vendor_name',
            'vendor_slug',
            'vendor_order',
            'is_verified_purchase',
            'created_at',
            'updated_at',
        ]

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.email


class CreateReviewSerializer(serializers.Serializer):
    vendor_order_id = serializers.IntegerField()
    product_id = serializers.IntegerField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=2000)

    def validate(self, attrs):
        request = self.context['request']
        try:
            vendor_order = (
                VendorOrder.objects
                .select_related('order__buyer', 'vendor')
                .prefetch_related('items')
                .get(pk=attrs['vendor_order_id'])
            )
        except VendorOrder.DoesNotExist:
            raise serializers.ValidationError({'vendor_order_id': 'Commande vendeur introuvable.'})

        if vendor_order.order.buyer_id != request.user.id:
            raise serializers.ValidationError({'vendor_order_id': 'Cette commande ne vous appartient pas.'})

        if vendor_order.status != VendorOrder.Status.DELIVERED:
            raise serializers.ValidationError({'vendor_order_id': 'Seules les commandes livrees peuvent etre notees.'})

        try:
            product = Product.objects.get(pk=attrs['product_id'])
        except Product.DoesNotExist:
            raise serializers.ValidationError({'product_id': 'Produit introuvable.'})

        if not vendor_order.items.filter(product_id=product.id).exists():
            raise serializers.ValidationError({'product_id': 'Ce produit ne fait pas partie de cette commande.'})

        if Review.objects.filter(
            author=request.user,
            vendor_order=vendor_order,
            product=product,
        ).exists():
            raise serializers.ValidationError({'product_id': 'Vous avez deja laisse un avis pour ce produit.'})

        attrs['vendor_order'] = vendor_order
        attrs['product'] = product
        attrs['vendor'] = vendor_order.vendor
        return attrs

    def create(self, validated_data):
        return Review.objects.create(
            author=self.context['request'].user,
            product=validated_data['product'],
            vendor=validated_data['vendor'],
            vendor_order=validated_data['vendor_order'],
            rating=validated_data['rating'],
            comment=validated_data.get('comment', ''),
            is_verified_purchase=True,
        )

