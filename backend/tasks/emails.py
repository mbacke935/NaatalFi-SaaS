from celery import shared_task
from django.conf import settings

from apps.internal.services import queue_email


@shared_task
def send_verification_email(user_id, verification_url):
    from apps.users.models import CustomUser

    user = CustomUser.objects.get(id=user_id)
    queue_email(
        subject='Verifiez votre adresse email - NaatalFi',
        message=(
            f"Bonjour {user.first_name},\n\n"
            "Merci de vous etre inscrit sur NaatalFi !\n\n"
            f"Cliquez sur ce lien pour activer votre compte :\n{verification_url}\n\n"
            "Ce lien expire dans 24 heures.\n\n"
            "L'equipe NaatalFi"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient=user.email,
    )


@shared_task
def send_password_reset_email(user_id, reset_url):
    from apps.users.models import CustomUser

    user = CustomUser.objects.get(id=user_id)
    queue_email(
        subject='Reinitialisation de mot de passe - NaatalFi',
        message=(
            f"Bonjour {user.first_name},\n\n"
            "Vous avez demande une reinitialisation de mot de passe.\n\n"
            f"Cliquez sur ce lien pour creer un nouveau mot de passe :\n{reset_url}\n\n"
            "Ce lien expire dans 1 heure.\n"
            "Si vous n'etes pas a l'origine de cette demande, ignorez cet email.\n\n"
            "L'equipe NaatalFi"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient=user.email,
    )
