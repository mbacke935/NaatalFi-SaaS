from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    parent     = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='children',
    )
    name       = models.CharField(max_length=255)
    slug       = models.SlugField(max_length=255, unique=True, blank=True)
    image      = models.URLField(max_length=500, blank=True, null=True)
    order      = models.PositiveIntegerField(default=0)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Catégorie'
        verbose_name_plural = 'Catégories'
        ordering            = ['order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        # Enforce max 2 levels: a child cannot itself be a parent
        if self.parent and self.parent.parent_id:
            raise ValueError("Les catégories ne peuvent pas dépasser 2 niveaux.")
        super().save(*args, **kwargs)

    def _generate_unique_slug(self):
        base = slugify(self.name)
        slug = base
        n = 1
        while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{n}"
            n += 1
        return slug

    def __str__(self):
        return f"{self.parent.name} / {self.name}" if self.parent else self.name
