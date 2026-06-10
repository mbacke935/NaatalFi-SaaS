from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include([
        # Les routes API seront enregistrées ici au fur et à mesure
    ])),
]
