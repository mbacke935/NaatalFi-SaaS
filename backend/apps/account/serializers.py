from rest_framework import serializers
from .models import Address, Favorite
from apps.products.serializers import ProductListSerializer


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model            = Address
        fields           = ['id', 'label', 'full_name', 'phone', 'street', 'city', 'region', 'is_default', 'created_at']
        read_only_fields = ['id', 'created_at']


class FavoriteSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model            = Favorite
        fields           = ['id', 'product', 'created_at']
        read_only_fields = ['id', 'created_at']
