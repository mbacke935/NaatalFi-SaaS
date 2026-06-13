import hashlib
import hmac

import requests
from django.conf import settings


class PayTechError(Exception):
    pass


def paytech_configured():
    return bool(settings.PAYTECH_API_KEY and settings.PAYTECH_API_SECRET)


def wave_business_configured():
    return bool(settings.WAVE_BUSINESS_PAYMENT_URL)


def _extract_payment_url(data):
    url_keys = ('redirect_url', 'redirectUrl', 'payment_url', 'paymentUrl', 'url')
    for key in url_keys:
        if data.get(key):
            return data[key]

    for nested_key in ('data', 'result', 'response'):
        nested = data.get(nested_key)
        if isinstance(nested, dict):
            nested_url = _extract_payment_url(nested)
            if nested_url:
                return nested_url
    return ''


def _extract_provider_reference(data):
    for key in ('token', 'reference', 'transaction_id', 'payment_reference'):
        if data.get(key):
            return str(data[key])

    for nested_key in ('data', 'result', 'response'):
        nested = data.get(nested_key)
        if isinstance(nested, dict):
            reference = _extract_provider_reference(nested)
            if reference:
                return reference
    return ''


def request_wave_payment(payment):
    if not wave_business_configured():
        raise PayTechError('Lien Wave Business non configure.')

    payment.payment_url = settings.WAVE_BUSINESS_PAYMENT_URL
    payment.provider_reference = payment.reference
    payment.raw_response = {
        'type': 'wave_business_manual',
        'account_name': settings.WAVE_BUSINESS_ACCOUNT_NAME,
        'phone': settings.WAVE_BUSINESS_PHONE,
        'instructions': 'Paiement Wave Business a confirmer manuellement par admin.',
    }
    payment.save(update_fields=['payment_url', 'provider_reference', 'raw_response', 'updated_at'])
    return payment


def _paytech_success(data):
    value = data.get('success')
    if value is None:
        return True
    return str(value).lower() in {'1', 'true', 'yes', 'success'}


def _paytech_error_message(data):
    message = data.get('message') or data.get('error')
    if isinstance(message, list):
        message = ' '.join(str(item) for item in message)
    if isinstance(message, dict):
        message = message.get('message') or str(message)
    return str(message or 'Paiement refuse par PayTech.')


def build_paytech_payload(payment, request):
    frontend = settings.FRONTEND_URL.rstrip('/')
    backend = settings.BACKEND_URL.rstrip('/')
    if payment.order.buyer_id:
        success_url = f"{frontend}/account/orders/{payment.order_id}?payment=success"
    else:
        success_url = (
            f"{frontend}/guest/orders/{payment.order_id}"
            f"?token={payment.order.guest_access_token}&payment=success"
        )
    return {
        'item_name': f"Commande #{payment.order_id}",
        'item_price': int(payment.amount),
        'currency': payment.currency,
        'ref_command': payment.reference,
        'command_name': f"NaatalFi commande #{payment.order_id}",
        'env': settings.PAYTECH_ENV,
        'ipn_url': f"{backend}/api/v1/payments/webhook/",
        'success_url': success_url,
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
        raise PayTechError('Reponse PayTech invalide.') from exc

    payment.raw_response = data
    payment.save(update_fields=['raw_response', 'updated_at'])

    if response.status_code >= 400 or not _paytech_success(data):
        raise PayTechError(_paytech_error_message(data))

    payment_url = _extract_payment_url(data)
    if not payment_url:
        raise PayTechError('PayTech n a pas retourne d URL de paiement.')

    payment.payment_url = payment_url
    payment.provider_reference = _extract_provider_reference(data)
    payment.save(update_fields=['payment_url', 'provider_reference', 'updated_at'])
    return payment


def verify_webhook_signature(request):
    """
    Verifie l'authenticite d'un IPN PayTech.

    1. Methode native PayTech : le corps de l'IPN contient `api_key_sha256` et
       `api_secret_sha256` (SHA256 des cles API).
    2. Fallback : signature HMAC custom dans un header `X-PayTech-Signature`.
    3. Si aucune methode n'est configuree/presente : refus en production,
       acceptation uniquement en DEBUG pour les tests locaux.
    """
    payload = getattr(request, 'data', None) or {}
    received_key = payload.get('api_key_sha256')
    received_secret = payload.get('api_secret_sha256')

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

    secret = settings.PAYTECH_WEBHOOK_SECRET
    if secret:
        signature = request.headers.get('X-PayTech-Signature') or request.headers.get('X-Signature')
        if not signature:
            return False
        expected = hmac.new(secret.encode(), request.body, hashlib.sha256).hexdigest()
        if signature.startswith('sha256='):
            signature = signature.removeprefix('sha256=')
        return hmac.compare_digest(signature, expected)

    return settings.DEBUG


def webhook_marks_paid(payload):
    status = str(payload.get('status') or payload.get('payment_status') or '').upper()
    event = str(payload.get('type_event') or payload.get('event') or '').lower()
    return status in {'PAID', 'SUCCESS', 'COMPLETED'} or event in {'sale_complete', 'payment_success'}
