from django.urls import path
from .views import (
    PublicProductListView,
    PublicProductDetailView,
    AdminProductListView,
    AdminProductDetailView,
)

urlpatterns = [
    path('admin/',        AdminProductListView.as_view(),    name='admin-product-list'),
    path('admin/<int:pk>/', AdminProductDetailView.as_view(), name='admin-product-detail'),
    path('',             PublicProductListView.as_view(),   name='product-list'),
    path('<slug:slug>/', PublicProductDetailView.as_view(), name='product-detail'),
]
