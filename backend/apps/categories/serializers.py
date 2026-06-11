from rest_framework import serializers
from .models import Category


class CategoryChildSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ['id', 'name', 'slug', 'image', 'order', 'is_active']


class CategoryTreeSerializer(serializers.ModelSerializer):
    children = CategoryChildSerializer(many=True, read_only=True)

    class Meta:
        model  = Category
        fields = ['id', 'name', 'slug', 'image', 'order', 'is_active', 'children']


class CategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ['name', 'parent', 'image', 'order', 'is_active']

    def validate_parent(self, value):
        if value and value.parent_id:
            raise serializers.ValidationError("Un enfant ne peut pas être le parent d'une autre catégorie.")
        return value


class ReorderSerializer(serializers.Serializer):
    id    = serializers.IntegerField()
    order = serializers.IntegerField(min_value=0)
