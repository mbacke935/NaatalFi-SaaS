from django.urls import path

from .views import AdminPlatformSettingsView, PublicPlatformSettingsView


urlpatterns = [
    path('public/', PublicPlatformSettingsView.as_view(), name='platform-public-settings'),
    path('admin/', AdminPlatformSettingsView.as_view(), name='platform-admin-settings'),
]

