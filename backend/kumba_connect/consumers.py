import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import Conversation, Message, ConversationParticipant, Meeting, MeetingLog
from kumba_auth.models import Presence
from django.contrib.auth import get_user_model
from notifications.utils import send_push_notification

# User identity helper
def get_user_class():
    from django.contrib.auth import get_user_model
    return get_user_model()

class GlobalConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        if user and user.is_authenticated:
            self.user_room = f'user_updates_{user.id}'
            await self.channel_layer.group_add(
                self.user_room,
                self.channel_name
            )
            await self.accept()
            
            # Global online status
            await self.update_user_presence(user, 'online')
            await self.broadcast_status(user, 'online')
        else:
            await self.accept() # Accept then close to be safer with some clients
            await self.close()

    async def disconnect(self, close_code):
        user = self.scope.get('user')
        if hasattr(self, 'user_room'):
            await self.channel_layer.group_discard(
                self.user_room,
                self.channel_name
            )
            if user and user.is_authenticated:
                await self.update_user_presence(user, 'offline')
                await self.broadcast_status(user, 'offline')

    async def broadcast_status(self, user, status):
        # Notify all users who share a conversation with this user
        conv_ids = await self.get_user_conversations(user)
        for c_id in conv_ids:
            await self.channel_layer.group_send(
                f'chat_{c_id}',
                {
                    'type': 'status_event',
                    'user_id': user.id,
                    'status': status
                }
            )
            # Also notify their global list
            participants = await self.get_participants(c_id)
            for p_id in participants:
                if p_id != user.id:
                    await self.channel_layer.group_send(
                        f'user_updates_{p_id}',
                        {
                            'type': 'status_update',
                            'user_id': user.id,
                            'status': status,
                            'conversation_id': str(c_id)
                        }
                    )

    @database_sync_to_async
    def get_user_conversations(self, user):
        return list(Conversation.objects.filter(participants=user).values_list('id', flat=True))

    @database_sync_to_async
    def get_participants(self, conversation_id):
        return list(ConversationParticipant.objects.filter(conversation_id=conversation_id).values_list('user_id', flat=True))

    async def last_message_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def status_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type')
        user = self.scope.get('user')
        user_id = user.id if user and user.is_authenticated else None

        if msg_type == 'call_signal':
            action = data.get('action')
            target_user_id = data.get('target_user_id')
            meeting_id = data.get('meeting_id')
            conversation_id = data.get('conversation_id')

            if target_user_id:
                # Relay to target user's global socket
                await self.channel_layer.group_send(
                    f'user_updates_{target_user_id}',
                    {
                        'type': 'global_call_signal',
                        'user_id': user_id,
                        'action': action,
                        'meeting_id': meeting_id,
                        'is_audio_only': data.get('is_audio_only', False),
                        'caller_first_name': data.get('caller_first_name', ''),
                        'conversation_id': conversation_id
                    }
                )
            elif meeting_id:
                # Broadcast to all participants of the meeting
                participants = await self.get_meeting_participants(meeting_id)
                for p_id in participants:
                    if p_id != user_id:
                        await self.channel_layer.group_send(
                            f'user_updates_{p_id}',
                            {
                                'type': 'global_call_signal',
                                'user_id': user_id,
                                'action': action,
                                'meeting_id': meeting_id,
                                'is_audio_only': data.get('is_audio_only', False),
                                'caller_first_name': data.get('caller_first_name', ''),
                                'conversation_id': conversation_id
                            }
                        )

            # Log termination events
            if action in ['call_rejected', 'call_canceled', 'call_timeout']:
                log_type = 'declined' if action == 'call_rejected' else 'cancelled' if action == 'call_canceled' else 'no_answer'
                if meeting_id:
                    await self.log_meeting_event(meeting_id, log_type, user_id, data)

    async def global_call_signal(self, event):
        await self.send(text_data=json.dumps({
            'type': 'call_signal',
            'action': event['action'],
            'meeting_id': event.get('meeting_id'),
            'caller_first_name': event.get('caller_first_name'),
            'is_audio_only': event.get('is_audio_only'),
            'conversation_id': event.get('conversation_id'),
            'caller_id': event.get('user_id')
        }))

    @database_sync_to_async
    def get_meeting_participants(self, meeting_id):
        from .models import Meeting
        try:
            meeting = Meeting.objects.get(id=meeting_id)
            participants = list(meeting.participants.values_list('id', flat=True))
            # Include creator
            if meeting.creator_id not in participants:
                participants.append(meeting.creator_id)
            return participants
        except Meeting.DoesNotExist:
            return []

    @database_sync_to_async
    def log_meeting_event(self, meeting_id, event_type, user_id, details):
        try:
            meeting = Meeting.objects.get(id=meeting_id)
            MeetingLog.objects.create(
                meeting=meeting,
                event_type=event_type,
                user_id=user_id,
                details=details
            )
        except Exception:
            pass

    @database_sync_to_async
    def update_user_presence(self, user, status):
        from django.utils import timezone
        from kumba_auth.models import Presence
        Presence.objects.update_or_create(
            user=user,
            date=timezone.now().date(),
            defaults={
                'status': 'ONLINE' if status == 'online' else 'OFFLINE',
                'last_active': timezone.now()
            }
        )

