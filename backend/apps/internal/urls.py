from django.urls import path

from .views import CronRunView

urlpatterns = [
    path('cron/run/', CronRunView.as_view(), name='internal-cron-run'),
]
