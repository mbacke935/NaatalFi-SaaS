from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['reference', 'order', 'buyer', 'provider', 'amount', 'status', 'created_at']
    list_filter = ['provider', 'status']
    search_fields = ['reference', 'provider_reference', 'buyer__email']
    readonly_fields = [
        'order', 'buyer', 'provider', 'amount', 'currency',
        'reference', 'provider_reference', 'payment_url',
        'raw_response', 'raw_webhook', 'paid_at', 'created_at', 'updated_at',
    ]
