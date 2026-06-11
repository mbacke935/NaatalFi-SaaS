from decimal import Decimal
from .models import ShippingZone


def get_shipping_rate(vendor_id, region):
    """
    Returns (price: Decimal, estimated_days: int|None) for vendor + region.
    Falls back to (0.00, None) if no active zone covers the region.
    """
    if not region:
        return Decimal('0.00'), None

    zones = (
        ShippingZone.objects
        .filter(vendor_id=vendor_id, is_active=True)
        .prefetch_related('rates')
    )
    for zone in zones:
        if region in (zone.regions or []):
            rate = zone.rates.first()
            if rate:
                return rate.price, rate.estimated_days
    return Decimal('0.00'), None


def estimate_shipping_for_vendors(vendor_ids, region):
    """
    Returns dict {vendor_id: {'price': str, 'estimated_days': int|None}}
    """
    result = {}
    for vendor_id in vendor_ids:
        price, days = get_shipping_rate(vendor_id, region)
        result[vendor_id] = {'price': str(price), 'estimated_days': days}
    return result
