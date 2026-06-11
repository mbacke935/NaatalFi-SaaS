from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


@shared_task
def send_order_confirmation_email(order_id):
    from apps.orders.models import Order
    from apps.notifications.models import Notification
    from apps.notifications.services import create_notification

    order = (
        Order.objects
        .select_related('buyer')
        .prefetch_related('vendor_orders__items', 'vendor_orders__vendor')
        .get(pk=order_id)
    )
    buyer_name = order.buyer.get_full_name() or order.buyer.email
    order_url = f"{settings.FRONTEND_URL}/account/orders/{order.id}"

    lines = [
        f"Bonjour {buyer_name},",
        "",
        f"Votre commande #{order.id} a bien été enregistrée.",
        f"Total : {order.total} FCFA",
        "",
        "Détail par vendeur :",
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
        "L'équipe NaatalFi",
    ])

    send_mail(
        subject=f"Confirmation de commande #{order.id} — NaatalFi",
        message="\n".join(lines),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[order.buyer.email],
        fail_silently=False,
    )
    create_notification(
        user=order.buyer,
        type=Notification.Type.ORDER,
        title=f"Commande #{order.id} creee",
        message=f"Votre commande de {order.total} FCFA a bien ete enregistree.",
        link_url=f"/account/orders/{order.id}",
    )


@shared_task
def send_vendor_new_order_email(vendor_order_id):
    from apps.orders.models import VendorOrder
    from apps.notifications.models import Notification
    from apps.notifications.services import create_notification

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
        f"Vous avez reçu une nouvelle commande pour {vendor.name}.",
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
        "L'équipe NaatalFi",
    ])

    send_mail(
        subject=f"Nouvelle commande #{vendor_order.id} — NaatalFi",
        message="\n".join(lines),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[vendor.user.email],
        fail_silently=False,
    )
    create_notification(
        user=vendor.user,
        type=Notification.Type.ORDER,
        title=f"Nouvelle commande #{vendor_order.id}",
        message=f"{vendor_order.items.count()} article(s), total vendeur {vendor_order.subtotal} FCFA.",
        link_url=f"/dashboard/orders/{vendor_order.id}",
    )
