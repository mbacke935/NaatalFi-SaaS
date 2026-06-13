from django.contrib import admin

from .models import AdminAuditLog, EmailLog


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ['to_email', 'subject', 'status', 'attempts', 'scheduled_at', 'sent_at']
    list_filter = ['status', 'created_at', 'sent_at']
    search_fields = ['to_email', 'subject']
    readonly_fields = ['attempts', 'last_error', 'sent_at', 'created_at', 'updated_at']


@admin.register(AdminAuditLog)
class AdminAuditLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'actor', 'target_type', 'target_id', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['actor__email', 'target_type', 'target_id', 'target_repr']
    readonly_fields = [
        'actor', 'action', 'target_type', 'target_id', 'target_repr',
        'metadata', 'ip_address', 'user_agent', 'created_at',
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
