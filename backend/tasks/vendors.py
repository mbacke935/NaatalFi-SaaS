from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task
def send_vendor_approval_email(user_id):
    from apps.users.models import CustomUser
    from apps.notifications.models import Notification
    from apps.notifications.services import create_notification

    user = CustomUser.objects.get(id=user_id)
    send_mail(
        subject='Votre boutique a été approuvée — NaatalFi',
        message=(
            f"Bonjour {user.first_name},\n\n"
            f"Félicitations ! Votre boutique sur NaatalFi a été approuvée.\n\n"
            f"Vous pouvez maintenant publier vos produits et commencer à vendre.\n\n"
            f"Connectez-vous à votre tableau de bord :\n"
            f"{settings.FRONTEND_URL}/dashboard\n\n"
            f"L'équipe NaatalFi"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
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
    from apps.users.models import CustomUser
    from apps.notifications.models import Notification
    from apps.notifications.services import create_notification

    user = CustomUser.objects.get(id=user_id)
    reason_text = f"\n\nMotif : {reason}" if reason else ''
    send_mail(
        subject='Mise à jour concernant votre boutique — NaatalFi',
        message=(
            f"Bonjour {user.first_name},\n\n"
            f"Votre boutique a été suspendue suite à un examen de notre équipe.{reason_text}\n\n"
            f"Si vous pensez que c'est une erreur, contactez-nous à support@naatalfi.com.\n\n"
            f"L'équipe NaatalFi"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    create_notification(
        user=user,
        type=Notification.Type.VENDOR,
        title="Boutique suspendue",
        message=f"Votre boutique a ete suspendue.{reason_text}",
        link_url="/dashboard/profile",
    )
