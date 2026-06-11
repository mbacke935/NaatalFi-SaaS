from django.contrib import admin
from .models import Product, ProductImage, ProductVariant


class ProductImageInline(admin.TabularInline):
    model  = ProductImage
    extra  = 0
    fields = ['image_url', 'order', 'is_cover']


class ProductVariantInline(admin.TabularInline):
    model  = ProductVariant
    extra  = 0
    fields = ['name', 'value', 'stock', 'price_delta']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display   = ['name', 'vendor', 'category', 'price', 'status', 'created_at']
    list_filter    = ['status', 'category', 'vendor']
    search_fields  = ['name', 'slug', 'vendor__name']
    prepopulated_fields = {'slug': ('name',)}
    ordering       = ['-created_at']
    inlines        = [ProductImageInline, ProductVariantInline]
    raw_id_fields  = ['vendor', 'category']
