from django.db import models
from django.conf import settings
from django.utils import timezone


class EmailLog(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SENDING = 'SENDING', 'Sending'
        SENT = 'SENT', 'Sent'
        FAILED = 'FAILED', 'Failed'

    to_email = models.EmailField()
    subject = models.CharField(max_length=255)
    message = models.TextField()
    from_email = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=3)
    last_error = models.TextField(blank=True)
    scheduled_at = models.DateTimeField(default=timezone.now)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['scheduled_at', 'id']
        indexes = [
            models.Index(fields=['status', 'scheduled_at']),
        ]

    def __str__(self):
        return f'{self.to_email} - {self.subject}'


class AdminAuditLog(models.Model):
    class Action(models.TextChoices):
        PLATFORM_SETTINGS_UPDATED = 'PLATFORM_SETTINGS_UPDATED', 'Platform settings updated'
        PLATFORM_COMMISSION_UPDATED = 'PLATFORM_COMMISSION_UPDATED', 'Platform commission updated'
        PLATFORM_PAYOUT_ACCOUNT_UPDATED = 'PLATFORM_PAYOUT_ACCOUNT_UPDATED', 'Platform payout account updated'
        USER_UPDATED = 'USER_UPDATED', 'User updated'
        USER_DELETED = 'USER_DELETED', 'User deleted'
        VENDOR_APPROVED = 'VENDOR_APPROVED', 'Vendor approved'
        VENDOR_SUSPENDED = 'VENDOR_SUSPENDED', 'Vendor suspended'
        PAYOUT_APPROVED = 'PAYOUT_APPROVED', 'Payout approved'
        PAYOUT_REJECTED = 'PAYOUT_REJECTED', 'Payout rejected'

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_audit_logs',
    )
    action = models.CharField(max_length=80, choices=Action.choices)
    target_type = models.CharField(max_length=120, blank=True)
    target_id = models.CharField(max_length=120, blank=True)
    target_repr = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', '-id']
        indexes = [
            models.Index(fields=['action', 'created_at']),
            models.Index(fields=['target_type', 'target_id']),
        ]

    def __str__(self):
        return f'{self.action} by {self.actor_id or "system"}'
