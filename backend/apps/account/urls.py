from django.urls import path
from .views import (
    AccountProfileView,
    UploadAvatarView,
    AccountOrderListView,
    AccountOrderDetailView,
    AddressListView,
    AddressDetailView,
    FavoriteListView,
    FavoriteDetailView,
)

urlpatterns = [
    path('profile/',                    AccountProfileView.as_view()),
    path('profile/avatar/',             UploadAvatarView.as_view()),
    path('orders/',                     AccountOrderListView.as_view()),
    path('orders/<int:pk>/',            AccountOrderDetailView.as_view()),
    path('addresses/',                  AddressListView.as_view()),
    path('addresses/<int:pk>/',         AddressDetailView.as_view()),
    path('favorites/',                  FavoriteListView.as_view()),
    path('favorites/<int:product_id>/', FavoriteDetailView.as_view()),
]
