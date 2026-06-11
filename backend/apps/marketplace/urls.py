from django.urls import path
from .views import (
    MarketplaceProductListView,
    MarketplaceProductDetailView,
    MarketplaceVendorListView,
    MarketplaceVendorDetailView,
    MarketplaceCategoriesView,
    MarketplaceSearchView,
    MarketplaceFeaturedView,
)

urlpatterns = [
    path('products/',              MarketplaceProductListView.as_view(),   name='mp-products'),
    path('products/<slug:slug>/',  MarketplaceProductDetailView.as_view(), name='mp-product-detail'),
    path('vendors/',               MarketplaceVendorListView.as_view(),    name='mp-vendors'),
    path('vendors/<slug:slug>/',   MarketplaceVendorDetailView.as_view(),  name='mp-vendor-detail'),
    path('categories/',            MarketplaceCategoriesView.as_view(),    name='mp-categories'),
    path('search/',                MarketplaceSearchView.as_view(),        name='mp-search'),
    path('featured/',              MarketplaceFeaturedView.as_view(),      name='mp-featured'),
]
