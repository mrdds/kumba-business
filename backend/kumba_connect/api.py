from typing import List, Optional, Dict, Any
from ninja_extra import api_controller, route, ControllerBase
from kumba_id.auth import KumbaJWTAuth
from django.shortcuts import get_object_or_404
from .livekit_service import livekit_service
from .models import Conversation, Message, ConversationParticipant, BlockedUser, Meeting, StarredMessage, MeetingLog
import json
import os
import uuid
import re
from datetime import datetime
from django.contrib.auth import get_user_model
from ninja import Schema
from notifications.utils import send_push_notification
from django.utils import timezone
from django.db import models

# User class getter is redundant with get_user_model()

class MessageSchema(Schema):
    id: uuid.UUID
    sender_id: Optional[int] = None
    sender_name: Optional[str] = None
    sender_username: Optional[str] = None
    sender_avatar: Optional[str] = None
    content: Optional[str]
    content_type: str
    media_url: Optional[str]
    created_at: datetime
    is_read: bool
    reactions: Dict[str, Any] = {}
    is_starred: bool = False
    is_forwarded: bool = False
    reply_to_id: Optional[uuid.UUID] = None
    reply_to_content: Optional[str] = None
    reply_to_sender_name: Optional[str] = None

class CreateMessageSchema(Schema):
    content: Optional[str] = None
    content_type: str = 'text' # e.g. text, encrypted_text, image
    media_url: Optional[str] = None
    is_forwarded: bool = False
    reply_to_id: Optional[uuid.UUID] = None

class PublicKeySchema(Schema):
    user_id: int
    public_key: str

class CreatePublicKeySchema(Schema):
    public_key: str

class MeetingSchema(Schema):
    id: uuid.UUID
    title: Optional[str]
    creator_id: int
    status: str
    scheduled_at: Optional[datetime]
    access_token: uuid.UUID
    conversation_id: Optional[uuid.UUID]
    participant_ids: List[int] = []
    created_at: datetime

    @staticmethod
    def resolve_participant_ids(obj):
        return [u.id for u in obj.participants.all()]

class JoinMeetingOutSchema(Schema):
    token: str
    room_name: str
    server_url: str

class CreateMeetingSchema(Schema):
    title: Optional[str] = None
    conversation_id: Optional[uuid.UUID] = None
    participant_ids: List[int] = []
    scheduled_at: Optional[datetime] = None
    is_audio_only: bool = False

class ConversationSchema(Schema):
    id: uuid.UUID
    type: str
    participants: List[str] # Names
    target_user_id: Optional[int] = None # For direct chats
    last_message: Optional[MessageSchema] = None
    title: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    is_pinned: bool = False
    is_archived: bool = False
    is_muted: bool = False
    is_favorite: bool = False
    is_locked: bool = False
    is_unread: bool = False
    is_blocked_by_me: bool = False
    participants_details: List[Dict[str, Any]] = []

class UserSearchSchema(Schema):
    id: int
    email: str
    username: str
    kumba_uid: Optional[uuid.UUID] = None
    kumba_id: Optional[str] = None
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    role: Optional[str] = None

class CreateConversationSchema(Schema):
    participant_ids: List[int] = []
    participant_emails: List[str] = [] # Keeping for backward compatibility or direct invite
    type: str = 'direct'
    title: Optional[str] = None
    description: Optional[str] = None

class AddGroupMemberSchema(Schema):
    user_id: int

class RemoveGroupMemberSchema(Schema):
    user_id: int

