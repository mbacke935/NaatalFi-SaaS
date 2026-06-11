from django.urls import path

from .views import InitiatePaymentView, PaymentStatusView, PayTechWebhookView

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='payment-initiate'),
    path('webhook/', PayTechWebhookView.as_view(), name='payment-webhook'),
    path('<str:reference>/', PaymentStatusView.as_view(), name='payment-status'),
]
