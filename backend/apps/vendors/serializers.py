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
            'phone', 'whatsapp', 'contact_email', 'address', 'city', 'region',
            'facebook_url', 'instagram_url', 'tiktok_url', 'website_url',
            'status', 'trust_score', 'plan', 'created_at',
        ]
        read_only_fields = ['id', 'slug', 'status', 'trust_score', 'logo', 'plan', 'created_at']


class CreateVendorSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Vendor
        fields = [
            'name', 'description', 'phone', 'whatsapp', 'contact_email',
            'address', 'city', 'region', 'facebook_url', 'instagram_url',
            'tiktok_url', 'website_url',
        ]


class AdminVendorSerializer(serializers.ModelSerializer):
    plan       = VendorPlanSerializer(read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name  = serializers.CharField(source='user.get_full_name', read_only=True)
    wallet     = serializers.SerializerMethodField()
    stats      = serializers.SerializerMethodField()

    class Meta:
        model  = Vendor
        fields = [
            'id', 'name', 'slug', 'description', 'logo',
            'phone', 'whatsapp', 'contact_email', 'address', 'city', 'region',
            'facebook_url', 'instagram_url', 'tiktok_url', 'website_url',
            'status', 'trust_score', 'plan', 'user_email', 'user_name',
            'wallet', 'stats', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'slug', 'trust_score', 'logo', 'plan',
            'user_email', 'user_name', 'created_at', 'updated_at',
        ]

    def get_wallet(self, obj):
        try:
            wallet = obj.wallet
        except Exception:
            return None
        return {
            'pending_balance': str(wallet.pending_balance),
            'available_balance': str(wallet.available_balance),
            'frozen_balance': str(wallet.frozen_balance),
        }

    def get_stats(self, obj):
        return {
            'products': obj.products.count() if hasattr(obj, 'products') else 0,
            'orders': obj.vendor_orders.count() if hasattr(obj, 'vendor_orders') else 0,
        }
