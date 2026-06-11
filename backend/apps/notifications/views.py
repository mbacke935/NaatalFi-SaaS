from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        unread = request.query_params.get('unread')
        if unread in ['1', 'true', 'True']:
            notifications = notifications.filter(is_read=False)
        is_read = request.query_params.get('is_read')
        if is_read in ['false', 'False', '0']:
            notifications = notifications.filter(is_read=False)
        elif is_read in ['true', 'True', '1']:
            notifications = notifications.filter(is_read=True)
        return Response(NotificationSerializer(notifications[:100], many=True).data)


class NotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        updated = Notification.objects.filter(
            pk=pk,
            user=request.user,
            is_read=False,
        ).update(is_read=True)
        if not updated and not Notification.objects.filter(pk=pk, user=request.user).exists():
            return Response({'error': 'Notification introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        notification = Notification.objects.get(pk=pk, user=request.user)
        return Response(NotificationSerializer(notification).data)


class NotificationReadAllView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'updated': count})
