from django.db import migrations


def apply_flat_free_plan(apps, schema_editor):
    VendorPlan = apps.get_model('vendors', 'VendorPlan')
    Vendor = apps.get_model('vendors', 'Vendor')

    free_plan, _ = VendorPlan.objects.update_or_create(
        name='FREE',
        defaults={
            'commission_rate': '8.00',
            'monthly_price': '0.00',
            'max_products': None,
        },
    )
    VendorPlan.objects.filter(name__in=['PRO', 'PREMIUM']).update(
        commission_rate='8.00',
        monthly_price='0.00',
        max_products=None,
    )
    Vendor.objects.update(plan=free_plan)


class Migration(migrations.Migration):
    dependencies = [
        ('vendors', '0002_seed_vendor_plans'),
    ]

    operations = [
        migrations.RunPython(apply_flat_free_plan, migrations.RunPython.noop),
    ]
