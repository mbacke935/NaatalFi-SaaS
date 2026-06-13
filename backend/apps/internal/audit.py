from .models import AdminAuditLog


def _client_ip(request):
    forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_admin_action(request, action, target=None, target_repr='', metadata=None):
    actor = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None
    target_type = ''
    target_id = ''
    if target is not None:
        target_type = target.__class__.__name__
        target_id = str(getattr(target, 'pk', '') or '')
        target_repr = target_repr or str(target)

    return AdminAuditLog.objects.create(
        actor=actor,
        action=action,
        target_type=target_type,
        target_id=target_id,
        target_repr=(target_repr or '')[:255],
        metadata=metadata or {},
        ip_address=_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
    )
