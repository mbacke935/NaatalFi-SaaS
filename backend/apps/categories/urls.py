from django.urls import path
from .views import (
    CategoryListView,
    CategoryDetailView,
    AdminCategoryListView,
    AdminCategoryDetailView,
    AdminCategoryImageView,
    AdminCategoryReorderView,
)

urlpatterns = [
    # Public
    path('',               CategoryListView.as_view(),   name='category-list'),
    path('<slug:slug>/',   CategoryDetailView.as_view(), name='category-detail'),

    # Admin
    path('admin/',                    AdminCategoryListView.as_view(),    name='admin-category-list'),
    path('admin/reorder/',            AdminCategoryReorderView.as_view(), name='admin-category-reorder'),
    path('admin/<int:pk>/',           AdminCategoryDetailView.as_view(),  name='admin-category-detail'),
    path('admin/<int:pk>/image/',     AdminCategoryImageView.as_view(),   name='admin-category-image'),
]