class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.typing_task = None

    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Notify others user came online
        user = self.scope.get('user')
        if user and user.is_authenticated:
             await self.channel_layer.group_send(self.room_group_name, {
                 'type': 'status_event',
                 'user_id': user.id,
                 'status': 'online'
             })
             await self.update_user_presence(user, 'online')

    async def disconnect(self, close_code):
        user = self.scope.get('user')
        if user and user.is_authenticated:
             await self.channel_layer.group_send(self.room_group_name, {
                 'type': 'status_event',
                 'user_id': user.id,
                 'status': 'offline'
             })
             await self.update_user_presence(user, 'offline')

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type', 'chat_message')
        user_id = data.get('user_id') # Usually better to get from scope if authenticated

        if msg_type == 'chat_message':
            message_content = data['message']
            content_type = data.get('content_type', 'text')
            media_url = data.get('media_url')
            
            message = await self.save_message(user_id, self.conversation_id, message_content, content_type, media_url, data.get('reply_to_id'))
            
            # 1. Broadcast to Chat Group IMMEDIATELY
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message_event',
                    'id': str(message.id),
                    'message': message_content,
                    'content_type': content_type,
                    'media_url': media_url,
                    'user_id': user_id,
                    'timestamp': str(message.created_at),
                    'client_id': data.get('client_id'),
                    'reply_to_id': str(message.reply_to_id) if message.reply_to_id else None,
                    'is_forwarded': message.is_forwarded,
                    'reply_to_content': message.reply_to.content if message.reply_to else None,
                    'reply_to_sender_name': (f"{message.reply_to.sender.first_name} {message.reply_to.sender.last_name}".strip() or message.reply_to.sender.username) if message.reply_to and message.reply_to.sender else "Système" if message.reply_to else None
                }
            )
            
            # 2. Trigger Push Notifications in BACKGROUND
            asyncio.create_task(self.trigger_push_notifications(message))

            # 3. Notify global users for list update (BACKGROUND)
            sender = self.scope.get('user')
            sender_name = sender.first_name if sender and sender.is_authenticated else "Contact"
            asyncio.create_task(self.broadcast_global_update(message, message_content, content_type, user_id, sender_name))
        elif msg_type == 'typing':
            is_typing = data.get('is_typing', True)
            
            # Cancel existing timeout task if any
            if self.typing_task:
                self.typing_task.cancel()
                self.typing_task = None

            if is_typing:
                # Start a new timeout task
                self.typing_task = asyncio.create_task(self.typing_timeout_task(user_id))

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_event',
                    'user_id': user_id,
                    'is_typing': is_typing
                }
            )
        elif msg_type == 'seen':
            await self.mark_seen(user_id, self.conversation_id)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'seen_event',
                    'user_id': user_id,
                }
            )
        elif msg_type == 'signal':
            # WebRTC Signaling (offer, answer, candidate)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'signal_event',
                    'user_id': user_id,
                    'signal': data['signal'],
                    # Optional: target_user_id to route signal directly to a specific participant
                    'target_user_id': data.get('target_user_id')
                }
            )
        elif msg_type == 'call_signal':
            action = data.get('action')
            target_user_id = data.get('target_user_id')
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'call_signal_event',
                    'user_id': user_id,
                    'action': action,
                    'target_user_id': target_user_id,
                    'meeting_id': data.get('meeting_id'),
                    'is_audio_only': data.get('is_audio_only', False),
                    'caller_first_name': data.get('caller_first_name', '')
                }
            )
            # Forward ALL call actions to the global socket so users get it anywhere in the app
            # This is crucial for meetings without a fixed conversation_id context
            if action in ['call_offer', 'call_ended', 'call_canceled', 'call_ringing', 'call_answered', 'call_rejected', 'call_left']:
                if target_user_id:
                    # Direct signal: send to specific user's global socket
                    await self.channel_layer.group_send(
                        f'user_updates_{target_user_id}',
                        {
                            'type': 'global_call_signal',
                            'user_id': user_id,
                            'action': action,
                            'meeting_id': data.get('meeting_id'),
                            'is_audio_only': data.get('is_audio_only', False),
                            'caller_first_name': data.get('caller_first_name', ''),
                            'conversation_id': self.conversation_id
                        }
                    )
                else:
                    # Group call: broadcast to all participants via their global sockets
                    participants = await self.get_participants(self.conversation_id)
                    for p_id in participants:
                        if p_id != user_id:
                             await self.channel_layer.group_send(
                                f'user_updates_{p_id}',
                                {
                                    'type': 'global_call_signal',
                                    'user_id': user_id,
                                    'action': action,
                                    'meeting_id': data.get('meeting_id'),
                                    'is_audio_only': data.get('is_audio_only', False),
                                    'caller_first_name': data.get('caller_first_name', ''),
                                    'conversation_id': self.conversation_id
                                }
                            )

                if action == 'call_offer':
                    if target_user_id:
                        asyncio.create_task(self.trigger_call_notification(user_id, target_user_id, data))
                    else:
                        # For group calls, send push notification to all participants except caller
                        participants = await self.get_participants(self.conversation_id)
                        for p_id in participants:
                            if p_id != user_id:
                                asyncio.create_task(self.trigger_call_notification(user_id, p_id, data))

            # Log termination events
            if action in ['call_rejected', 'call_canceled', 'call_timeout']:
                log_type = 'declined' if action == 'call_rejected' else 'cancelled' if action == 'call_canceled' else 'no_answer'
                if meeting_id:
                    await self.log_meeting_event(meeting_id, log_type, user_id, data)

            # Log termination events
            if action in ['call_rejected', 'call_canceled', 'call_timeout']:
                log_type = 'declined' if action == 'call_rejected' else 'cancelled' if action == 'call_canceled' else 'no_answer'
                if meeting_id:
                    await self.log_meeting_event(meeting_id, log_type, user_id, data)


        elif msg_type == 'reaction':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'reaction_event',
                    'message_id': data['message_id'],
                    'reactions': data['reactions'],
                    'user_id': user_id
                }
            )
        elif msg_type == 'delete_message':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'message_deleted_event',
                    'message_id': data['message_id'],
                    'user_id': user_id
                }
            )

    async def chat_message_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'id': event.get('id'),
            'message': event['message'],
            'content_type': event.get('content_type', 'text'),
            'media_url': event.get('media_url'),
            'user_id': event['user_id'],
            'timestamp': event['timestamp'],
            'client_id': event.get('client_id'),
            'reply_to_id': event.get('reply_to_id'),
            'reply_to_content': event.get('reply_to_content'),
            'reply_to_sender_name': event.get('reply_to_sender_name'),
            'is_forwarded': event.get('is_forwarded', False)
        }))

    async def reaction_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'reaction',
            'message_id': str(event['message_id']),
            'reactions': event['reactions'],
            'user_id': event['user_id']
        }))

    async def message_deleted_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'delete_message',
            'message_id': str(event['message_id'])
        }))

    async def typing_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'is_typing': event['is_typing']
        }))

    async def seen_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'seen',
            'user_id': event['user_id']
        }))

    async def status_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'status',
            'user_id': event['user_id'],
            'status': event['status']
        }))
        
        # Also notify global list of this participant if they are online
        # (This avoids participants having to be in every ChatRoom socket)
        # Actually broadcast_status in GlobalConsumer handles this, but 
        # ChatConsumer also triggers it when someone enters/leaves a specific room.
        # To keep it simple, we let GlobalConsumer manage the "Online/Offline" based on socket presence.

    async def typing_timeout_task(self, user_id):
        try:
            await asyncio.sleep(3)
            # If we reach here, no new typing signal was received, so stop typing
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_event',
                    'user_id': user_id,
                    'is_typing': False
                }
            )
            self.typing_task = None
        except asyncio.CancelledError:
            # Task was cancelled by a new typing signal, which is expected
            pass

    async def signal_event(self, event):
        # Route signaling only to the intended recipient if target_user_id is set
        user = self.scope.get('user')
        if event.get('target_user_id'):
            if user and user.is_authenticated and user.id != event['target_user_id']:
                return # Not for me

        await self.send(text_data=json.dumps({
            'type': 'signal',
            'user_id': event['user_id'],
            'signal': event['signal']
        }))

    async def call_signal_event(self, event):
        user = self.scope.get('user')
        if event.get('target_user_id'):
            if user and user.is_authenticated and user.id != event['target_user_id']:
                return # Not for me

        await self.send(text_data=json.dumps({
            'type': 'call_signal',
            'user_id': event['user_id'],
            'action': event['action'],
            'target_user_id': event.get('target_user_id'),
            'meeting_id': event.get('meeting_id'),
            'is_audio_only': event.get('is_audio_only', False),
            'caller_first_name': event.get('caller_first_name', '')
        }))

    @database_sync_to_async
    def save_message(self, user_id, conversation_id, content, content_type='text', media_url=None, reply_to_id=None):
        user = User.objects.get(id=user_id) if user_id else (self.scope.get('user') if self.scope.get('user') and self.scope.get('user').is_authenticated else None)
        if not user:
            raise ValueError("Unauthenticated user cannot send message")
             
        conversation = Conversation.objects.get(id=conversation_id)
        msg = Message.objects.create(
            sender=user, 
            conversation=conversation, 
            content=content, 
            content_type=content_type, 
            media_url=media_url,
            reply_to_id=reply_to_id
        )
        conversation.save() # touch updated_at
        return msg

    @database_sync_to_async
    def mark_seen(self, user_id, conversation_id):
        user = User.objects.get(id=user_id) if user_id else (self.scope.get('user') if self.scope.get('user') and self.scope.get('user').is_authenticated else None)
        if user:
            ConversationParticipant.objects.filter(
                conversation_id=conversation_id, user=user
            ).update(last_read_at=timezone.now())

    async def trigger_push_notifications(self, message):
        # We run this in a separate task or just sync_to_async
        await self._send_notifications(message)

    @database_sync_to_async
    def _send_notifications(self, message):
        conversation = message.conversation
        sender = message.sender
        
        # Notify all participants except the sender
        participants = conversation.participants.exclude(id=sender.id)
        
        title = f"Nouveau message de {sender.first_name}"
        if conversation.type != 'direct':
             title = f"{conversation.title or 'Groupe'}: {sender.first_name}"
             
        body = message.content
        if message.content_type == 'encrypted_text':
             body = "🔒 Message sécurisé"
        elif message.content_type == 'meeting_link':
             body = "🎥 Appel vidéo démarré"

        for p in participants:
            send_push_notification(p, title, body)

    @database_sync_to_async
    def update_user_presence(self, user, status):
        from django.utils import timezone
        Presence.objects.update_or_create(
            user=user,
            date=timezone.now().date(),
            defaults={
                'status': 'ONLINE' if status == 'online' else 'OFFLINE',
                'last_active': timezone.now()
            }
        )

    async def broadcast_global_update(self, message, message_content, content_type, user_id, sender_name):
        try:
            participants = await self.get_participants(self.conversation_id)
            for p_id in participants:
                await self.channel_layer.group_send(
                    f'user_updates_{p_id}',
                    {
                        'type': 'last_message_update',
                        'conversation_id': self.conversation_id,
                        'message': message_content,
                        'sender_name': sender_name,
                        'timestamp': str(message.created_at),
                        'content_type': content_type,
                        'user_id': user_id,
                        'id': str(message.id),
                        'is_forwarded': message.is_forwarded
                    }
                )
        except Exception as e:
            print(f"Error in global broadcast: {e}")

    @database_sync_to_async
    def get_participants(self, conversation_id):
        return list(ConversationParticipant.objects.filter(conversation_id=conversation_id).values_list('user_id', flat=True))

    async def trigger_call_notification(self, caller_id, target_user_id, data):
        await self._send_call_notification(caller_id, target_user_id, data)

    @database_sync_to_async
    def _send_call_notification(self, caller_id, target_user_id, data):
        try:
            target_user = User.objects.get(id=target_user_id)
            caller = User.objects.get(id=caller_id)
            
            title = f"Appel de {caller.first_name}"
            body = "Appuyez pour répondre"
            
            notification_data = {
                'type': 'call_offer',
                'meeting_id': data.get('meeting_id'),
                'caller_first_name': caller.first_name,
                'is_audio_only': data.get('is_audio_only', False),
                'conversation_id': data.get('conversation_id') or getattr(self, 'conversation_id', None),
                'caller_id': caller_id,
                'channelId': 'calls'
            }
            
            send_push_notification(target_user, title, body, data=notification_data, sound='whatsapp_ring.mp3')
        except Exception as e:
            print(f"Error sending call notification: {e}")

    @database_sync_to_async
    def log_meeting_event(self, meeting_id, event_type, user_id, details):
        try:
            meeting = Meeting.objects.get(id=meeting_id)
            MeetingLog.objects.create(
                meeting=meeting,
                event_type=event_type,
                user_id=user_id,
                details=details
            )
        except Exception:
            pass
