from django.conf import settings


class ExtraSecurityHeadersMiddleware:
    """Adds conservative browser hardening headers not covered by SecurityMiddleware."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if not getattr(settings, 'SECURITY_HEADERS_ENABLED', False):
            return response

        headers = getattr(settings, 'EXTRA_SECURITY_HEADERS', {})
        for name, value in headers.items():
            response.setdefault(name, value)
        return response
