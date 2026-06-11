from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model          = OrderItem
    extra          = 0
    readonly_fields = ['product_name', 'product_slug', 'variant_label', 'unit_price', 'quantity']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display    = ['id', 'buyer', 'vendor', 'status', 'total', 'created_at']
    list_filter     = ['status']
    readonly_fields = ['total', 'created_at', 'updated_at']
    inlines         = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'product_name', 'variant_label', 'unit_price', 'quantity']
