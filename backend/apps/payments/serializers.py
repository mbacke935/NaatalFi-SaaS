from rest_framework import serializers

from .models import Payment


class InitiatePaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    access_token = serializers.CharField(required=False, allow_blank=True, default='')
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
    buyer_email = serializers.SerializerMethodField()
    has_webhook = serializers.SerializerMethodField()

    class Meta(PaymentSerializer.Meta):
        fields = PaymentSerializer.Meta.fields + [
            'buyer_email', 'has_webhook', 'raw_webhook', 'raw_response',
        ]

    def get_has_webhook(self, obj):
        return bool(obj.raw_webhook)

    def get_buyer_email(self, obj):
        return obj.buyer.email if obj.buyer_id else obj.order.guest_email
