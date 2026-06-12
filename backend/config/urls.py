from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/',       include('apps.users.urls')),
    path('api/v1/vendors/',    include('apps.vendors.urls')),
    path('api/v1/categories/', include('apps.categories.urls')),
    path('api/v1/products/',     include('apps.products.urls')),
    path('api/v1/marketplace/',  include('apps.marketplace.urls')),
    path('api/v1/orders/',       include('apps.orders.urls')),
    path('api/v1/account/',      include('apps.account.urls')),
    path('api/v1/payments/',     include('apps.payments.urls')),
    path('api/v1/wallet/',       include('apps.wallet.urls')),
    path('api/v1/shipping/',     include('apps.shipping.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/reviews/',      include('apps.reviews.urls')),
    path('api/v1/ads/',          include('apps.ads.urls')),
    path('api/v1/disputes/',     include('apps.disputes.urls')),
    path('api/v1/analytics/',    include('apps.analytics.urls')),
]
