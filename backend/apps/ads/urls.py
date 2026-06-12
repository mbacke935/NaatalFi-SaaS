from django.urls import path

from .views import (
    AdCampaignClickView,
    AdminAdCampaignListView,
    SponsoredProductListView,
    VendorAdCampaignDetailView,
    VendorAdCampaignListView,
)


urlpatterns = [
    path('sponsored/', SponsoredProductListView.as_view(), name='ads-sponsored'),
    path('<int:pk>/click/', AdCampaignClickView.as_view(), name='ads-click'),
    path('me/', VendorAdCampaignListView.as_view(), name='vendor-ads'),
    path('me/<int:pk>/', VendorAdCampaignDetailView.as_view(), name='vendor-ad-detail'),
    path('admin/', AdminAdCampaignListView.as_view(), name='admin-ads'),
]

