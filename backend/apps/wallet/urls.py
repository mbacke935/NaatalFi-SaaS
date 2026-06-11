from django.urls import path
from .views import (
    WalletDetailView,
    TransactionListView,
    PayoutRequestView,
    AdminWalletListView,
    AdminApprovePayoutView,
    AdminRejectPayoutView,
)

urlpatterns = [
    # Vendor
    path('',                               WalletDetailView.as_view(),    name='wallet-detail'),
    path('transactions/',                  TransactionListView.as_view(), name='wallet-transactions'),
    path('payouts/',                       PayoutRequestView.as_view(),   name='wallet-payouts'),

    # Admin
    path('admin/',                         AdminWalletListView.as_view(),    name='admin-wallet-list'),
    path('admin/payouts/<int:pk>/approve/', AdminApprovePayoutView.as_view(), name='admin-payout-approve'),
    path('admin/payouts/<int:pk>/reject/',  AdminRejectPayoutView.as_view(),  name='admin-payout-reject'),
]
