from django.db import migrations


def seed_plans(apps, schema_editor):
    VendorPlan = apps.get_model('vendors', 'VendorPlan')
    VendorPlan.objects.bulk_create([
        VendorPlan(name='FREE',    commission_rate='10.00', monthly_price='0',     max_products=10),
        VendorPlan(name='PRO',     commission_rate='7.00',  monthly_price='15000', max_products=100),
        VendorPlan(name='PREMIUM', commission_rate='5.00',  monthly_price='30000', max_products=None),
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
