from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_refactor_vendororder'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='status',
            field=models.CharField(
                choices=[
                    ('PENDING', 'En attente'),
                    ('PAID', 'Payee'),
                    ('CANCELLED', 'Annulée'),
                ],
                default='PENDING',
                max_length=15,
            ),
        ),
    ]
