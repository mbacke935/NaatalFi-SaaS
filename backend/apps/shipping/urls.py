from django.urls import path
from .views import (
    ShippingZoneListCreateView,
    ShippingZoneDetailView,
    EstimateShippingView,
    RegionListView,
)

urlpatterns = [
    path('zones/',         ShippingZoneListCreateView.as_view()),
    path('zones/<int:pk>/', ShippingZoneDetailView.as_view()),
    path('estimate/',      EstimateShippingView.as_view()),
    path('regions/',       RegionListView.as_view()),
]
