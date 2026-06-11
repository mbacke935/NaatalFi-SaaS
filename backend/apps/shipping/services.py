from decimal import Decimal
from .models import ShippingZone


def _rate_matches_weight(rate, weight):
    if weight is None:
        return True
    if rate.min_weight is not None and weight < rate.min_weight:
        return False
    if rate.max_weight is not None and weight > rate.max_weight:
        return False
    return True


def get_shipping_rate(vendor_id, region, weight=None):
    """
    Returns (price: Decimal, estimated_days: int|None) for vendor + region + weight.
    Falls back to (0.00, None) if no active zone covers the region.
    """
    if not region:
        return Decimal('0.00'), None
    weight = Decimal(str(weight)) if weight not in (None, '') else None

    zones = (
        ShippingZone.objects
        .filter(vendor_id=vendor_id, is_active=True)
        .prefetch_related('rates')
    )
    for zone in zones:
        if region in (zone.regions or []):
            rate = next((r for r in zone.rates.all() if _rate_matches_weight(r, weight)), None)
            if rate:
                return rate.price, rate.estimated_days
    return Decimal('0.00'), None


def estimate_shipping_for_vendors(vendor_ids, region, weight=None):
    """
    Returns dict {vendor_id: {'price': str, 'estimated_days': int|None}}
    """
    result = {}
    for vendor_id in vendor_ids:
        price, days = get_shipping_rate(vendor_id, region, weight=weight)
        result[vendor_id] = {'price': str(price), 'estimated_days': days}
    return result
