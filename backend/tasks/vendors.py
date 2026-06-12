from celery import shared_task
from django.conf import settings

from apps.internal.services import queue_email


@shared_task
def send_vendor_approval_email(user_id):
    from apps.notifications.models import Notification
    from apps.notifications.services import create_notification
    from apps.users.models import CustomUser

    user = CustomUser.objects.get(id=user_id)
    queue_email(
        subject='Votre boutique a ete approuvee - NaatalFi',
        message=(
            f"Bonjour {user.first_name},\n\n"
            "Felicitations ! Votre boutique sur NaatalFi a ete approuvee.\n\n"
            "Vous pouvez maintenant publier vos produits et commencer a vendre.\n\n"
            "Connectez-vous a votre tableau de bord :\n"
            f"{settings.FRONTEND_URL}/dashboard\n\n"
            "L'equipe NaatalFi"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient=user.email,
    )
    create_notification(
        user=user,
        type=Notification.Type.VENDOR,
        title="Boutique approuvee",
        message="Votre boutique a ete approuvee. Vous pouvez publier vos produits.",
        link_url="/dashboard",
    )


@shared_task
def send_vendor_rejection_email(user_id, reason=''):
    from apps.notifications.models import Notification
    from apps.notifications.services import create_notification
    from apps.users.models import CustomUser

    user = CustomUser.objects.get(id=user_id)
    reason_text = f"\n\nMotif : {reason}" if reason else ''
    queue_email(
        subject='Mise a jour concernant votre boutique - NaatalFi',
        message=(
            f"Bonjour {user.first_name},\n\n"
            f"Votre boutique a ete suspendue suite a un examen de notre equipe.{reason_text}\n\n"
            "Si vous pensez que c'est une erreur, contactez-nous a support@naatalfi.com.\n\n"
            "L'equipe NaatalFi"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient=user.email,
    )
    create_notification(
        user=user,
        type=Notification.Type.VENDOR,
        title="Boutique suspendue",
        message=f"Votre boutique a ete suspendue.{reason_text}",
        link_url="/dashboard/profile",
    )
