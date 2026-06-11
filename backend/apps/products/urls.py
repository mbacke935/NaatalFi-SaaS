from django.urls import path
from .views import PublicProductListView, PublicProductDetailView

urlpatterns = [
    path('',             PublicProductListView.as_view(),   name='product-list'),
    path('<slug:slug>/', PublicProductDetailView.as_view(), name='product-detail'),
]
