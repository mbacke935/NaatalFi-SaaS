import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'email est obligatoire.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('role', CustomUser.Role.ADMIN)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN    = 'ADMIN',    'Administrateur'
        VENDOR   = 'VENDOR',   'Vendeur'
        CUSTOMER = 'CUSTOMER', 'Client'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email       = models.EmailField(unique=True)
    first_name  = models.CharField(max_length=150)
    last_name   = models.CharField(max_length=150)
    phone       = models.CharField(max_length=20, blank=True, null=True)
    role        = models.CharField(max_length=10, choices=Role.choices, default=Role.CUSTOMER)
    is_verified = models.BooleanField(default=False)
    avatar      = models.URLField(max_length=500, blank=True, null=True)
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

    class Meta:
        verbose_name        = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering            = ['-date_joined']

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    def __str__(self):
        return self.email
