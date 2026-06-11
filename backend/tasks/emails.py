from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task
def send_verification_email(user_id, verification_url):
    from apps.users.models import CustomUser
    user = CustomUser.objects.get(id=user_id)
    send_mail(
        subject='Vérifiez votre adresse email — NaatalFi',
        message=(
            f"Bonjour {user.first_name},\n\n"
            f"Merci de vous être inscrit sur NaatalFi !\n\n"
            f"Cliquez sur ce lien pour activer votre compte :\n{verification_url}\n\n"
            f"Ce lien expire dans 24 heures.\n\n"
            f"L'équipe NaatalFi"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


@shared_task
def send_password_reset_email(user_id, reset_url):
    from apps.users.models import CustomUser
    user = CustomUser.objects.get(id=user_id)
    send_mail(
        subject='Réinitialisation de mot de passe — NaatalFi',
        message=(
            f"Bonjour {user.first_name},\n\n"
            f"Vous avez demandé une réinitialisation de mot de passe.\n\n"
            f"Cliquez sur ce lien pour créer un nouveau mot de passe :\n{reset_url}\n\n"
            f"Ce lien expire dans 1 heure.\n"
            f"Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\n"
            f"L'équipe NaatalFi"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
