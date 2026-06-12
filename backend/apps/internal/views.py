from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import run_scheduled_tasks


class CronRunView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        expected = getattr(settings, 'CRON_SECRET', '')
        provided = request.headers.get('X-CRON-SECRET', '')

        if not expected or provided != expected:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        result = run_scheduled_tasks()
        return Response(result)
