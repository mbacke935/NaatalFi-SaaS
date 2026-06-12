from django.contrib import admin

from .models import AdCampaign


@admin.register(AdCampaign)
class AdCampaignAdmin(admin.ModelAdmin):
    list_display = ['product', 'vendor', 'status', 'budget', 'spent', 'impressions', 'clicks', 'start_date', 'end_date']
    list_filter = ['status', 'start_date', 'end_date']
    search_fields = ['product__name', 'vendor__name']

