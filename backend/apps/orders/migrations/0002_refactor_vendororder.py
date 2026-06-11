from decimal import Decimal
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def migrate_orders_to_vendororders(apps, schema_editor):
    """
    Pour chaque Order existant (architecture ancienne avec vendor FK),
    crée un VendorOrder et migre les OrderItems.
    """
    Order       = apps.get_model('orders', 'Order')
    VendorOrder = apps.get_model('orders', 'VendorOrder')
    OrderItem   = apps.get_model('orders', 'OrderItem')

    for order in Order.objects.all():
        vendor_id = order.vendor_id
        if not vendor_id:
            continue

        subtotal = sum(
            (item.unit_price * item.quantity)
            for item in OrderItem.objects.filter(order=order)
        )

        vo = VendorOrder.objects.create(
            order         = order,
            vendor_id     = vendor_id,
            status        = order.status,
            subtotal      = subtotal or Decimal('0.00'),
            shipping_cost = Decimal('0.00'),
        )

        OrderItem.objects.filter(order=order).update(vendor_order=vo)


class Migration(migrations.Migration):

    dependencies = [
        ('orders',  '0001_initial'),
        ('vendors', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1 — Créer le modèle VendorOrder
        migrations.CreateModel(
            name='VendorOrder',
            fields=[
                ('id',            models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('status',        models.CharField(
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
                ('subtotal',      models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=12)),
                ('shipping_cost', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10)),
                ('created_at',    models.DateTimeField(auto_now_add=True)),
                ('updated_at',    models.DateTimeField(auto_now=True)),
                ('order',         models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='vendor_orders',
                    to='orders.order',
                )),
                ('vendor',        models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='vendor_orders',
                    to='vendors.vendor',
                )),
            ],
            options={
                'verbose_name':        'Commande vendeur',
                'verbose_name_plural': 'Commandes vendeurs',
                'ordering':            ['-created_at'],
            },
        ),

        # 2 — Ajouter vendor_order (nullable) à OrderItem
        migrations.AddField(
            model_name='orderitem',
            name='vendor_order',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='items',
                to='orders.vendororder',
            ),
        ),

        # 3 — Migration des données
        migrations.RunPython(
            migrate_orders_to_vendororders,
            migrations.RunPython.noop,
        ),

        # 4 — Rendre vendor_order obligatoire
        migrations.AlterField(
            model_name='orderitem',
            name='vendor_order',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='items',
                to='orders.vendororder',
            ),
        ),

        # 5 — Supprimer l'ancien FK order de OrderItem
        migrations.RemoveField(model_name='orderitem', name='order'),

        # 6 — Supprimer le FK vendor de Order
        migrations.RemoveField(model_name='order', name='vendor'),

        # 7 — Simplifier Order.status (PENDING / CANCELLED seulement)
        migrations.AlterField(
            model_name='order',
            name='status',
            field=models.CharField(
                choices=[('PENDING', 'En attente'), ('CANCELLED', 'Annulée')],
                default='PENDING',
                max_length=15,
            ),
        ),
    ]
