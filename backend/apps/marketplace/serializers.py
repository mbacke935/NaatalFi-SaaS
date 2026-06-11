from rest_framework import serializers
from apps.vendors.models import Vendor
from apps.products.serializers import ProductListSerializer


class MarketplaceVendorSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    plan_name     = serializers.CharField(source='plan.name', read_only=True, default=None)

    class Meta:
        model  = Vendor
        fields = [
            'id', 'name', 'slug', 'description', 'logo',
            'phone', 'address', 'trust_score',
            'product_count', 'plan_name', 'created_at',
        ]

    def get_product_count(self, obj):
        return obj.products.filter(status='PUBLISHED').count()


class MarketplaceVendorDetailSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    products      = serializers.SerializerMethodField()

    class Meta:
        model  = Vendor
        fields = [
            'id', 'name', 'slug', 'description', 'logo',
            'phone', 'address', 'trust_score',
            'product_count', 'products', 'created_at',
        ]

    def get_product_count(self, obj):
        return obj.products.filter(status='PUBLISHED').count()

    def get_products(self, obj):
        qs = (
            obj.products
            .filter(status='PUBLISHED')
            .prefetch_related('images')
            .select_related('category')
            .order_by('-created_at')[:12]
        )
        return ProductListSerializer(qs, many=True).data
