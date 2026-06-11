from django.db import models
from django.utils.text import slugify


class Product(models.Model):
    class Status(models.TextChoices):
        DRAFT        = 'DRAFT',        'Brouillon'
        PUBLISHED    = 'PUBLISHED',    'Publié'
        OUT_OF_STOCK = 'OUT_OF_STOCK', 'Rupture de stock'
        ARCHIVED     = 'ARCHIVED',     'Archivé'

    vendor      = models.ForeignKey(
        'vendors.Vendor', on_delete=models.CASCADE, related_name='products'
    )
    category    = models.ForeignKey(
        'categories.Category', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='products'
    )
    name        = models.CharField(max_length=255)
    slug        = models.SlugField(max_length=280, unique=True, blank=True)
    description = models.TextField(blank=True)
    price       = models.DecimalField(max_digits=12, decimal_places=2)
    status      = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    trust_score = models.FloatField(default=0.0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    total_reviews = models.PositiveIntegerField(default=0)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Produit'
        verbose_name_plural = 'Produits'
        ordering            = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)
            slug, n = base, 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base}-{n}'
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product   = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField(max_length=500)
    order     = models.PositiveSmallIntegerField(default=0)
    is_cover  = models.BooleanField(default=False)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'Image {self.order} — {self.product.name}'


class ProductVariant(models.Model):
    product     = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    name        = models.CharField(max_length=100)   # ex: Taille, Couleur
    value       = models.CharField(max_length=100)   # ex: XL, Rouge
    stock       = models.PositiveIntegerField(default=0)
    price_delta = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        ordering            = ['name', 'value']
        verbose_name        = 'Variante'
        verbose_name_plural = 'Variantes'

    def __str__(self):
        return f'{self.product.name} — {self.name}: {self.value}'
