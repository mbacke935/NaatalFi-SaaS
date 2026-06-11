from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('products', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Address',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('label',      models.CharField(default='Maison', max_length=100)),
                ('full_name',  models.CharField(max_length=200)),
                ('phone',      models.CharField(max_length=20)),
                ('street',     models.TextField()),
                ('city',       models.CharField(max_length=100)),
                ('region',     models.CharField(blank=True, max_length=100)),
                ('is_default', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user',       models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='addresses',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name':        'Adresse',
                'verbose_name_plural': 'Adresses',
                'ordering':            ['-is_default', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Favorite',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user',       models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='favorites',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('product',    models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='favorited_by',
                    to='products.product',
                )),
            ],
            options={
                'verbose_name':        'Favori',
                'verbose_name_plural': 'Favoris',
                'ordering':            ['-created_at'],
                'unique_together':     {('user', 'product')},
            },
        ),
    ]
