from django.urls import path
from .views import (
    CreateVendorView,
    MyVendorView,
    UploadLogoView,
    AdminVendorListView,
    AdminVendorDetailView,
    AdminApproveVendorView,
    AdminSuspendVendorView,
)
from apps.products.views import (
    VendorProductListView,
    VendorProductDetailView,
    ProductImageUploadView,
    ProductImageDeleteView,
    ProductImageSetCoverView,
    ProductImageReorderView,
    ProductVariantListView,
    ProductVariantDetailView,
)

urlpatterns = [
    # Vendeur — boutique
    path('',         CreateVendorView.as_view(), name='vendor-create'),
    path('me/',      MyVendorView.as_view(),     name='vendor-me'),
    path('me/logo/', UploadLogoView.as_view(),   name='vendor-upload-logo'),

    # Vendeur — produits
    path('me/products/',                                        VendorProductListView.as_view(),     name='vendor-product-list'),
    path('me/products/<int:pk>/',                               VendorProductDetailView.as_view(),   name='vendor-product-detail'),
    path('me/products/<int:pk>/images/',                        ProductImageUploadView.as_view(),    name='vendor-product-image-upload'),
    path('me/products/<int:pk>/images/reorder/',               ProductImageReorderView.as_view(),   name='vendor-product-image-reorder'),
    path('me/products/<int:pk>/images/<int:image_id>/',         ProductImageDeleteView.as_view(),    name='vendor-product-image-delete'),
    path('me/products/<int:pk>/images/<int:image_id>/cover/',   ProductImageSetCoverView.as_view(),  name='vendor-product-image-cover'),
    path('me/products/<int:pk>/variants/',                      ProductVariantListView.as_view(),    name='vendor-product-variant-list'),
    path('me/products/<int:pk>/variants/<int:variant_id>/',     ProductVariantDetailView.as_view(),  name='vendor-product-variant-detail'),

    # Admin
    path('admin/',                   AdminVendorListView.as_view(),    name='admin-vendor-list'),
    path('admin/<int:pk>/',          AdminVendorDetailView.as_view(),  name='admin-vendor-detail'),
    path('admin/<int:pk>/approve/',  AdminApproveVendorView.as_view(), name='admin-vendor-approve'),
    path('admin/<int:pk>/suspend/',  AdminSuspendVendorView.as_view(), name='admin-vendor-suspend'),
]