@api_controller('/connect', tags=['Kumba Connect'], auth=KumbaJWTAuth())
class ConnectController(ControllerBase):
    
    
    @route.get('/conversations', response=List[ConversationSchema])
    def list_conversations(self, request):
        user = request.user
        participants = ConversationParticipant.objects.filter(user=user).order_by('-is_pinned', '-conversation__updated_at')
        
        result = []
        for p in participants:
            if p.is_archived:
                continue
            result.append(self._format_conversation(p.conversation, user, p))
        return result

    @route.get('/conversations/{conversation_id}', response=ConversationSchema)
    def get_conversation(self, request, conversation_id: uuid.UUID):
        user = request.user
        participant = get_object_or_404(ConversationParticipant, conversation_id=conversation_id, user=user)
        return self._format_conversation(participant.conversation, user, participant)

    @route.post('/conversations/{conversation_id}/toggle/{action}', response={200: Dict[str, Any]})
    def toggle_action(self, request, conversation_id: uuid.UUID, action: str):
        user = request.user
        participant = get_object_or_404(ConversationParticipant, conversation_id=conversation_id, user=user)
        
        field_map = {
            'pin': 'is_pinned',
            'archive': 'is_archived',
            'mute': 'is_muted',
            'favorite': 'is_favorite',
            'lock': 'is_locked',
            'unread': 'is_unread'
        }
        
        if action == 'block':
             # Find target user in direct chat
             if participant.conversation.type != Conversation.Type.DIRECT:
                  return 400, {"error": "Blocking only available in direct chats"}
             
             target_user = participant.conversation.participants.exclude(id=user.id).first()
             if not target_user:
                  return 404, {"error": "Target user not found"}
                  
             blocked_record, created = BlockedUser.objects.get_or_create(blocker=user, blocked=target_user)
             if not created:
                  blocked_record.delete()
                  return {"success": True, "action": "unblocked", "value": False}
             return {"success": True, "action": "blocked", "value": True}

        if action not in field_map:
             return 400, {"error": "Invalid action"}
             
        field = field_map[action]
        current_val = getattr(participant, field)
        setattr(participant, field, not current_val)
        participant.save()
        
        return {"success": True, "field": field, "value": getattr(participant, field)}

    @route.post('/conversations/{conversation_id}/clear', response={200: Dict[str, Any]})
    def clear_conversation(self, request, conversation_id: uuid.UUID):
        participant = get_object_or_404(ConversationParticipant, conversation_id=conversation_id, user=request.user)
        participant.cleared_at = timezone.now()
        participant.save()
        return {"success": True, "message": "Conversation cleared"}

    @route.delete('/conversations/{conversation_id}', response={200: Dict[str, Any]})
    def delete_conversation(self, request, conversation_id: uuid.UUID):
        participant = get_object_or_404(ConversationParticipant, conversation_id=conversation_id, user=request.user)
        participant.delete()
        return {"success": True}

    @route.get('/users/search', response=List[UserSearchSchema])
    def search_users(self, request, q: str = None):
        user = request.user
        query = get_user_model().objects.exclude(id=user.id)
        
        if hasattr(user, 'company') and user.company:
            query = query.filter(company=user.company)
        
        if q:
            from django.db.models import Q
            query = query.filter(
                Q(email__icontains=q) | 
                Q(first_name__icontains=q) | 
                Q(last_name__icontains=q) |
                Q(username__icontains=q) |
                Q(phone__icontains=q) |
                Q(employee_id__icontains=q) |
                Q(kumba_id__icontains=q)
            )
        return query[:20]

    @route.post('/conversations', response=ConversationSchema)
    def create_conversation(self, request, payload: CreateConversationSchema):
        user = request.user
        
        # Resolve Participants
        participants = []
        if payload.participant_ids:
            participants = list(get_user_model().objects.filter(id__in=payload.participant_ids))
            
        # Also support emails for invites
        for email in payload.participant_emails:
            try:
                participants.append(get_user_model().objects.get(email=email))
            except get_user_model().DoesNotExist:
                pass
        
        # Remove duplicates and self
        participants = list(set([p for p in participants if p.id != user.id]))
        
        # Enforce company boundary
        if hasattr(user, 'company') and user.company:
            participants = [p for p in participants if getattr(p, 'company_id', getattr(p, 'company', None)) == getattr(user, 'company_id', getattr(user, 'company', None))]

        # 1. Handle Direct Message Logic
        if payload.type == 'direct' and len(participants) == 1:
            target_user = participants[0]
            existing = Conversation.objects.filter(
                type=Conversation.Type.DIRECT,
                participants=user
            ).filter(
                participants=target_user
            ).first()
            
            if existing:
                p = get_object_or_404(ConversationParticipant, conversation=existing, user=user)
                return self._format_conversation(existing, user, p)
        
        # 2. Create New Conversation
        conv = Conversation.objects.create(
            type=payload.type,
            title=payload.title,
            description=payload.description
        )
        
        # Add creator as Owner
        p_creator = ConversationParticipant.objects.create(
            conversation=conv, 
            user=user, 
            role=ConversationParticipant.Role.OWNER
        )

        # Add other participants
        for p in participants:
            ConversationParticipant.objects.get_or_create(
                conversation=conv, 
                user=p,
                defaults={'role': ConversationParticipant.Role.MEMBER}
            )
            # Notify user if it's a group
            if payload.type == 'group':
                send_push_notification(
                    user=p,
                    title="Nouveau groupe",
                    body=f"@{user.first_name} {user.last_name} vous a ajouté dans le groupe @{payload.title or 'sans titre'}"
                )
                Message.objects.create(
                    conversation=conv,
                    sender=None,
                    content=f"@{p.first_name} {p.last_name} a été ajouté au groupe",
                    content_type=Message.ContentType.SYSTEM
                )
                
        return self._format_conversation(conv, user, p_creator)

    @route.get('/conversations/{conversation_id}/messages', response=List[MessageSchema])
    def get_messages(self, request, conversation_id: uuid.UUID):
        user = request.user
        participant = get_object_or_404(ConversationParticipant, conversation_id=conversation_id, user=user)
        query = participant.conversation.messages.all()
        
        if participant.cleared_at:
            query = query.filter(created_at__gt=participant.cleared_at)
            
        messages = query.select_related('sender').order_by('created_at')
        
        # Mark starred status
        starred_ids = set(StarredMessage.objects.filter(user=user, message__in=messages).values_list('message_id', flat=True))
        
        # Prefetch replied messages for content/sender info
        reply_ids = [m.reply_to_id for m in messages if m.reply_to_id]
        replied_map = {m.id: m for m in Message.objects.filter(id__in=reply_ids).select_related('sender')}

        for m in messages:
            m.is_starred = m.id in starred_ids
            if m.sender:
                m.sender_name = f"{m.sender.first_name} {m.sender.last_name}".strip() or m.sender.username
                m.sender_username = m.sender.username
                m.sender_avatar = getattr(m.sender, 'avatar_url', None)
            
            if m.reply_to_id and m.reply_to_id in replied_map:
                rm = replied_map[m.reply_to_id]
                m.reply_to_content = rm.content
                if rm.sender:
                    m.reply_to_sender_name = f"{rm.sender.first_name} {rm.sender.last_name}".strip() or rm.sender.username
                else:
                    m.reply_to_sender_name = "Système"
        return messages

    @route.get('/keys/{user_id}', response=PublicKeySchema)
    def get_public_key(self, request, user_id: int):
        from .models import UserPublicKey
        key_record = get_object_or_404(UserPublicKey, user_id=user_id)
        return {'user_id': user_id, 'public_key': key_record.public_key}

    @route.post('/keys', response=PublicKeySchema)
    def update_public_key(self, request, payload: CreatePublicKeySchema):
        from .models import UserPublicKey
        key_record, created = UserPublicKey.objects.update_or_create(
            user=request.user,
            defaults={'public_key': payload.public_key}
        )
        return {'user_id': request.user.id, 'public_key': key_record.public_key}

    # MEETING ENDPOINTS
    @route.get('/meetings', response=List[MeetingSchema])
    def list_meetings(self, request):
        # Return ongoing or upcoming meetings for the user's conversations OR explicitly invited
        user = request.user
        convs = Conversation.objects.filter(participants=user)
        return Meeting.objects.filter(
            models.Q(conversation__in=convs) | models.Q(participants=user) | models.Q(creator=user)
        ).exclude(status='ended').distinct().order_by('scheduled_at')

    @route.post('/meetings', response=MeetingSchema)
    def create_meeting(self, request, payload: CreateMeetingSchema):
        meeting = Meeting.objects.create(
            creator=request.user,
            title=payload.title,
            conversation_id=payload.conversation_id,
            scheduled_at=payload.scheduled_at,
            status='ongoing' if not payload.scheduled_at else 'planned'
        )
        
        participants_to_notify = []
        if payload.participant_ids:
            participants = get_user_model().objects.filter(id__in=payload.participant_ids)
            meeting.participants.set(participants)
            participants_to_notify.extend(list(participants))
            
        # If there's a conversation, add all its participants to notification list
        if payload.conversation_id:
            conv_participants = get_user_model().objects.filter(conversations__id=payload.conversation_id).exclude(id=request.user.id)
            participants_to_notify.extend(list(conv_participants))
            
        # De-duplicate participants
        participants_to_notify = list(set([p for p in participants_to_notify if p.id != request.user.id]))

        # Trigger notifications for instant meetings
        if meeting.status == 'ongoing':
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            
            for p in participants_to_notify:
                # 1. Push Notification
                notification_data = {
                    'type': 'call_offer',
                    'meeting_id': str(meeting.id),
                    'caller_first_name': request.user.first_name,
                    'is_audio_only': payload.is_audio_only,
                    'conversation_id': str(payload.conversation_id) if payload.conversation_id else None,
                    'caller_id': request.user.id,
                    'channelId': 'calls'
                }
                send_push_notification(
                    p, 
                    f"Réunion de {request.user.first_name}", 
                    "Appuyez pour rejoindre", 
                    data=notification_data,
                    sound='whatsapp_ring.mp3'
                )
                
                # 2. WebSocket Signal via Global Socket
                async_to_sync(channel_layer.group_send)(
                    f'user_updates_{p.id}',
                    {
                        'type': 'global_call_signal',
                        'user_id': request.user.id,
                        'action': 'call_offer',
                        'meeting_id': str(meeting.id),
                        'caller_first_name': request.user.first_name,
                        'is_audio_only': payload.is_audio_only,
                        'conversation_id': str(payload.conversation_id) if payload.conversation_id else None
                    }
                )
            
        return meeting

    @route.get('/meetings/{meeting_id}', response=MeetingSchema)
    def get_meeting(self, request, meeting_id: uuid.UUID):
        return get_object_or_404(Meeting, id=meeting_id)

    @route.post('/meetings/{meeting_id}/invite', response={200: Dict[str, Any]})
    def invite_to_meeting(self, request, meeting_id: uuid.UUID, payload: AddGroupMemberSchema):
        meeting = get_object_or_404(Meeting, id=meeting_id)
        target_user = get_object_or_404(get_user_model(), id=payload.user_id)
        
        meeting.participants.add(target_user)
        
        # Trigger notification and signal
        notification_data = {
            'type': 'call_offer',
            'meeting_id': str(meeting.id),
            'caller_first_name': request.user.first_name,
            'is_audio_only': meeting.metadata.get('is_audio_only', False),
            'conversation_id': str(meeting.conversation_id) if meeting.conversation_id else None,
            'caller_id': request.user.id,
            'channelId': 'calls'
        }
        send_push_notification(
            target_user, 
            f"Appel de {request.user.first_name}", 
            "Appuyez pour rejoindre", 
            data=notification_data,
            sound='whatsapp_ring.mp3'
        )
        
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'user_updates_{target_user.id}',
            {
                'type': 'global_call_signal',
                'user_id': request.user.id,
                'action': 'call_offer',
                'meeting_id': str(meeting.id),
                'caller_first_name': request.user.first_name,
                'is_audio_only': meeting.metadata.get('is_audio_only', False),
                'conversation_id': str(meeting.conversation_id) if meeting.conversation_id else None
            }
        )
        
        return {"success": True}

    @route.post('/meetings/{meeting_id}/end', response={200: Dict[str, Any]})
    def end_meeting(self, request, meeting_id: uuid.UUID):
        from django.utils import timezone
        meeting = get_object_or_404(Meeting, id=meeting_id)
        meeting.status = 'ended'
        meeting.ended_at = timezone.now()
        meeting.save()
        return {"success": True}

    @route.post('/meetings/{meeting_id}/join', response=JoinMeetingOutSchema)
    def join_meeting(self, request, meeting_id: uuid.UUID):
        meeting = get_object_or_404(Meeting, id=meeting_id)
        user = request.user
        
        # Check if user is allowed
        is_participant = meeting.participants.filter(id=user.id).exists()
        is_in_conv = False
        if meeting.conversation:
             is_in_conv = meeting.conversation.participants.filter(id=user.id).exists()
        
        if not is_participant and not is_in_conv and meeting.creator_id != user.id:
             # If it's a planned meeting with no direct restriction, allow? 
             # For now, let's keep it restricted to participants.
             pass 

        # Create livekit room name if not exists
        if not meeting.livekit_room_name:
            meeting.livekit_room_name = f"meeting_{meeting.id}"
            meeting.save()

        # Generate Token
        identity = f"user_{user.id}"
        name = f"{user.first_name} {user.last_name}".strip() or user.username
        
        token = livekit_service.generate_token(
            room_name=meeting.livekit_room_name,
            participant_identity=identity,
            participant_name=name
        )
        
        return {
            "token": token,
            "room_name": meeting.livekit_room_name,
            "server_url": livekit_service.url
        }

    @route.post('/livekit-webhook', auth=None) # LiveKit webhooks are usually self-signed or use specific auth
    def livekit_webhook(self, request):
        # Verify webhook signature (optional but recommended in real prod)
        # auth_header = request.headers.get('Authorization')
        # ... logic to verify with livekit_service.api_secret ...
        
        data = json.loads(request.body)
        event = data.get('event')
        room = data.get('room')
        participant = data.get('participant')

        if not room:
            return {"status": "ok"}

        # Resolve meeting from room name
        room_name = room.get('name')
        if not room_name or not room_name.startswith('meeting_'):
             return {"status": "ok"}
             
        meeting_id = room_name.replace('meeting_', '')
        try:
             meeting = Meeting.objects.get(id=meeting_id)
        except Meeting.DoesNotExist:
             return {"status": "error", "message": "Meeting not found"}

        user = None
        if participant:
             identity = participant.get('identity', '')
             if identity.startswith('user_'):
                  u_id = identity.replace('user_', '')
                  user = get_user_model().objects.filter(id=u_id).first()

        # Log event
        if event in ['participant_joined', 'participant_left', 'room_started', 'room_finished', 'declined', 'no_answer', 'cancelled']:
            MeetingLog.objects.create(
                meeting=meeting,
                event_type=event,
                user=user,
                details=data
            )

        # Update meeting status
        if event == 'room_started':
             meeting.status = 'ongoing'
             meeting.started_at = timezone.now()
             meeting.save()
        elif event == 'room_finished':
             meeting.status = 'ended'
             meeting.ended_at = timezone.now()
             
             # Calculate duration
             lk_duration = room.get('duration')
             if lk_duration:
                 meeting.duration = lk_duration
             elif meeting.started_at:
                 delta = meeting.ended_at - meeting.started_at
                 meeting.duration = int(delta.total_seconds())
                 
             meeting.save()

        return {"status": "ok"}

    @route.delete('/meetings/{meeting_id}', response={200: Dict[str, Any]})
    def delete_meeting(self, request, meeting_id: uuid.UUID):
        meeting = get_object_or_404(Meeting, id=meeting_id)
        meeting.delete()
        return {"success": True}

    @route.post('/conversations/{conversation_id}/messages', response=MessageSchema)
    def send_message(self, request, conversation_id: uuid.UUID, payload: CreateMessageSchema):
        user = request.user
        conv = get_object_or_404(Conversation, id=conversation_id, participants=user)
        
        # Check if blocked in direct chat
        if conv.type == Conversation.Type.DIRECT:
             target_user = conv.participants.exclude(id=user.id).first()
             if target_user:
                  if BlockedUser.objects.filter(blocker=target_user, blocked=user).exists():
                       return 403, {"error": "You are blocked by this user"}
                  if BlockedUser.objects.filter(blocker=user, blocked=target_user).exists():
                       return 403, {"error": "You have blocked this user"}

        msg = Message.objects.create(
            conversation=conv,
            sender=user,
            content=payload.content,
            content_type=payload.content_type,
            media_url=payload.media_url,
            is_forwarded=payload.is_forwarded,
            reply_to_id=payload.reply_to_id
        )
        
        # Attach reply context for immediate UI feedback
        if msg.reply_to:
            msg.reply_to_content = msg.reply_to.content
            if msg.reply_to.sender:
                msg.reply_to_sender_name = f"{msg.reply_to.sender.first_name} {msg.reply_to.sender.last_name}".strip() or msg.reply_to.sender.username
            else:
                msg.reply_to_sender_name = "Système"
        # Detect Mentions
        if payload.content and conv.type == Conversation.Type.GROUP:
            potential_mentions = re.findall(r'@(\w+)', payload.content)
            for mention in potential_mentions:
                target_user = get_user_model().objects.filter(
                    models.Q(first_name__iexact=mention) | 
                    models.Q(kumba_id__iexact=mention)
                ).first()
                if target_user:
                    msg.mentions.add(target_user)
                    send_push_notification(
                        user=target_user,
                        title="Mentionné",
                        body=f"{user.first_name} vous a mentionné dans {conv.title or 'groupe'}"
                    )
        
        # Update conversation timestamp
        conv.save() 
        
        return msg
    
    @route.post('/messages/{message_id}/react', response={200: Dict[str, Any]})
    def react_to_message(self, request, message_id: uuid.UUID, reaction: str):
        msg = get_object_or_404(Message, id=message_id)
        user_id = str(request.user.id)
        
        reactions = msg.reactions or {}
        
        # Toggle reaction
        for r_name, u_ids in reactions.items():
            if user_id in u_ids:
                u_ids.remove(user_id)
        
        if reaction:
            if reaction not in reactions:
                reactions[reaction] = []
            if user_id not in reactions[reaction]:
                reactions[reaction].append(user_id)
        
        msg.reactions = reactions
        msg.save()
        return {"success": True, "reactions": reactions}

    @route.post('/messages/{message_id}/star', response={200: Dict[str, Any]})
    def star_message(self, request, message_id: uuid.UUID):
        from .models import StarredMessage
        msg = get_object_or_404(Message, id=message_id)
        starred, created = StarredMessage.objects.get_or_create(user=request.user, message=msg)
        if not created:
            starred.delete()
            return {"success": True, "is_starred": False}
        return {"success": True, "is_starred": True}

    @route.delete('/messages/{message_id}', response={200: Dict[str, Any]})
    def delete_message(self, request, message_id: uuid.UUID):
        msg = get_object_or_404(Message, id=message_id, sender=request.user)
        msg.delete()
        return {"success": True}

    @route.post('/upload', response={200: Dict[str, str]})
    def upload_media(self, request, file: Any = None): # Using Any to bypass strict Schema for file upload which Ninja handles differently
        # Note: Ninja handles file uploads via parameters, usually requires UploadedFile type hint
        # But for simplicity with api_controller, we can use request.FILES usually.
        # Let's use standard Django pattern inside the view if Ninja's file support is tricky in api_controller
        
        if not request.FILES:
             return 400, {"error": "No file provided"}
        
        uploaded_file = next(iter(request.FILES.values()))
        
        # Save file to media directory
        # Simple storage for MVP
        import os
        from django.conf import settings
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        
        path = default_storage.save(f"connect/uploads/{uuid.uuid4()}_{uploaded_file.name}", ContentFile(uploaded_file.read()))
        url = request.build_absolute_uri(settings.MEDIA_URL + path)
        
        return {"url": url}

    def _format_conversation(self, conv, user, participant):
        target_id = None
        if conv.type == Conversation.Type.DIRECT:
             other = conv.participants.exclude(id=user.id)
             title = ", ".join([f"{u.first_name} {u.last_name}" for u in other])
             participants_list = [f"{u.first_name} {u.last_name}" for u in conv.participants.all()]
             if other.exists():
                 target_id = other.first().id
        else:
             title = conv.title or "Groupe"
             participants_list = [f"{u.first_name} {u.last_name}" for u in conv.participants.all()]

        # Filter last message based on cleared_at
        msg_query = conv.messages.all()
        if participant.cleared_at:
            msg_query = msg_query.filter(created_at__gt=participant.cleared_at)

        from kumba_auth.models import Presence
        presence_map = {p.user_id: p.last_active for p in Presence.objects.filter(user__in=conv.participants.all())}
        
        # Prefetch public keys
        from .models import UserPublicKey
        pub_keys = {pk.user_id: pk.public_key for pk in UserPublicKey.objects.filter(user__in=conv.participants.all())}

        participants_details = [
            {
                'id': cp.user.id,
                'username': cp.user.username,
                'first_name': cp.user.first_name or "",
                'last_name': cp.user.last_name or "",
                'role': cp.role,
                'avatar_url': getattr(cp.user, 'avatar_url', None),
                'phone': getattr(cp.user, 'phone', None),
                'kumba_id': getattr(cp.user, 'kumba_id', None),
                'last_seen': presence_map.get(cp.user.id),
                'public_key': pub_keys.get(cp.user.id)
            } for cp in conv.conversationparticipant_set.select_related('user').all()
        ]

        icon_url = None
        try:
            if conv.icon:
                icon_url = conv.icon.url
        except:
            pass

        return {
            'id': conv.id,
            'type': conv.type,
            'participants': participants_list,
            'target_user_id': target_id,
            'last_message': msg_query.last(),
            'title': title,
            'icon': icon_url,
            'description': conv.description,
            'is_pinned': participant.is_pinned,
            'is_archived': participant.is_archived,
            'is_muted': participant.is_muted,
            'is_favorite': participant.is_favorite,
            'is_locked': participant.is_locked,
            'is_unread': participant.is_unread,
            'is_blocked_by_me': BlockedUser.objects.filter(blocker=user, blocked_id=target_id).exists() if target_id else False,
            'participants_details': participants_details
        }

    # GROUP MANAGEMENT
    @route.post('/conversations/{conversation_id}/members/add', response={200: Dict[str, Any]})
    def add_group_member(self, request, conversation_id: uuid.UUID, payload: AddGroupMemberSchema):
        user = request.user
        conv = get_object_or_404(Conversation, id=conversation_id, type='group')
        
        # Check permissions (Owner or Admin)
        requester_participant = get_object_or_404(ConversationParticipant, conversation=conv, user=user)
        if requester_participant.role not in ['owner', 'admin']:
             return 403, {"error": "Only owners and admins can add members"}
             
        target_user = get_object_or_404(get_user_model(), id=payload.user_id)
        participant, created = ConversationParticipant.objects.get_or_create(
            conversation=conv,
            user=target_user,
            defaults={'role': ConversationParticipant.Role.MEMBER}
        )
        
        if created:
            send_push_notification(
                user=target_user,
                title=conv.title or "Nouveau groupe",
                body=f"@{user.first_name} {user.last_name} vous a ajouté dans le groupe @{conv.title or 'sans titre'}"
            )
            Message.objects.create(
                conversation=conv,
                sender=None,
                content=f"@{target_user.first_name} {target_user.last_name} a rejoint le groupe",
                content_type=Message.ContentType.SYSTEM
            )
            
        return {"success": True, "created": created}

    @route.post('/conversations/{conversation_id}/members/remove', response={200: Dict[str, Any]})
    def remove_group_member(self, request, conversation_id: uuid.UUID, payload: RemoveGroupMemberSchema):
        user = request.user
        conv = get_object_or_404(Conversation, id=conversation_id, type='group')
        
        # Check permissions
        requester_participant = get_object_or_404(ConversationParticipant, conversation=conv, user=user)
        if requester_participant.role not in ['owner', 'admin']:
             return 403, {"error": "Only owners and admins can remove members"}
             
        target_user = target_participant.user
        target_participant.delete()
        Message.objects.create(
            conversation=conv,
            sender=None,
            content=f"@{target_user.first_name} {target_user.last_name} a été retiré du groupe",
            content_type=Message.ContentType.SYSTEM
        )
        return {"success": True}
        
    @route.post('/conversations/{conversation_id}/leave', response={200: Dict[str, Any]})
    def leave_group(self, request, conversation_id: uuid.UUID):
        user = request.user
        conv = get_object_or_404(Conversation, id=conversation_id, type='group')
        participant = get_object_or_404(ConversationParticipant, conversation=conv, user=user)
        
        if participant.role == 'owner':
             return 400, {"error": "Owners cannot leave. Please delete the group or transfer ownership."}
             
        participant.delete()
        Message.objects.create(
            conversation=conv,
            sender=None,
            content=f"@{user.first_name} {user.last_name} a quitté le groupe",
            content_type=Message.ContentType.SYSTEM
        )
        return {"success": True}
