from rest_framework import serializers

from apps.orders.models import VendorOrder
from .models import Dispute


class DisputeSerializer(serializers.ModelSerializer):
    buyer_name = serializers.SerializerMethodField()
    vendor_name = serializers.CharField(source='vendor_order.vendor.name', read_only=True)
    vendor_order_status = serializers.CharField(source='vendor_order.status', read_only=True)
    order_total = serializers.DecimalField(source='order.total', max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Dispute
        fields = [
            'id',
            'order',
            'vendor_order',
            'vendor_name',
            'vendor_order_status',
            'buyer_name',
            'reason',
            'description',
            'status',
            'resolution',
            'admin_note',
            'frozen_amount',
            'order_total',
            'created_at',
            'updated_at',
            'resolved_at',
        ]
        read_only_fields = fields

    def get_buyer_name(self, obj):
        return obj.order.buyer.get_full_name() or obj.order.buyer.email


class CreateDisputeSerializer(serializers.Serializer):
    vendor_order_id = serializers.IntegerField()
    reason = serializers.CharField(max_length=80)
    description = serializers.CharField(required=False, allow_blank=True, max_length=2000)

    def validate(self, attrs):
        request = self.context['request']
        try:
            vendor_order = (
                VendorOrder.objects
                .select_related('order__buyer', 'vendor__user')
                .get(pk=attrs['vendor_order_id'])
            )
        except VendorOrder.DoesNotExist:
            raise serializers.ValidationError({'vendor_order_id': 'Commande vendeur introuvable.'})

        if vendor_order.order.buyer_id != request.user.id:
            raise serializers.ValidationError({'vendor_order_id': 'Cette commande ne vous appartient pas.'})

        if vendor_order.status not in [VendorOrder.Status.SHIPPED, VendorOrder.Status.DELIVERED]:
            raise serializers.ValidationError({'vendor_order_id': 'Seules les commandes expediees ou livrees peuvent faire objet de litige.'})

        if Dispute.objects.filter(
            vendor_order=vendor_order,
            status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW],
        ).exists():
            raise serializers.ValidationError({'vendor_order_id': 'Un litige est deja ouvert pour cette commande.'})

        attrs['vendor_order'] = vendor_order
        return attrs


class ResolveDisputeSerializer(serializers.Serializer):
    resolution = serializers.ChoiceField(choices=Dispute.Resolution.choices)
    note = serializers.CharField(required=False, allow_blank=True, max_length=2000)

