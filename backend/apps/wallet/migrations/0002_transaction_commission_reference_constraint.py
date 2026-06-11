from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):

    dependencies = [
        ('wallet', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='transaction',
            name='type',
            field=models.CharField(
                choices=[
                    ('SALE', 'Vente'),
                    ('COMMISSION', 'Commission'),
                    ('PAYOUT', 'Retrait'),
                    ('REFUND', 'Remboursement'),
                    ('FREEZE', 'Gel'),
                    ('RELEASE', 'Dégel'),
                ],
                max_length=10,
            ),
        ),
        migrations.AddConstraint(
            model_name='transaction',
            constraint=models.UniqueConstraint(
                fields=('reference',),
                condition=~Q(reference=''),
                name='unique_wallet_transaction_reference',
            ),
        ),
    ]
