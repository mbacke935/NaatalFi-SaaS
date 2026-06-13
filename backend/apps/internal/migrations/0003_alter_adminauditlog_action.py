from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('internal', '0002_adminauditlog'),
    ]

    operations = [
        migrations.AlterField(
            model_name='adminauditlog',
            name='action',
            field=models.CharField(choices=[
                ('PLATFORM_SETTINGS_UPDATED', 'Platform settings updated'),
                ('PLATFORM_COMMISSION_UPDATED', 'Platform commission updated'),
                ('PLATFORM_PAYOUT_ACCOUNT_UPDATED', 'Platform payout account updated'),
                ('USER_UPDATED', 'User updated'),
                ('USER_DELETED', 'User deleted'),
                ('VENDOR_APPROVED', 'Vendor approved'),
                ('VENDOR_SUSPENDED', 'Vendor suspended'),
                ('PAYOUT_APPROVED', 'Payout approved'),
                ('PAYOUT_REJECTED', 'Payout rejected'),
                ('EMAIL_RETRY_REQUESTED', 'Email retry requested'),
            ], max_length=80),
        ),
    ]
