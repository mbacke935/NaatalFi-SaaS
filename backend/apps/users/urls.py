from django.urls import path
from .views import (
    RegisterView, VerifyEmailView, LoginView, LogoutView, CookieTokenRefreshView,
    ForgotPasswordView, ResetPasswordView, MeView,
    AdminUserListView, AdminUserDetailView,
)

urlpatterns = [
    path('register/',        RegisterView.as_view(),       name='auth-register'),
    path('verify-email/',    VerifyEmailView.as_view(),    name='auth-verify-email'),
    path('login/',           LoginView.as_view(),          name='auth-login'),
    path('logout/',          LogoutView.as_view(),         name='auth-logout'),
    path('token/refresh/',   CookieTokenRefreshView.as_view(), name='auth-token-refresh'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('reset-password/',  ResetPasswordView.as_view(),  name='auth-reset-password'),
    path('me/',              MeView.as_view(),             name='auth-me'),
    path('admin/users/',     AdminUserListView.as_view(),  name='admin-user-list'),
    path('admin/users/<uuid:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
]
