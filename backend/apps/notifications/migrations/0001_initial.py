# Generated for Phase 14 notifications.

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('ACCOUNT', 'Compte'), ('ORDER', 'Commande'), ('PAYMENT', 'Paiement'), ('VENDOR', 'Vendeur'), ('WALLET', 'Wallet'), ('SYSTEM', 'Systeme')], default='SYSTEM', max_length=20)),
                ('title', models.CharField(blank=True, max_length=160)),
                ('message', models.TextField()),
                ('link_url', models.CharField(blank=True, max_length=500)),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'is_read', '-created_at'], name='notificatio_user_id_f2ad08_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['type', '-created_at'], name='notificatio_type_36f2e6_idx'),
        ),
    ]
