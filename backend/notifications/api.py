from ninja_extra import api_controller, route
from ninja import Schema
from django.shortcuts import get_object_or_404
from .models import PushToken
from typing import List
import datetime
from datetime import datetime

class PushTokenSchema(Schema):
    token: str

class NotificationOutSchema(Schema):
    id: int
    title: str
    body: str
    type: str
    status: str
    is_read: bool
    created_at: datetime

@api_controller('/notifications', tags=['Notifications'])
class NotificationController:
    @route.get('/', response=List[NotificationOutSchema])
    def list_notifications(self, request):
        from .models import Notification
        return Notification.objects.filter(user=request.user).order_by('-created_at')

    @route.post('/push-token', response={200: str})
    def register_push_token(self, request, payload: PushTokenSchema):
        token, created = PushToken.objects.get_or_create(
            user=request.user,
            token=payload.token
        )
        return "Token registered"

    @route.post('/{notification_id}/read', response={200: str})
    def mark_as_read(self, request, notification_id: int):
        from .models import Notification
        notification = get_object_or_404(Notification, id=notification_id, user=request.user)
        notification.is_read = True
        notification.save()
        return "Notification marked as read"

    @route.post('/read-all', response={200: str})
    def mark_all_as_read(self, request):
        from .models import Notification
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return "All notifications marked as read"
