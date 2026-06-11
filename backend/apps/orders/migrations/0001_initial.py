import django.db.models.deletion
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('products', '0001_initial'),
        ('vendors',  '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id',               models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('status',           models.CharField(
                    choices=[
                        ('PENDING',    'En attente'),
                        ('CONFIRMED',  'Confirmée'),
                        ('PROCESSING', 'En préparation'),
                        ('SHIPPED',    'Expédiée'),
                        ('DELIVERED',  'Livrée'),
                        ('CANCELLED',  'Annulée'),
                        ('REFUNDED',   'Remboursée'),
                    ],
                    default='PENDING',
                    max_length=15,
                )),
                ('total',            models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=12)),
                ('delivery_address', models.TextField()),
                ('notes',            models.TextField(blank=True)),
                ('created_at',       models.DateTimeField(auto_now_add=True)),
                ('updated_at',       models.DateTimeField(auto_now=True)),
                ('buyer',  models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='orders',  to=settings.AUTH_USER_MODEL)),
                ('vendor', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='orders',  to='vendors.vendor')),
            ],
            options={
                'verbose_name':        'Commande',
                'verbose_name_plural': 'Commandes',
                'ordering':            ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='OrderItem',
            fields=[
                ('id',            models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('product_name',  models.CharField(max_length=255)),
                ('product_slug',  models.SlugField(max_length=280)),
                ('variant_label', models.CharField(blank=True, max_length=200)),
                ('cover_image',   models.URLField(blank=True, max_length=500, null=True)),
                ('unit_price',    models.DecimalField(decimal_places=2, max_digits=12)),
                ('quantity',      models.PositiveIntegerField()),
                ('order',   models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,  related_name='items',   to='orders.order')),
                ('product', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='products.product')),
                ('variant', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='products.productvariant')),
            ],
            options={
                'verbose_name':        'Article',
                'verbose_name_plural': 'Articles',
            },
        ),
    ]
