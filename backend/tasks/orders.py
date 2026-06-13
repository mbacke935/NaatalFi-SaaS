from celery import shared_task
from django.conf import settings

from apps.internal.services import queue_email


@shared_task
def send_order_confirmation_email(order_id):
    from apps.notifications.models import Notification
    from apps.notifications.services import create_notification
    from apps.orders.models import Order

    order = (
        Order.objects
        .select_related('buyer')
        .prefetch_related('vendor_orders__items', 'vendor_orders__vendor')
        .get(pk=order_id)
    )
    if order.buyer_id:
        buyer_name = order.buyer.get_full_name() or order.buyer.email
        buyer_email = order.buyer.email
    else:
        buyer_name = order.guest_name
        buyer_email = order.guest_email
    if order.buyer_id:
        order_url = f"{settings.FRONTEND_URL}/account/orders/{order.id}"
    else:
        order_url = f"{settings.FRONTEND_URL}/guest/orders/{order.id}#token={order.guest_access_token}"

    lines = [
        f"Bonjour {buyer_name},",
        "",
        f"Votre commande #{order.id} a bien ete enregistree.",
        f"Total : {order.total} FCFA",
        "",
        "Detail par vendeur :",
    ]
    for vendor_order in order.vendor_orders.all():
        lines.append(
            f"- {vendor_order.vendor.name} : {vendor_order.subtotal} FCFA "
            f"({vendor_order.items.count()} article(s))"
        )
    lines.extend([
        "",
        f"Suivre la commande : {order_url}",
        "",
        "L'equipe NaatalFi",
    ])

    queue_email(
        subject=f"Confirmation de commande #{order.id} - NaatalFi",
        message="\n".join(lines),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient=buyer_email,
    )
    if order.buyer_id:
        create_notification(
            user=order.buyer,
            type=Notification.Type.ORDER,
            title=f"Commande #{order.id} creee",
            message=f"Votre commande de {order.total} FCFA a bien ete enregistree.",
            link_url=f"/account/orders/{order.id}",
        )


@shared_task
def send_vendor_new_order_email(vendor_order_id):
    from apps.notifications.models import Notification
    from apps.notifications.services import create_notification
    from apps.orders.models import VendorOrder

    vendor_order = (
        VendorOrder.objects
        .select_related('order__buyer', 'vendor__user')
        .prefetch_related('items')
        .get(pk=vendor_order_id)
    )
    vendor = vendor_order.vendor
    dashboard_url = f"{settings.FRONTEND_URL}/dashboard/orders/{vendor_order.id}"

    lines = [
        f"Bonjour {vendor.user.get_full_name() or vendor.user.email},",
        "",
        f"Vous avez recu une nouvelle commande pour {vendor.name}.",
        f"Commande vendeur #{vendor_order.id}",
        f"Commande client #{vendor_order.order_id}",
        f"Sous-total : {vendor_order.subtotal} FCFA",
        "",
        "Articles :",
    ]
    for item in vendor_order.items.all():
        variant = f" ({item.variant_label})" if item.variant_label else ""
        lines.append(f"- {item.quantity} x {item.product_name}{variant}")
    lines.extend([
        "",
        f"Traiter la commande : {dashboard_url}",
        "",
        "L'equipe NaatalFi",
    ])

    queue_email(
        subject=f"Nouvelle commande #{vendor_order.id} - NaatalFi",
        message="\n".join(lines),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient=vendor.user.email,
    )
    create_notification(
        user=vendor.user,
        type=Notification.Type.ORDER,
        title=f"Nouvelle commande #{vendor_order.id}",
        message=f"{vendor_order.items.count()} article(s), total vendeur {vendor_order.subtotal} FCFA.",
        link_url=f"/dashboard/orders/{vendor_order.id}",
    )
