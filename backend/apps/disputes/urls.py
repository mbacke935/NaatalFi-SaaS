from django.urls import path

from .views import (
    AdminDisputeListView,
    AdminResolveDisputeView,
    DisputeDetailView,
    DisputeListCreateView,
    VendorDisputeListView,
)


urlpatterns = [
    path('', DisputeListCreateView.as_view(), name='dispute-list-create'),
    path('<int:pk>/', DisputeDetailView.as_view(), name='dispute-detail'),
    path('vendor/', VendorDisputeListView.as_view(), name='vendor-dispute-list'),
    path('admin/', AdminDisputeListView.as_view(), name='admin-dispute-list'),
    path('admin/<int:pk>/resolve/', AdminResolveDisputeView.as_view(), name='admin-dispute-resolve'),
]

