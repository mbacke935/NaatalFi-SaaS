from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


@shared_task
def send_payment_confirmation_email(payment_id):
    from apps.payments.models import Payment

    payment = Payment.objects.select_related('order', 'buyer').get(pk=payment_id)
    order_url = f"{settings.FRONTEND_URL}/account/orders/{payment.order_id}"

    send_mail(
        subject=f"Paiement confirmé #{payment.reference} — NaatalFi",
        message="\n".join([
            f"Bonjour {payment.buyer.get_full_name() or payment.buyer.email},",
            "",
            f"Votre paiement de {payment.amount} {payment.currency} a bien été confirmé.",
            f"Commande : #{payment.order_id}",
            f"Référence paiement : {payment.reference}",
            "",
            f"Voir la commande : {order_url}",
            "",
            "L'équipe NaatalFi",
        ]),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[payment.buyer.email],
        fail_silently=False,
    )
