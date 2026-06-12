from decimal import Decimal

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('products', '0002_product_ratings'),
        ('vendors', '0002_seed_vendor_plans'),
    ]

    operations = [
        migrations.CreateModel(
            name='AdCampaign',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('budget', models.DecimalField(decimal_places=2, max_digits=12)),
                ('spent', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=12)),
                ('cost_per_click', models.DecimalField(decimal_places=2, default=Decimal('50.00'), max_digits=10)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('status', models.CharField(choices=[('DRAFT', 'Brouillon'), ('ACTIVE', 'Active'), ('PAUSED', 'Pausee'), ('EXPIRED', 'Expiree')], default='ACTIVE', max_length=10)),
                ('impressions', models.PositiveIntegerField(default=0)),
                ('clicks', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ad_campaigns', to='products.product')),
                ('vendor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ad_campaigns', to='vendors.vendor')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='adcampaign',
            index=models.Index(fields=['status', 'start_date', 'end_date'], name='ads_adcampa_status_60ee9d_idx'),
        ),
        migrations.AddIndex(
            model_name='adcampaign',
            index=models.Index(fields=['vendor', '-created_at'], name='ads_adcampa_vendor__5ce1b8_idx'),
        ),
        migrations.AddIndex(
            model_name='adcampaign',
            index=models.Index(fields=['product', 'status'], name='ads_adcampa_product_b53842_idx'),
        ),
    ]
