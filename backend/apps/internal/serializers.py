from rest_framework import serializers

from .models import AdminAuditLog, EmailLog


class AdminAuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source='actor.email', read_only=True)

    class Meta:
        model = AdminAuditLog
        fields = [
            'id',
            'actor',
            'actor_email',
            'action',
            'target_type',
            'target_id',
            'target_repr',
            'metadata',
            'ip_address',
            'user_agent',
            'created_at',
        ]
        read_only_fields = fields


class EmailLogSerializer(serializers.ModelSerializer):
    message_preview = serializers.SerializerMethodField()

    class Meta:
        model = EmailLog
        fields = [
            'id',
            'to_email',
            'subject',
            'message_preview',
            'from_email',
            'status',
            'attempts',
            'max_attempts',
            'last_error',
            'scheduled_at',
            'sent_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_message_preview(self, obj):
        message = obj.message or ''
        return message[:180]
