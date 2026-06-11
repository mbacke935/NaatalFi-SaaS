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

urlpatterns = [
    # Vendeur
    path('',              CreateVendorView.as_view(),    name='vendor-create'),
    path('me/',           MyVendorView.as_view(),        name='vendor-me'),
    path('me/logo/',      UploadLogoView.as_view(),      name='vendor-upload-logo'),

    # Admin
    path('admin/',               AdminVendorListView.as_view(),    name='admin-vendor-list'),
    path('admin/<int:pk>/',      AdminVendorDetailView.as_view(),  name='admin-vendor-detail'),
    path('admin/<int:pk>/approve/', AdminApproveVendorView.as_view(), name='admin-vendor-approve'),
    path('admin/<int:pk>/suspend/', AdminSuspendVendorView.as_view(), name='admin-vendor-suspend'),
]
