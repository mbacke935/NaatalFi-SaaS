from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('orders', '0004_normalize_order_fields'),
        ('products', '0002_product_ratings'),
        ('vendors', '0002_seed_vendor_plans'),
    ]

    operations = [
        migrations.CreateModel(
            name='Review',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])),
                ('comment', models.TextField(blank=True)),
                ('is_verified_purchase', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reviews', to=settings.AUTH_USER_MODEL)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reviews', to='products.product')),
                ('vendor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reviews', to='vendors.vendor')),
                ('vendor_order', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='reviews', to='orders.vendororder')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='review',
            constraint=models.UniqueConstraint(fields=('author', 'vendor_order', 'product'), name='unique_review_per_product_order_author'),
        ),
        migrations.AddIndex(
            model_name='review',
            index=models.Index(fields=['product', '-created_at'], name='reviews_rev_product_d800fc_idx'),
        ),
        migrations.AddIndex(
            model_name='review',
            index=models.Index(fields=['vendor', '-created_at'], name='reviews_rev_vendor__c6ccd7_idx'),
        ),
        migrations.AddIndex(
            model_name='review',
            index=models.Index(fields=['author', '-created_at'], name='reviews_rev_author__8385c0_idx'),
        ),
    ]
