from django.contrib import admin

from .models import EmailLog


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ['to_email', 'subject', 'status', 'attempts', 'scheduled_at', 'sent_at']
    list_filter = ['status', 'created_at', 'sent_at']
    search_fields = ['to_email', 'subject']
    readonly_fields = ['attempts', 'last_error', 'sent_at', 'created_at', 'updated_at']
