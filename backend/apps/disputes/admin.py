from django.contrib import admin

from .models import Dispute


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ['id', 'vendor_order', 'initiator', 'status', 'resolution', 'frozen_amount', 'created_at']
    list_filter = ['status', 'resolution', 'created_at']
    search_fields = ['initiator__email', 'vendor_order__vendor__name', 'reason', 'description']
    readonly_fields = ['created_at', 'updated_at', 'resolved_at']

