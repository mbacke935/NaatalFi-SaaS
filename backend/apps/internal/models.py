from django.db import models
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
