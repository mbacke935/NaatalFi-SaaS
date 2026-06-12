from rest_framework import serializers

from .models import PlatformSettings


class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = [
            'contact_email',
            'phone_number',
            'facebook_url',
            'instagram_url',
            'tiktok_url',
            'linkedin_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

