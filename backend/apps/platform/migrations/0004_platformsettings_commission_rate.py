from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('platform', '0003_platformsettings_popular_categories'),
    ]

    operations = [
        migrations.AddField(
            model_name='platformsettings',
            name='commission_rate',
            field=models.DecimalField(
                decimal_places=2,
                default=8,
                help_text='Commission plateforme en pourcentage appliquee aux ventes.',
                max_digits=5,
                validators=[MinValueValidator(0), MaxValueValidator(100)],
            ),
        ),
    ]
