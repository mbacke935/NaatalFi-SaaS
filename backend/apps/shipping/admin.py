from django.contrib import admin
from .models import ShippingZone, ShippingRate


class ShippingRateInline(admin.TabularInline):
    model  = ShippingRate
    extra  = 1
    fields = ['price', 'estimated_days', 'min_weight', 'max_weight']


@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    list_display  = ['vendor', 'name', 'is_active', 'created_at']
    list_filter   = ['is_active']
    search_fields = ['vendor__name', 'name']
    inlines       = [ShippingRateInline]


@admin.register(ShippingRate)
class ShippingRateAdmin(admin.ModelAdmin):
    list_display = ['zone', 'price', 'estimated_days']
