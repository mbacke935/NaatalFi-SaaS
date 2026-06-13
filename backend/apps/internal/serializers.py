from rest_framework import serializers

from .models import AdminAuditLog


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
