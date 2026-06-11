from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model               = CustomUser
    list_display        = ['email', 'first_name', 'last_name', 'role', 'is_verified', 'is_active', 'date_joined']
    list_filter         = ['role', 'is_verified', 'is_active']
    search_fields       = ['email', 'first_name', 'last_name']
    ordering            = ['-date_joined']
    readonly_fields     = ['date_joined', 'updated_at']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations', {'fields': ('first_name', 'last_name', 'phone', 'avatar')}),
        ('Rôle & Statut', {'fields': ('role', 'is_verified', 'is_active', 'is_staff', 'is_superuser')}),
        ('Permissions', {'fields': ('groups', 'user_permissions')}),
        ('Dates', {'fields': ('date_joined', 'updated_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields':  ('email', 'first_name', 'last_name', 'password1', 'password2', 'role'),
        }),
    )
