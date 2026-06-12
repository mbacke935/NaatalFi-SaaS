from rest_framework import serializers

from .models import PlatformSettings


class PlatformSettingsSerializer(serializers.ModelSerializer):
    popular_categories = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = PlatformSettings
        fields = [
            'contact_email',
            'phone_number',
            'facebook_url',
            'instagram_url',
            'tiktok_url',
            'linkedin_url',
            'hero_image_url',
            'popular_categories',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_popular_categories(self, value):
        cleaned = []
        for index, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(f'La categorie #{index + 1} est invalide.')

            title = str(item.get('title', '')).strip()
            image = str(item.get('image', '')).strip()
            query = str(item.get('query', '')).strip()
            href = str(item.get('href', '')).strip()

            if not title:
                raise serializers.ValidationError(f'Le titre de la categorie #{index + 1} est obligatoire.')
            if not image:
                raise serializers.ValidationError(f"L'image de la categorie #{index + 1} est obligatoire.")

            cleaned.append({
                'title': title[:80],
                'image': image[:1000],
                'query': query[:120],
                'href': href[:500],
            })

        return cleaned[:12]
