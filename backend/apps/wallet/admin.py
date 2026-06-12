from django.contrib import admin
from .models import PlatformPayoutAccount, Wallet, Transaction, PayoutRequest


class TransactionInline(admin.TabularInline):
    model  = Transaction
    extra  = 0
    readonly_fields = ['type', 'amount', 'description', 'reference', 'created_at']
    can_delete = False


class PayoutRequestInline(admin.TabularInline):
    model  = PayoutRequest
    extra  = 0
    readonly_fields = ['amount', 'status', 'bank_info', 'admin_note', 'created_at']


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display  = ['vendor', 'pending_balance', 'available_balance', 'frozen_balance', 'updated_at']
    list_filter   = ['vendor__plan']
    search_fields = ['vendor__name']
    readonly_fields = ['created_at', 'updated_at']
    inlines       = [TransactionInline, PayoutRequestInline]


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display  = ['wallet', 'type', 'amount', 'reference', 'created_at']
    list_filter   = ['type']
    search_fields = ['wallet__vendor__name', 'reference']
    readonly_fields = ['created_at']


@admin.register(PayoutRequest)
class PayoutRequestAdmin(admin.ModelAdmin):
    list_display  = ['wallet', 'amount', 'status', 'created_at']
    list_filter   = ['status']
    search_fields = ['wallet__vendor__name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PlatformPayoutAccount)
class PlatformPayoutAccountAdmin(admin.ModelAdmin):
    list_display = ['method', 'account_name', 'phone_number', 'bank_name', 'account_number', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']
