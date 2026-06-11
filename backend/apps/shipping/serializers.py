from rest_framework import serializers

from .models import ShippingZone, ShippingRate


SENEGAL_REGIONS = [
    'Dakar', 'Thiès', 'Diourbel', 'Fatick', 'Kaolack', 'Kaffrine',
    'Kolda', 'Louga', 'Matam', 'Saint-Louis', 'Sédhiou',
    'Tambacounda', 'Ziguinchor', 'Kédougou',
]


class ShippingRateSerializer(serializers.ModelSerializer):
    delivery_days = serializers.IntegerField(source='estimated_days', read_only=True)

    class Meta:
        model = ShippingRate
        fields = [
            'id', 'price', 'estimated_days', 'delivery_days',
            'min_weight', 'max_weight', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ShippingZoneSerializer(serializers.ModelSerializer):
    rates = ShippingRateSerializer(many=True, read_only=True)

    class Meta:
        model = ShippingZone
        fields = ['id', 'name', 'regions', 'is_active', 'rates', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_regions(self, value):
        if not value:
            raise serializers.ValidationError("Au moins une region est requise.")
        for region in value:
            if region not in SENEGAL_REGIONS:
                raise serializers.ValidationError(f"Region '{region}' non reconnue.")
        return value


class CreateShippingZoneSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    regions = serializers.ListField(child=serializers.CharField(), min_length=1)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    estimated_days = serializers.IntegerField(min_value=1, max_value=60, required=False)
    delivery_days = serializers.IntegerField(min_value=1, max_value=60, required=False)
    min_weight = serializers.DecimalField(
        max_digits=8,
        decimal_places=2,
        min_value=0,
        required=False,
        allow_null=True,
    )
    max_weight = serializers.DecimalField(
        max_digits=8,
        decimal_places=2,
        min_value=0,
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        attrs['estimated_days'] = attrs.get('estimated_days') or attrs.get('delivery_days') or 2
        min_weight = attrs.get('min_weight')
        max_weight = attrs.get('max_weight')
        if min_weight is not None and max_weight is not None and max_weight < min_weight:
            raise serializers.ValidationError("Le poids maximum doit etre superieur au poids minimum.")
        return attrs

    def validate_regions(self, value):
        for region in value:
            if region not in SENEGAL_REGIONS:
                raise serializers.ValidationError(f"Region '{region}' non reconnue.")
        return value


class EstimateShippingSerializer(serializers.Serializer):
    vendor_ids = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    region = serializers.CharField()
    weight = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=0, required=False, allow_null=True)

    def validate_region(self, value):
        if value not in SENEGAL_REGIONS:
            raise serializers.ValidationError(f"Region '{value}' non reconnue.")
        return value
