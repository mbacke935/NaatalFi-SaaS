from django.urls import path
from .views import (
    CartValidateView,
    CreateOrderView,
    BuyerOrderListView,
    BuyerOrderDetailView,
    BuyerOrderCancelView,
    AdminOrderListView,
    AdminStatsView,
)

urlpatterns = [
    path('validate/',             CartValidateView.as_view(),    name='cart-validate'),
    path('',                      CreateOrderView.as_view(),     name='order-create'),
    path('me/',                   BuyerOrderListView.as_view(),  name='order-list'),
    path('me/<int:pk>/',          BuyerOrderDetailView.as_view(), name='order-detail'),
    path('me/<int:pk>/cancel/',   BuyerOrderCancelView.as_view(), name='order-cancel'),
    # Admin
    path('admin/',                AdminOrderListView.as_view(),  name='admin-order-list'),
    path('admin/stats/',          AdminStatsView.as_view(),      name='admin-stats'),
]
