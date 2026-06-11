from decimal import Decimal
from rest_framework import serializers
from .models import Wallet, Transaction, PayoutRequest


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Transaction
        fields = ['id', 'type', 'amount', 'description', 'reference', 'created_at']
        read_only_fields = fields


class PayoutRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PayoutRequest
        fields = ['id', 'amount', 'status', 'bank_info', 'admin_note', 'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'admin_note', 'created_at', 'updated_at']


class CreatePayoutRequestSerializer(serializers.Serializer):
    amount         = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('1000'))
    bank_name      = serializers.CharField(max_length=100)
    account_number = serializers.CharField(max_length=50)
    account_name   = serializers.CharField(max_length=150)

    def validate_amount(self, value):
        wallet = self.context.get('wallet')
        if wallet and value > wallet.available_balance:
            raise serializers.ValidationError("Montant supérieur au solde disponible.")
        return value


class WalletSerializer(serializers.ModelSerializer):
    plan_name       = serializers.SerializerMethodField()
    commission_rate = serializers.SerializerMethodField()

    class Meta:
        model  = Wallet
        fields = [
            'pending_balance', 'available_balance', 'frozen_balance',
            'plan_name', 'commission_rate', 'updated_at',
        ]
        read_only_fields = fields

    def get_plan_name(self, obj):
        return obj.vendor.plan.name if obj.vendor.plan else 'FREE'

    def get_commission_rate(self, obj):
        return str(obj.vendor.plan.commission_rate) if obj.vendor.plan else '10.00'


class AdminWalletSerializer(serializers.ModelSerializer):
    vendor_name     = serializers.CharField(source='vendor.name', read_only=True)
    vendor_id       = serializers.IntegerField(source='vendor.id', read_only=True)
    plan_name       = serializers.SerializerMethodField()
    commission_rate = serializers.SerializerMethodField()

    class Meta:
        model  = Wallet
        fields = [
            'id', 'vendor_id', 'vendor_name', 'plan_name', 'commission_rate',
            'pending_balance', 'available_balance', 'frozen_balance', 'updated_at',
        ]
        read_only_fields = fields

    def get_plan_name(self, obj):
        return obj.vendor.plan.name if obj.vendor.plan else 'FREE'

    def get_commission_rate(self, obj):
        return str(obj.vendor.plan.commission_rate) if obj.vendor.plan else '10.00'


class AdminPayoutRequestSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='wallet.vendor.name', read_only=True)
    vendor_id   = serializers.IntegerField(source='wallet.vendor.id', read_only=True)

    class Meta:
        model  = PayoutRequest
        fields = ['id', 'vendor_id', 'vendor_name', 'amount', 'status',
                  'bank_info', 'admin_note', 'created_at', 'updated_at']
        read_only_fields = fields
