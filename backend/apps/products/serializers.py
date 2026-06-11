from rest_framework import serializers
from .models import Product, ProductImage, ProductVariant


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductImage
        fields = ['id', 'image_url', 'order', 'is_cover']


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductVariant
        fields = ['id', 'name', 'value', 'stock', 'price_delta']


class ProductListSerializer(serializers.ModelSerializer):
    cover_image   = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    vendor_name   = serializers.CharField(source='vendor.name', read_only=True)
    image_count   = serializers.IntegerField(source='images.count', read_only=True)
    variant_count = serializers.IntegerField(source='variants.count', read_only=True)

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'slug', 'price', 'status',
            'cover_image', 'image_count', 'variant_count',
            'category', 'category_name', 'vendor_name', 'created_at',
        ]

    def get_cover_image(self, obj):
        img = obj.images.filter(is_cover=True).first() or obj.images.first()
        return img.image_url if img else None


class ProductDetailSerializer(serializers.ModelSerializer):
    images        = ProductImageSerializer(many=True, read_only=True)
    variants      = ProductVariantSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    vendor_name   = serializers.CharField(source='vendor.name', read_only=True)

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'status', 'trust_score',
            'category', 'category_name', 'vendor_name',
            'images', 'variants', 'created_at', 'updated_at',
        ]


class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Product
        fields = ['name', 'description', 'price', 'status', 'category']

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('Le prix doit être supérieur à 0.')
        return value


class ProductVariantWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductVariant
        fields = ['name', 'value', 'stock', 'price_delta']
