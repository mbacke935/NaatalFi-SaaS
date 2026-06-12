import hashlib
import hmac

import requests
from django.conf import settings


class PayTechError(Exception):
    pass


def paytech_configured():
    return bool(settings.PAYTECH_API_KEY and settings.PAYTECH_API_SECRET)


def build_paytech_payload(payment, request):
    frontend = settings.FRONTEND_URL.rstrip('/')
    backend = settings.BACKEND_URL.rstrip('/')
    return {
        'item_name': f"Commande #{payment.order_id}",
        'item_price': int(payment.amount),
        'currency': payment.currency,
        'ref_command': payment.reference,
        'command_name': f"NaatalFi commande #{payment.order_id}",
        'env': settings.PAYTECH_ENV,
        'ipn_url': f"{backend}/api/v1/payments/webhook/",
        'success_url': f"{frontend}/account/orders/{payment.order_id}?payment=success",
        'cancel_url': f"{frontend}/checkout?payment=cancelled",
    }


def request_paytech_payment(payment, request):
    if not paytech_configured():
        raise PayTechError('Configuration PayTech manquante.')

    payload = build_paytech_payload(payment, request)
    try:
        response = requests.post(
            settings.PAYTECH_BASE_URL,
            json=payload,
            headers={
                'API_KEY': settings.PAYTECH_API_KEY,
                'API_SECRET': settings.PAYTECH_API_SECRET,
                'Content-Type': 'application/json',
            },
            timeout=20,
        )
    except requests.RequestException as exc:
        raise PayTechError("PayTech n'est pas joignable.") from exc

    try:
        data = response.json()
    except ValueError as exc:
        raise PayTechError('Réponse PayTech invalide.') from exc

    if response.status_code >= 400 or data.get('success') in [False, 0, '0']:
        message = data.get('message') or data.get('error') or 'Paiement refusé par PayTech.'
        raise PayTechError(message)

    payment_url = data.get('redirect_url') or data.get('payment_url') or data.get('url')
    if not payment_url:
        raise PayTechError('PayTech n’a pas retourné d’URL de paiement.')

    payment.payment_url = payment_url
    payment.provider_reference = str(data.get('token') or data.get('reference') or '')
    payment.raw_response = data
    payment.save(update_fields=['payment_url', 'provider_reference', 'raw_response', 'updated_at'])
    return payment


def verify_webhook_signature(request):
    """
    Vérifie l'authenticité d'un IPN PayTech.

    1. Méthode native PayTech : le corps de l'IPN contient `api_key_sha256` et
       `api_secret_sha256` (SHA256 des clés API). C'est la méthode officielle.
    2. Fallback : signature HMAC custom dans un header `X-PayTech-Signature`.
    3. Si aucune méthode n'est configurée/présente : refus en production,
       acceptation uniquement en DEBUG (pour faciliter les tests locaux).
    """
    payload = getattr(request, 'data', None) or {}
    received_key = payload.get('api_key_sha256')
    received_secret = payload.get('api_secret_sha256')

    # ── 1. Vérification native PayTech ──────────────────────────────────
    if received_key and received_secret:
        api_key = settings.PAYTECH_API_KEY
        api_secret = settings.PAYTECH_API_SECRET
        if not (api_key and api_secret):
            return False
        expected_key = hashlib.sha256(api_key.encode()).hexdigest()
        expected_secret = hashlib.sha256(api_secret.encode()).hexdigest()
        return (
            hmac.compare_digest(received_key, expected_key)
            and hmac.compare_digest(received_secret, expected_secret)
        )

    # ── 2. Fallback : signature HMAC dans un header ─────────────────────
    secret = settings.PAYTECH_WEBHOOK_SECRET
    if secret:
        signature = request.headers.get('X-PayTech-Signature') or request.headers.get('X-Signature')
        if not signature:
            return False
        expected = hmac.new(secret.encode(), request.body, hashlib.sha256).hexdigest()
        if signature.startswith('sha256='):
            signature = signature.removeprefix('sha256=')
        return hmac.compare_digest(signature, expected)

    # ── 3. Aucune méthode disponible ────────────────────────────────────
    return settings.DEBUG


def webhook_marks_paid(payload):
    status = str(payload.get('status') or payload.get('payment_status') or '').upper()
    event = str(payload.get('type_event') or payload.get('event') or '').lower()
    return status in {'PAID', 'SUCCESS', 'COMPLETED'} or event in {'sale_complete', 'payment_success'}
