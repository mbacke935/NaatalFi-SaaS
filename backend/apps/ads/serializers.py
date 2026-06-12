from django.utils import timezone
from rest_framework import serializers

from apps.products.models import Product
from .models import AdCampaign


class AdCampaignSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    remaining_budget = serializers.SerializerMethodField()

    class Meta:
        model = AdCampaign
        fields = [
            'id',
            'vendor',
            'vendor_name',
            'product',
            'product_name',
            'product_slug',
            'budget',
            'spent',
            'remaining_budget',
            'cost_per_click',
            'start_date',
            'end_date',
            'status',
            'impressions',
            'clicks',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'vendor',
            'vendor_name',
            'product_name',
            'product_slug',
            'spent',
            'remaining_budget',
            'impressions',
            'clicks',
            'created_at',
            'updated_at',
        ]

    def get_remaining_budget(self, obj):
        return obj.budget - obj.spent


class CreateAdCampaignSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    budget = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=1000)
    cost_per_click = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=10, default=50)
    start_date = serializers.DateField()
    end_date = serializers.DateField()

    def validate(self, attrs):
        vendor = self.context['vendor']
        if attrs['end_date'] < attrs['start_date']:
            raise serializers.ValidationError({'end_date': 'La date de fin doit etre apres la date de debut.'})
        if attrs['end_date'] < timezone.localdate():
            raise serializers.ValidationError({'end_date': 'La campagne ne peut pas finir dans le passe.'})

        try:
            product = Product.objects.get(
                pk=attrs['product_id'],
                vendor=vendor,
                status=Product.Status.PUBLISHED,
            )
        except Product.DoesNotExist:
            raise serializers.ValidationError({'product_id': 'Produit publie introuvable pour cette boutique.'})

        attrs['product'] = product
        return attrs


class UpdateAdCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdCampaign
        fields = ['status', 'end_date']

    def validate_status(self, value):
        if value not in [AdCampaign.Status.ACTIVE, AdCampaign.Status.PAUSED, AdCampaign.Status.EXPIRED]:
            raise serializers.ValidationError('Statut invalide.')
        return value

