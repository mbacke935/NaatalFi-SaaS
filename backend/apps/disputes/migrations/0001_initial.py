from decimal import Decimal

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('orders', '0004_normalize_order_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='Dispute',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reason', models.CharField(max_length=80)),
                ('description', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('OPEN', 'Ouvert'), ('UNDER_REVIEW', 'En revue'), ('RESOLVED', 'Resolu'), ('CLOSED', 'Ferme')], default='OPEN', max_length=20)),
                ('resolution', models.CharField(blank=True, choices=[('REFUND', 'Remboursement'), ('NO_REFUND', 'Pas de remboursement')], max_length=20)),
                ('admin_note', models.TextField(blank=True)),
                ('frozen_amount', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=12)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('initiator', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='disputes', to=settings.AUTH_USER_MODEL)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='disputes', to='orders.order')),
                ('vendor_order', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='disputes', to='orders.vendororder')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='dispute',
            constraint=models.UniqueConstraint(condition=models.Q(('status__in', ['OPEN', 'UNDER_REVIEW'])), fields=('vendor_order',), name='unique_open_dispute_per_vendor_order'),
        ),
        migrations.AddIndex(
            model_name='dispute',
            index=models.Index(fields=['status', '-created_at'], name='disputes_di_status_e85bdd_idx'),
        ),
        migrations.AddIndex(
            model_name='dispute',
            index=models.Index(fields=['initiator', '-created_at'], name='disputes_di_initiat_b8248a_idx'),
        ),
        migrations.AddIndex(
            model_name='dispute',
            index=models.Index(fields=['vendor_order', 'status'], name='disputes_di_vendor__c00f7b_idx'),
        ),
    ]
