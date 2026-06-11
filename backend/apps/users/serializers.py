from rest_framework import serializers
from .models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = CustomUser
        fields = ['email', 'password', 'first_name', 'last_name', 'phone', 'role']

    def validate_role(self, value):
        if value == CustomUser.Role.ADMIN:
            raise serializers.ValidationError("Impossible de créer un compte admin via l'API.")
        return value

    def create(self, validated_data):
        return CustomUser.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model        = CustomUser
        fields       = ['id', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_verified', 'avatar', 'date_joined']
        read_only_fields = ['id', 'email', 'role', 'is_verified', 'date_joined']


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    uid      = serializers.CharField()
    token    = serializers.CharField()
    password = serializers.CharField(min_length=8)


class VerifyEmailSerializer(serializers.Serializer):
    uid   = serializers.CharField()
    token = serializers.CharField()


class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = CustomUser
        fields = ['id', 'email', 'full_name', 'first_name', 'last_name', 'phone',
                  'role', 'is_verified', 'is_active', 'date_joined']
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email
