from django.urls import path

from .views import InitiatePaymentView, PaymentStatusView, PayTechWebhookView, AdminPaymentListView

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='payment-initiate'),
    path('webhook/', PayTechWebhookView.as_view(), name='payment-webhook'),
    path('admin/', AdminPaymentListView.as_view(), name='admin-payment-list'),
    path('<str:reference>/', PaymentStatusView.as_view(), name='payment-status'),
]
