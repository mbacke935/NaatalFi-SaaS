from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wallet', '0003_transaction_ad_spend'),
    ]

    operations = [
        migrations.AlterField(
            model_name='transaction',
            name='type',
            field=models.CharField(choices=[('SALE', 'Vente'), ('COMMISSION', 'Commission'), ('PAYOUT', 'Retrait'), ('REFUND', 'Remboursement'), ('FREEZE', 'Gel'), ('AD_SPEND', 'Publicite'), ('UNFREEZE', 'Degel litige'), ('RELEASE', 'Dégel')], max_length=10),
        ),
    ]

