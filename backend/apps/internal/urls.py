from django.urls import path

from .views import AdminAlertSummaryView, AdminAuditLogListView, CronRunView

urlpatterns = [
    path('cron/run/', CronRunView.as_view(), name='internal-cron-run'),
    path('admin/alerts/', AdminAlertSummaryView.as_view(), name='admin-alert-summary'),
    path('admin/audit-logs/', AdminAuditLogListView.as_view(), name='admin-audit-log-list'),
]
