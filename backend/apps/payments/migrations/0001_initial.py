import django.db.models.deletion
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('orders', '0004_normalize_order_fields'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('provider', models.CharField(choices=[('PAYTECH', 'PayTech'), ('WAVE', 'Wave'), ('ORANGE_MONEY', 'Orange Money')], default='PAYTECH', max_length=20)),
                ('amount', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=12)),
                ('currency', models.CharField(default='XOF', max_length=3)),
                ('status', models.CharField(choices=[('PENDING', 'En attente'), ('PAID', 'Payé'), ('FAILED', 'Échoué'), ('CANCELLED', 'Annulé'), ('EXPIRED', 'Expiré')], default='PENDING', max_length=15)),
                ('reference', models.CharField(editable=False, max_length=80, unique=True)),
                ('provider_reference', models.CharField(blank=True, max_length=120)),
                ('payment_url', models.URLField(blank=True, max_length=1000)),
                ('raw_response', models.JSONField(blank=True, default=dict)),
                ('raw_webhook', models.JSONField(blank=True, default=dict)),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('buyer', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='payments', to=settings.AUTH_USER_MODEL)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='payments', to='orders.order')),
            ],
            options={
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['reference'], name='payments_pa_referen_75358f_idx'),
                    models.Index(fields=['status', 'provider'], name='payments_pa_status_eb2eec_idx'),
                ],
            },
        ),
    ]
