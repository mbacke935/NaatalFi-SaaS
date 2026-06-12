from django.contrib import admin

from .models import PlatformSettings


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    list_display = ['contact_email', 'phone_number', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']

