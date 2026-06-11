from apps.notifications.models import Notification


def create_notification(user, type, message, title='', link_url=''):
    if not user:
        return None
    return Notification.objects.create(
        user=user,
        type=type,
        title=title,
        message=message,
        link_url=link_url,
    )

