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


class AdminPaymentSerializer(PaymentSerializer):
    buyer_email = serializers.EmailField(source='buyer.email', read_only=True)
    has_webhook = serializers.SerializerMethodField()

    class Meta(PaymentSerializer.Meta):
        fields = PaymentSerializer.Meta.fields + [
            'buyer_email', 'has_webhook', 'raw_webhook', 'raw_response',
        ]

    def get_has_webhook(self, obj):
        return bool(obj.raw_webhook)
