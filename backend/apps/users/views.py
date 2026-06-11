from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.conf import settings

from .models import CustomUser
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer, VerifyEmailSerializer,
)
from .tokens import email_verification_token, password_reset_token
from tasks.emails import send_verification_email, send_password_reset_email


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        uid   = urlsafe_base64_encode(force_bytes(user.pk))
        token = email_verification_token.make_token(user)
        url   = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}"

        send_verification_email.delay(str(user.id), url)

        return Response(
            {"message": "Compte créé. Vérifiez votre email pour activer votre compte."},
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_id = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user    = CustomUser.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            return Response({"error": "Lien invalide."}, status=status.HTTP_400_BAD_REQUEST)

        if not email_verification_token.check_token(user, serializer.validated_data['token']):
            return Response({"error": "Lien expiré ou invalide."}, status=status.HTTP_400_BAD_REQUEST)

        if user.is_verified:
            return Response({"message": "Email déjà vérifié."})

        user.is_verified = True
        user.save(update_fields=['is_verified'])

        return Response({"message": "Email vérifié avec succès. Vous pouvez vous connecter."})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            username=serializer.validated_data['email'],
            password=serializer.validated_data['password'],
        )

        if not user:
            return Response(
                {"error": "Email ou mot de passe incorrect."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_verified:
            return Response(
                {"error": "Veuillez vérifier votre email avant de vous connecter."},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            "access":  str(refresh.access_token),
            "refresh": str(refresh),
            "user":    UserSerializer(user).data,
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            RefreshToken(request.data.get('refresh')).blacklist()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TokenError:
            return Response({"error": "Token invalide."}, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user  = CustomUser.objects.get(email=serializer.validated_data['email'])
            uid   = urlsafe_base64_encode(force_bytes(user.pk))
            token = password_reset_token.make_token(user)
            url   = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            send_password_reset_email.delay(str(user.id), url)
        except CustomUser.DoesNotExist:
            pass  # Ne pas révéler si l'email existe ou non

        return Response({"message": "Si cet email est enregistré, un lien de réinitialisation a été envoyé."})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_id = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user    = CustomUser.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            return Response({"error": "Lien invalide."}, status=status.HTTP_400_BAD_REQUEST)

        if not password_reset_token.check_token(user, serializer.validated_data['token']):
            return Response({"error": "Lien expiré ou invalide."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['password'])
        user.save(update_fields=['password'])

        return Response({"message": "Mot de passe modifié avec succès."})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
