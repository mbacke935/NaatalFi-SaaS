from django.urls import path

from .views import (
    InitiatePaymentView,
    PaymentStatusView,
    PayTechWebhookView,
    AdminPaymentMarkPaidView,
    AdminPaymentListView,
)

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='payment-initiate'),
    path('webhook/', PayTechWebhookView.as_view(), name='payment-webhook'),
    path('admin/', AdminPaymentListView.as_view(), name='admin-payment-list'),
    path('admin/<int:pk>/mark-paid/', AdminPaymentMarkPaidView.as_view(), name='admin-payment-mark-paid'),
    path('<str:reference>/', PaymentStatusView.as_view(), name='payment-status'),
]
