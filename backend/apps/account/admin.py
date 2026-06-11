from django.contrib import admin
from .models import Address, Favorite


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display  = ['user', 'label', 'full_name', 'city', 'is_default']
    list_filter   = ['is_default', 'city']
    search_fields = ['user__email', 'full_name', 'city']


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display  = ['user', 'product', 'created_at']
    search_fields = ['user__email', 'product__name']
