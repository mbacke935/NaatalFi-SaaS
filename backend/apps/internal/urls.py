from django.urls import path

from .views import AdminAuditLogListView, CronRunView

urlpatterns = [
    path('cron/run/', CronRunView.as_view(), name='internal-cron-run'),
    path('admin/audit-logs/', AdminAuditLogListView.as_view(), name='admin-audit-log-list'),
]
