from django.contrib import admin
from .models import Order, VendorOrder, OrderItem


class OrderItemInline(admin.TabularInline):
    model          = OrderItem
    extra          = 0
    readonly_fields = ['product_name', 'product_slug', 'variant_label', 'unit_price', 'quantity']


class VendorOrderInline(admin.TabularInline):
    model           = VendorOrder
    extra           = 0
    readonly_fields = ['vendor', 'status', 'subtotal', 'shipping_cost', 'created_at', 'updated_at']
    show_change_link = True


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display    = ['id', 'buyer', 'status', 'total', 'vendor_order_count', 'created_at']
    list_filter     = ['status']
    readonly_fields = ['total', 'created_at', 'updated_at']
    inlines         = [VendorOrderInline]

    @admin.display(description='Commandes vendeurs')
    def vendor_order_count(self, obj):
        return obj.vendor_orders.count()


@admin.register(VendorOrder)
class VendorOrderAdmin(admin.ModelAdmin):
    list_display    = ['id', 'order', 'vendor', 'status', 'subtotal', 'shipping_cost', 'created_at']
    list_filter     = ['status', 'vendor']
    readonly_fields = ['order', 'vendor', 'subtotal', 'shipping_cost', 'created_at', 'updated_at']
    inlines         = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'vendor_order', 'product_name', 'variant_label', 'unit_price', 'quantity']
