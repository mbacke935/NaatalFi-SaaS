from rest_framework import serializers
from .models import Vendor, VendorPlan


class VendorPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VendorPlan
        fields = ['id', 'name', 'commission_rate', 'monthly_price', 'max_products']


class VendorSerializer(serializers.ModelSerializer):
    plan = VendorPlanSerializer(read_only=True)

    class Meta:
        model  = Vendor
        fields = [
            'id', 'name', 'slug', 'description', 'logo',
            'phone', 'address', 'status', 'trust_score', 'plan', 'created_at',
        ]
        read_only_fields = ['id', 'slug', 'status', 'trust_score', 'logo', 'plan', 'created_at']


class CreateVendorSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Vendor
        fields = ['name', 'description', 'phone', 'address']


class AdminVendorSerializer(serializers.ModelSerializer):
    plan       = VendorPlanSerializer(read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name  = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model  = Vendor
        fields = [
            'id', 'name', 'slug', 'description', 'logo', 'phone', 'address',
            'status', 'trust_score', 'plan', 'user_email', 'user_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'slug', 'trust_score', 'logo', 'plan',
            'user_email', 'user_name', 'created_at', 'updated_at',
        ]
