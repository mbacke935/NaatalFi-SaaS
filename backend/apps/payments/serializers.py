from rest_framework import serializers

from .models import Payment


class InitiatePaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    provider = serializers.ChoiceField(
        choices=Payment.Provider.choices,
        default=Payment.Provider.PAYTECH,
    )


class PaymentSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'order_id', 'provider', 'amount', 'currency',
            'status', 'reference', 'provider_reference', 'payment_url',
            'paid_at', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class PaymentInitiatedSerializer(PaymentSerializer):
    payment_url = serializers.URLField(read_only=True)
