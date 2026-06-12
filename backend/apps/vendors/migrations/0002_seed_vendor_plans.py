from django.db import migrations


def seed_plans(apps, schema_editor):
    VendorPlan = apps.get_model('vendors', 'VendorPlan')
    VendorPlan.objects.bulk_create([
        VendorPlan(name='FREE',    commission_rate='8.00', monthly_price='0', max_products=None),
        VendorPlan(name='PRO',     commission_rate='8.00', monthly_price='0', max_products=None),
        VendorPlan(name='PREMIUM', commission_rate='8.00', monthly_price='0', max_products=None),
    ], ignore_conflicts=True)


def remove_plans(apps, schema_editor):
    VendorPlan = apps.get_model('vendors', 'VendorPlan')
    VendorPlan.objects.filter(name__in=['FREE', 'PRO', 'PREMIUM']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('vendors', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_plans, remove_plans),
    ]
