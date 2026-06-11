from rest_framework import serializers
from .models import ShippingZone, ShippingRate

SENEGAL_REGIONS = [
    'Dakar', 'Thiès', 'Diourbel', 'Fatick', 'Kaolack', 'Kaffrine',
    'Kolda', 'Louga', 'Matam', 'Saint-Louis', 'Sédhiou',
    'Tambacounda', 'Ziguinchor', 'Kédougou',
]


class ShippingRateSerializer(serializers.ModelSerializer):
    class Meta:
        model        = ShippingRate
        fields       = ['id', 'price', 'estimated_days', 'min_weight', 'max_weight', 'created_at']
        read_only_fields = ['id', 'created_at']


class ShippingZoneSerializer(serializers.ModelSerializer):
    rates = ShippingRateSerializer(many=True, read_only=True)

    class Meta:
        model        = ShippingZone
        fields       = ['id', 'name', 'regions', 'is_active', 'rates', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_regions(self, value):
        if not value:
            raise serializers.ValidationError("Au moins une région est requise.")
        for r in value:
            if r not in SENEGAL_REGIONS:
                raise serializers.ValidationError(f"Région '{r}' non reconnue.")
        return value


class CreateShippingZoneSerializer(serializers.Serializer):
    name           = serializers.CharField(max_length=100)
    regions        = serializers.ListField(child=serializers.CharField(), min_length=1)
    price          = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    estimated_days = serializers.IntegerField(min_value=1, max_value=60, default=2)

    def validate_regions(self, value):
        for r in value:
            if r not in SENEGAL_REGIONS:
                raise serializers.ValidationError(f"Région '{r}' non reconnue.")
        return value


class EstimateShippingSerializer(serializers.Serializer):
    vendor_ids = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    region     = serializers.CharField()

    def validate_region(self, value):
        if value not in SENEGAL_REGIONS:
            raise serializers.ValidationError(f"Région '{value}' non reconnue.")
        return value
