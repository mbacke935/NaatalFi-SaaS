from django.contrib import admin
from .models import Vendor, VendorPlan


@admin.register(VendorPlan)
class VendorPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'commission_rate', 'monthly_price', 'max_products']


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display   = ['name', 'user', 'status', 'plan', 'trust_score', 'created_at']
    list_filter    = ['status', 'plan']
    search_fields  = ['name', 'user__email']
    readonly_fields = ['slug', 'trust_score', 'created_at', 'updated_at']
    ordering       = ['-created_at']

    fieldsets = (
        (None,          {'fields': ('user', 'name', 'slug', 'plan', 'status')}),
        ('Infos',       {'fields': ('description', 'phone', 'address', 'logo')}),
        ('Métriques',   {'fields': ('trust_score', 'created_at', 'updated_at')}),
    )

    actions = ['approve_vendors', 'suspend_vendors']

    def approve_vendors(self, request, queryset):
        queryset.update(status=Vendor.Status.APPROVED)
    approve_vendors.short_description = 'Approuver les vendeurs sélectionnés'

    def suspend_vendors(self, request, queryset):
        queryset.update(status=Vendor.Status.SUSPENDED)
    suspend_vendors.short_description = 'Suspendre les vendeurs sélectionnés'
