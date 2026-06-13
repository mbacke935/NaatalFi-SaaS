from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('internal', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='AdminAuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[
                    ('PLATFORM_SETTINGS_UPDATED', 'Platform settings updated'),
                    ('PLATFORM_COMMISSION_UPDATED', 'Platform commission updated'),
                    ('PLATFORM_PAYOUT_ACCOUNT_UPDATED', 'Platform payout account updated'),
                    ('USER_UPDATED', 'User updated'),
                    ('USER_DELETED', 'User deleted'),
                    ('VENDOR_APPROVED', 'Vendor approved'),
                    ('VENDOR_SUSPENDED', 'Vendor suspended'),
                    ('PAYOUT_APPROVED', 'Payout approved'),
                    ('PAYOUT_REJECTED', 'Payout rejected'),
                ], max_length=80)),
                ('target_type', models.CharField(blank=True, max_length=120)),
                ('target_id', models.CharField(blank=True, max_length=120)),
                ('target_repr', models.CharField(blank=True, max_length=255)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='admin_audit_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at', '-id'],
            },
        ),
        migrations.AddIndex(
            model_name='adminauditlog',
            index=models.Index(fields=['action', 'created_at'], name='internal_ad_action_18597e_idx'),
        ),
        migrations.AddIndex(
            model_name='adminauditlog',
            index=models.Index(fields=['target_type', 'target_id'], name='internal_ad_target__c6951e_idx'),
        ),
    ]
