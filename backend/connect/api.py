from typing import List, Optional
from ninja import Schema, ModelSchema
from ninja_extra import ControllerBase, api_controller, http_get, http_post
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from users.models import CustomUser as User
from companies.models import Company
from ninja_jwt.authentication import JWTAuth
from datetime import datetime

# Schemas
class UserSchema(Schema):
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar: Optional[str] = None

class MessageSchema(ModelSchema):
    sender: Optional[UserSchema] = None
    
    class Meta:
        model = Message
        fields = ['id', 'content', 'created_at', 'is_system_message', 'attachments']

class ConversationSchema(ModelSchema):
    last_message: Optional[MessageSchema] = None
    participants: List[UserSchema] = []
    unread_count: int = 0
    
    class Meta:
        model = Conversation
        fields = ['id', 'type', 'title', 'description', 'updated_at', 'content_type', 'object_id']
        
    @staticmethod
    def resolve_participants(obj):
        return [p.user for p in obj.participants.all()]
        
    @staticmethod
    def resolve_last_message(obj):
        return obj.messages.order_by('-created_at').first()

class CreateConversationSchema(Schema):
    type: str = 'DIRECT' # DIRECT, GROUP, CHANNEL
    participant_ids: List[int]
    title: Optional[str] = None
    description: Optional[str] = None
    content_type: Optional[str] = None
    object_id: Optional[str] = None

class CreateMessageSchema(Schema):
    content: str
    attachments: List[dict] = []

# Controller
@api_controller('/connect', tags=['Kumba Connect'], auth=JWTAuth())
class ConnectController(ControllerBase):
    
    @http_get('/conversations', response=List[ConversationSchema])
    def list_conversations(self, request):
        user = request.user
        # simple fetch for now, can optimize with prefetch_related later
        return Conversation.objects.filter(participants__user=user).distinct().order_by('-updated_at')

    @http_post('/conversations', response=ConversationSchema)
    def create_conversation(self, request, payload: CreateConversationSchema):
        user = request.user
        company = user.company
        
        # If DIRECT, check if exists
        if payload.type == 'DIRECT' and len(payload.participant_ids) == 1:
            other_user_id = payload.participant_ids[0]
            # Try to find existing direct convo
            existing = Conversation.objects.filter(
                type='DIRECT',
                participants__user=user
            ).filter(
                participants__user_id=other_user_id
            ).first()
            if existing:
                return existing
        
        # Create new
        convo = Conversation.objects.create(
            company=company,
            type=payload.type,
            title=payload.title,
            description=payload.description,
            created_by=user,
            content_type=payload.content_type,
            object_id=payload.object_id
        )
        
        # Add self
        convo.participants.create(user=user, is_admin=True)
        
        # Add others
        for uid in payload.participant_ids:
            if uid != user.id:
                convo.participants.create(user_id=uid)
                
        return convo

    @http_get('/conversations/{convo_id}/messages', response=List[MessageSchema])
    def list_messages(self, request, convo_id: int):
        convo = get_object_or_404(Conversation, id=convo_id, participants__user=request.user)
        return convo.messages.order_by('created_at').select_related('sender')

    @http_post('/conversations/{convo_id}/messages', response=MessageSchema)
    def send_message(self, request, convo_id: int, payload: CreateMessageSchema):
        convo = get_object_or_404(Conversation, id=convo_id, participants__user=request.user)
        
        msg = Message.objects.create(
            conversation=convo,
            sender=request.user,
            content=payload.content,
            attachments=payload.attachments
        )
        
        # Update conversation timestamp
        convo.updated_at = datetime.now()
        convo.save()
        
        # TODO: Trigger WebSocket event here
        
        return msg
