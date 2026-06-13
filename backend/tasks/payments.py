from celery import shared_task
from django.conf import settings

from apps.internal.services import queue_email


@shared_task
def send_payment_confirmation_email(payment_id):
    from apps.notifications.models import Notification
    from apps.notifications.services import create_notification
    from apps.payments.models import Payment

    payment = Payment.objects.select_related('order', 'buyer').get(pk=payment_id)
    if payment.buyer_id:
        buyer_name = payment.buyer.get_full_name() or payment.buyer.email
        buyer_email = payment.buyer.email
        order_url = f"{settings.FRONTEND_URL}/account/orders/{payment.order_id}"
    else:
        buyer_name = payment.order.guest_name
        buyer_email = payment.order.guest_email
        order_url = f"{settings.FRONTEND_URL}/guest/orders/{payment.order_id}#token={payment.order.guest_access_token}"

    queue_email(
        subject=f"Paiement confirme #{payment.reference} - NaatalFi",
        message="\n".join([
            f"Bonjour {buyer_name},",
            "",
            f"Votre paiement de {payment.amount} {payment.currency} a bien ete confirme.",
            f"Commande : #{payment.order_id}",
            f"Reference paiement : {payment.reference}",
            "",
            f"Voir la commande : {order_url}",
            "",
            "L'equipe NaatalFi",
        ]),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient=buyer_email,
    )
    if payment.buyer_id:
        create_notification(
            user=payment.buyer,
            type=Notification.Type.PAYMENT,
            title=f"Paiement confirme #{payment.reference}",
            message=f"Votre paiement de {payment.amount} {payment.currency} a ete confirme.",
            link_url=f"/account/orders/{payment.order_id}",
        )
