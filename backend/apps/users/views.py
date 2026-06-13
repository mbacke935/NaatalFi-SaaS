from django.conf import settings
from django.contrib.auth import authenticate
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from apps.internal.audit import log_admin_action
from apps.internal.models import AdminAuditLog
from .models import CustomUser
from .serializers import (
    ForgotPasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserSerializer,
    VerifyEmailSerializer,
)
from .tokens import email_verification_token, password_reset_token
from tasks.emails import send_password_reset_email, send_verification_email


def _refresh_cookie_name():
    return settings.JWT_REFRESH_COOKIE_NAME


def _refresh_cookie_max_age():
    return int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())


def _set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        settings.JWT_REFRESH_COOKIE_NAME,
        refresh_token,
        max_age=_refresh_cookie_max_age(),
        path=settings.JWT_REFRESH_COOKIE_PATH,
        secure=settings.JWT_REFRESH_COOKIE_SECURE,
        httponly=True,
        samesite=settings.JWT_REFRESH_COOKIE_SAMESITE,
    )


def _clear_refresh_cookie(response):
    response.delete_cookie(
        settings.JWT_REFRESH_COOKIE_NAME,
        path=settings.JWT_REFRESH_COOKIE_PATH,
        samesite=settings.JWT_REFRESH_COOKIE_SAMESITE,
    )


def _get_refresh_token(request):
    return request.data.get('refresh') or request.COOKIES.get(_refresh_cookie_name())


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'register'

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = email_verification_token.make_token(user)
        url = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}"

        email_sent = True
        try:
            send_verification_email(str(user.id), url)
        except Exception:
            email_sent = False

        payload = {"message": "Compte créé. Vérifiez votre email pour activer votre compte."}
        if not email_sent:
            payload["warning"] = (
                "Compte créé, mais l'email de vérification n'a pas pu être envoyé. "
                "Vérifiez la configuration SMTP."
            )
        return Response(payload, status=status.HTTP_201_CREATED)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_id = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = CustomUser.objects.get(pk=user_id)
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
    throttle_scope = 'login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        user = authenticate(
            request,
            username=email,
            password=password,
        )

        if not user:
            existing_user = CustomUser.objects.filter(email__iexact=email).first()
            if existing_user and existing_user.check_password(password) and not existing_user.is_active:
                return Response(
                    {"error": "Ce compte est desactive. Contactez un administrateur."},
                    status=status.HTTP_403_FORBIDDEN,
                )
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

        response = Response({
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
        })
        _set_refresh_cookie(response, str(refresh))
        return response


class CookieTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = _get_refresh_token(request)
        if not refresh_token:
            return Response(
                {"detail": "Refresh token manquant."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
        serializer.is_valid(raise_exception=True)

        response = Response({"access": serializer.validated_data["access"]})
        rotated_refresh = serializer.validated_data.get("refresh")
        if rotated_refresh:
            _set_refresh_cookie(response, rotated_refresh)
        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = _get_refresh_token(request)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        if not refresh_token:
            _clear_refresh_cookie(response)
            return response

        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            pass

        _clear_refresh_cookie(response)
        return response


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'password_reset'

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = CustomUser.objects.get(email=serializer.validated_data['email'])
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = password_reset_token.make_token(user)
            url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            send_password_reset_email(str(user.id), url)
        except CustomUser.DoesNotExist:
            pass

        return Response({"message": "Si cet email est enregistré, un lien de réinitialisation a été envoyé."})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'password_reset'

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_id = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = CustomUser.objects.get(pk=user_id)
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


# ── Admin ──────────────────────────────────────────────────────────────

class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == CustomUser.Role.ADMIN


class AdminUserListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from .serializers import AdminUserSerializer
        qs = CustomUser.objects.order_by('-date_joined')
        if role := request.query_params.get('role'):
            qs = qs.filter(role=role.upper())
        return Response(AdminUserSerializer(qs, many=True).data)


class AdminUserDetailView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        from .serializers import AdminUserSerializer
        try:
            user = CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable.'}, status=404)

        if user.pk == request.user.pk and request.data.get('is_active') is False:
            return Response({'error': 'Impossible de desactiver votre propre compte.'}, status=400)

        update_fields = []
        if 'role' in request.data:
            role = str(request.data['role']).upper()
            if role not in CustomUser.Role.values:
                return Response({'error': 'Role invalide.'}, status=400)
            user.role = role
            update_fields.append('role')
        if 'is_active' in request.data:
            user.is_active = bool(request.data['is_active'])
            update_fields.append('is_active')
        if 'is_verified' in request.data:
            user.is_verified = bool(request.data['is_verified'])
            update_fields.append('is_verified')
        if update_fields:
            update_fields.append('updated_at')
            user.save(update_fields=update_fields)
            log_admin_action(
                request,
                AdminAuditLog.Action.USER_UPDATED,
                target=user,
                target_repr=user.email,
                metadata={'changed_fields': sorted(set(update_fields) - {'updated_at'})},
            )
        return Response(AdminUserSerializer(user).data)

    def delete(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable.'}, status=404)

        if user.pk == request.user.pk:
            return Response({'error': 'Impossible de supprimer votre propre compte.'}, status=400)

        if user.role == CustomUser.Role.ADMIN:
            return Response(
                {'error': 'Impossible de supprimer un compte administrateur. Retirez-lui d\'abord le role admin.'},
                status=400,
            )

        target_email = user.email
        target_role = user.role
        target_id = str(user.pk)
        log_admin_action(
            request,
            AdminAuditLog.Action.USER_DELETED,
            target=user,
            target_repr=target_email,
            metadata={'email': target_email, 'role': target_role, 'user_id': target_id},
        )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
