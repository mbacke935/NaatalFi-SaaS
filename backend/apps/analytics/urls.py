from django.urls import path

from .views import AdminAnalyticsOverviewView, AdminAnalyticsVendorsView, VendorAnalyticsView


urlpatterns = [
    path('admin/overview/', AdminAnalyticsOverviewView.as_view(), name='admin-analytics-overview'),
    path('admin/vendors/', AdminAnalyticsVendorsView.as_view(), name='admin-analytics-vendors'),
    path('vendors/me/', VendorAnalyticsView.as_view(), name='vendor-analytics'),
]

