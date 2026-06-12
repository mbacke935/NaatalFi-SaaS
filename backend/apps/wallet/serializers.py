from decimal import Decimal
from rest_framework import serializers
from .models import PlatformPayoutAccount, Wallet, Transaction, PayoutRequest
from .services import PLATFORM_COMMISSION_RATE


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
        # MVP: taux flat 8% indépendant du plan
        return str(PLATFORM_COMMISSION_RATE)


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
        # MVP: taux flat 8% indépendant du plan
        return str(PLATFORM_COMMISSION_RATE)


class AdminPayoutRequestSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='wallet.vendor.name', read_only=True)
    vendor_id   = serializers.IntegerField(source='wallet.vendor.id', read_only=True)

    class Meta:
        model  = PayoutRequest
        fields = ['id', 'vendor_id', 'vendor_name', 'amount', 'status',
                  'bank_info', 'admin_note', 'created_at', 'updated_at']
        read_only_fields = fields


class PlatformPayoutAccountSerializer(serializers.ModelSerializer):
    total_commissions = serializers.SerializerMethodField()

    class Meta:
        model = PlatformPayoutAccount
        fields = [
            'method', 'account_name', 'phone_number', 'bank_name',
            'account_number', 'instructions', 'total_commissions',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['total_commissions', 'created_at', 'updated_at']

    def validate(self, attrs):
        method = attrs.get('method', getattr(self.instance, 'method', PlatformPayoutAccount.Method.MOBILE_MONEY))
        phone_number = attrs.get('phone_number', getattr(self.instance, 'phone_number', ''))
        bank_name = attrs.get('bank_name', getattr(self.instance, 'bank_name', ''))
        account_number = attrs.get('account_number', getattr(self.instance, 'account_number', ''))

        if method == PlatformPayoutAccount.Method.MOBILE_MONEY and not phone_number:
            raise serializers.ValidationError({'phone_number': 'Numero requis pour le mobile money.'})
        if method == PlatformPayoutAccount.Method.BANK and (not bank_name or not account_number):
            raise serializers.ValidationError({'bank_name': 'Banque et numero de compte requis.'})
        return attrs

    def get_total_commissions(self, obj):
        from django.db.models import Sum
        total = Transaction.objects.filter(type=Transaction.Type.COMMISSION).aggregate(total=Sum('amount'))['total']
        return str(total or 0)
