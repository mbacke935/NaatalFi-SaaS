from django.urls import path

from .views import (
    AdminReviewDetailView,
    AdminReviewListView,
    MyReviewListView,
    ProductReviewListView,
    ReviewCreateView,
    VendorReviewListView,
)


urlpatterns = [
    path('', ReviewCreateView.as_view(), name='review-create'),
    path('me/', MyReviewListView.as_view(), name='review-me'),
    path('products/<slug:slug>/', ProductReviewListView.as_view(), name='review-product-list'),
    path('vendors/<slug:slug>/', VendorReviewListView.as_view(), name='review-vendor-list'),
    path('admin/', AdminReviewListView.as_view(), name='admin-review-list'),
    path('admin/<int:pk>/', AdminReviewDetailView.as_view(), name='admin-review-detail'),
]

