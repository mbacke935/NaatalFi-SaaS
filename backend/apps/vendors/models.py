from django.db import models
from django.conf import settings
from django.utils.text import slugify


class VendorPlan(models.Model):
    class Name(models.TextChoices):
        FREE    = 'FREE',    'Gratuit'
        PRO     = 'PRO',     'Pro'
        PREMIUM = 'PREMIUM', 'Premium'

    name            = models.CharField(max_length=10, choices=Name.choices, unique=True)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2)   # ex: 10.00 = 10%
    monthly_price   = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # FCFA
    max_products    = models.PositiveIntegerField(null=True, blank=True)     # null = illimité

    class Meta:
        verbose_name        = 'Plan vendeur'
        verbose_name_plural = 'Plans vendeurs'
        ordering            = ['commission_rate']

    def __str__(self):
        return f"{self.name} ({self.commission_rate}%)"


class Vendor(models.Model):
    class Status(models.TextChoices):
        PENDING   = 'PENDING',   'En attente'
        APPROVED  = 'APPROVED',  'Approuvé'
        SUSPENDED = 'SUSPENDED', 'Suspendu'

    user        = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vendor'
    )
    plan        = models.ForeignKey(
        VendorPlan,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='vendors'
    )
    name        = models.CharField(max_length=255)
    slug        = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True)
    logo        = models.URLField(max_length=500, blank=True, null=True)
    phone       = models.CharField(max_length=20, blank=True)
    whatsapp    = models.CharField(max_length=20, blank=True)
    contact_email = models.EmailField(blank=True)
    address     = models.TextField(blank=True)
    city        = models.CharField(max_length=120, blank=True)
    region      = models.CharField(max_length=120, blank=True)
    facebook_url = models.URLField(max_length=500, blank=True)
    instagram_url = models.URLField(max_length=500, blank=True)
    tiktok_url  = models.URLField(max_length=500, blank=True)
    website_url = models.URLField(max_length=500, blank=True)
    status      = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    trust_score = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Vendeur'
        verbose_name_plural = 'Vendeurs'
        ordering            = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        super().save(*args, **kwargs)

    def _generate_unique_slug(self):
        base = slugify(self.name)
        slug = base
        n = 1
        while Vendor.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{n}"
            n += 1
        return slug

    def __str__(self):
        return self.name
