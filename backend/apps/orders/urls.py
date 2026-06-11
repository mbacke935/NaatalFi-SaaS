from django.urls import path
from .views import (
    CartValidateView,
    CreateOrderView,
    BuyerOrderListView,
    BuyerOrderDetailView,
    BuyerOrderCancelView,
)

urlpatterns = [
    path('validate/',             CartValidateView.as_view(),    name='cart-validate'),
    path('',                      CreateOrderView.as_view(),     name='order-create'),
    path('me/',                   BuyerOrderListView.as_view(),  name='order-list'),
    path('me/<int:pk>/',          BuyerOrderDetailView.as_view(), name='order-detail'),
    path('me/<int:pk>/cancel/',   BuyerOrderCancelView.as_view(), name='order-cancel'),
]
