from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Avg, Count


def _round_one_decimal(value):
    return Decimal(str(value or 0)).quantize(Decimal('0.1'), rounding=ROUND_HALF_UP)


def recalculate_product_rating(product):
    aggregate = product.reviews.aggregate(
        average=Avg('rating'),
        total=Count('id'),
    )
    product.average_rating = _round_one_decimal(aggregate['average'])
    product.total_reviews = aggregate['total'] or 0
    product.trust_score = float(product.average_rating)
    product.save(update_fields=['average_rating', 'total_reviews', 'trust_score', 'updated_at'])
    return product


def recalculate_vendor_trust_score(vendor):
    aggregate = vendor.reviews.aggregate(
        average=Avg('rating'),
        total=Count('id'),
    )
    vendor.trust_score = _round_one_decimal(aggregate['average'])
    vendor.save(update_fields=['trust_score', 'updated_at'])
    return vendor


def recalculate_review_scores(product, vendor):
    recalculate_product_rating(product)
    recalculate_vendor_trust_score(vendor)

