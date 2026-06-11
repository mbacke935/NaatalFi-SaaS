from celery import shared_task


@shared_task
def create_notification_task(user_id, type, message, title='', link_url=''):
    from apps.notifications.services import create_notification
    from apps.users.models import CustomUser

    try:
        user = CustomUser.objects.get(pk=user_id)
    except CustomUser.DoesNotExist:
        return {'created': False, 'reason': 'user_not_found'}

    notification = create_notification(
        user=user,
        type=type,
        message=message,
        title=title,
        link_url=link_url,
    )
    return {'created': True, 'id': notification.id}


@shared_task
def calculate_trust_score(vendor_id=None, product_id=None):
    from apps.products.models import Product
    from apps.vendors.models import Vendor
    from apps.reviews.services import recalculate_product_rating, recalculate_vendor_trust_score

    updated = {'vendors': 0, 'products': 0}

    if vendor_id:
        vendor = Vendor.objects.filter(pk=vendor_id).first()
        if vendor:
            recalculate_vendor_trust_score(vendor)
            updated['vendors'] = 1

    if product_id:
        product = Product.objects.filter(pk=product_id).first()
        if product:
            recalculate_product_rating(product)
            updated['products'] = 1

    return updated
