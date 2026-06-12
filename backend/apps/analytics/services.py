from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, DecimalField, ExpressionWrapper, F, IntegerField, Sum, Value
from django.db.models.functions import Coalesce, TruncDate
from django.utils import timezone

from apps.disputes.models import Dispute
from apps.orders.models import Order, OrderItem, VendorOrder
from apps.wallet.models import Transaction


PAID_VENDOR_STATUSES = [
    VendorOrder.Status.CONFIRMED,
    VendorOrder.Status.PROCESSING,
    VendorOrder.Status.SHIPPED,
    VendorOrder.Status.DELIVERED,
]


def parse_period(value):
    if value in ['7d', '30d', '90d']:
        return int(value[:-1])
    try:
        days = int(value)
    except (TypeError, ValueError):
        return 30
    return max(1, min(days, 365))


def period_bounds(period):
    days = parse_period(period)
    end = timezone.now()
    start = end - timedelta(days=days - 1)
    start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    return days, start, end


def money(value):
    return value or Decimal('0.00')


def serial_money(value):
    return str(money(value).quantize(Decimal('0.01')))


def _vendor_order_total_expr():
    return F('subtotal') + F('shipping_cost')


def _daily_series(qs, days, start):
    totals = {
        row['day'].isoformat(): row
        for row in (
            qs.annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(
                revenue=Coalesce(
                    Sum(_vendor_order_total_expr()),
                    Value(Decimal('0.00')),
                    output_field=VendorOrder._meta.get_field('subtotal'),
                ),
                orders=Count('id'),
            )
        )
    }

    rows = []
    for index in range(days):
        day = (start + timedelta(days=index)).date()
        data = totals.get(day.isoformat(), {})
        rows.append({
            'date': day.isoformat(),
            'revenue': serial_money(data.get('revenue')),
            'orders': data.get('orders', 0),
        })
    return rows


def admin_overview(period='30d'):
    days, start, end = period_bounds(period)
    vendor_orders = VendorOrder.objects.filter(created_at__range=(start, end))
    paid_vendor_orders = vendor_orders.filter(status__in=PAID_VENDOR_STATUSES)
    orders = Order.objects.filter(created_at__range=(start, end))

    gmv = paid_vendor_orders.aggregate(
        total=Coalesce(
            Sum(_vendor_order_total_expr()),
            Value(Decimal('0.00')),
            output_field=VendorOrder._meta.get_field('subtotal'),
        )
    )['total']
    commissions = Transaction.objects.filter(
        type=Transaction.Type.COMMISSION,
        created_at__range=(start, end),
    ).aggregate(total=Coalesce(Sum('amount'), Value(Decimal('0.00'))))['total']

    paid_count = paid_vendor_orders.count()
    order_count = orders.count()
    dispute_count = Dispute.objects.filter(created_at__range=(start, end)).count()

    return {
        'period_days': days,
        'gmv': serial_money(gmv),
        'commissions': serial_money(commissions),
        'orders_count': paid_count,
        'created_orders_count': order_count,
        'average_basket': serial_money(gmv / paid_count if paid_count else Decimal('0.00')),
        'conversion_rate': round(paid_count / order_count, 4) if order_count else 0,
        'dispute_rate': round(dispute_count / paid_count, 4) if paid_count else 0,
        'daily': _daily_series(paid_vendor_orders, days, start),
    }


def admin_top_vendors(period='30d', limit=10):
    _, start, end = period_bounds(period)
    rows = (
        VendorOrder.objects
        .filter(created_at__range=(start, end), status__in=PAID_VENDOR_STATUSES)
        .values('vendor_id', 'vendor__name', 'vendor__slug')
        .annotate(
            revenue=Coalesce(
                Sum(_vendor_order_total_expr()),
                Value(Decimal('0.00')),
                output_field=VendorOrder._meta.get_field('subtotal'),
            ),
            orders=Count('id'),
        )
        .order_by('-revenue')[:limit]
    )
    return [
        {
            'vendor_id': row['vendor_id'],
            'name': row['vendor__name'],
            'slug': row['vendor__slug'],
            'orders': row['orders'],
            'revenue': serial_money(row['revenue']),
        }
        for row in rows
    ]


def top_products(qs, limit=10):
    item_revenue = ExpressionWrapper(
        F('unit_price') * F('quantity'),
        output_field=DecimalField(max_digits=12, decimal_places=2),
    )
    rows = (
        OrderItem.objects
        .filter(vendor_order__in=qs)
        .annotate(line_revenue=item_revenue)
        .values('product_id', 'product_name', 'product_slug')
        .annotate(
            quantity=Coalesce(Sum('quantity'), Value(0), output_field=IntegerField()),
            revenue=Coalesce(
                Sum('line_revenue'),
                Value(Decimal('0.00')),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            ),
        )
        .order_by('-revenue')[:limit]
    )
    return [
        {
            'product_id': row['product_id'],
            'name': row['product_name'],
            'slug': row['product_slug'],
            'quantity': row['quantity'],
            'revenue': serial_money(row['revenue']),
            'views': 0,
        }
        for row in rows
    ]


def vendor_analytics(vendor, period='30d'):
    days, start, end = period_bounds(period)
    vendor_orders = VendorOrder.objects.filter(vendor=vendor, created_at__range=(start, end))
    paid_vendor_orders = vendor_orders.filter(status__in=PAID_VENDOR_STATUSES)
    revenue = paid_vendor_orders.aggregate(
        total=Coalesce(
            Sum(_vendor_order_total_expr()),
            Value(Decimal('0.00')),
            output_field=VendorOrder._meta.get_field('subtotal'),
        )
    )['total']
    orders_count = paid_vendor_orders.count()
    items_sold = OrderItem.objects.filter(vendor_order__in=paid_vendor_orders).aggregate(
        total=Coalesce(Sum('quantity'), 0)
    )['total']
    disputes = Dispute.objects.filter(vendor_order__vendor=vendor, created_at__range=(start, end)).count()

    return {
        'period_days': days,
        'revenue': serial_money(revenue),
        'orders_count': orders_count,
        'items_sold': items_sold,
        'average_basket': serial_money(revenue / orders_count if orders_count else Decimal('0.00')),
        'dispute_rate': round(disputes / orders_count, 4) if orders_count else 0,
        'daily': _daily_series(paid_vendor_orders, days, start),
        'top_products': top_products(paid_vendor_orders, 10),
    }
