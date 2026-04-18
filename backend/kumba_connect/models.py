
from django.db import models
from django.conf import settings
import uuid

User = settings.AUTH_USER_MODEL

class UserPublicKey(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='public_key_info')
    public_key = models.CharField(max_length=255) # base64 encoded Curve25519 public key
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"PubKey: {self.user}"

class Conversation(models.Model):
    class Type(models.TextChoices):
        DIRECT = 'direct', 'Direct Message'
        GROUP = 'group', 'Group Chat'
        CHANNEL = 'channel', 'Broadcast Channel'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.DIRECT)
    participants = models.ManyToManyField(User, through='ConversationParticipant', related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Enhanced Metadata
    title = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    icon = models.ImageField(upload_to='connect/icons/', blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True) # For settings, permissions, etc.

    def __str__(self):
        return f"{self.type} - {self.title or self.id}"

class ConversationParticipant(models.Model):
    class Role(models.TextChoices):
        OWNER = 'owner', 'Owner'
        ADMIN = 'admin', 'Admin'
        MEMBER = 'member', 'Member'

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)
    is_muted = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_favorite = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    is_unread = models.BooleanField(default=False)
    cleared_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('conversation', 'user')

class Message(models.Model):
    class ContentType(models.TextChoices):
        TEXT = 'text', 'Text'
        ENCRYPTED_TEXT = 'encrypted_text', 'Encrypted Text'
        IMAGE = 'image', 'Image'
        VIDEO = 'video', 'Video'
        AUDIO = 'audio', 'Audio'
        DOCUMENT = 'document', 'Document'
        LOCATION = 'location', 'Location'
        CONTACT = 'contact', 'Contact'
        SURVEY = 'survey', 'Survey'
        EVENT = 'event', 'Event'
        AI_IMAGE = 'ai_image', 'AI Image'
        MEETING_LINK = 'meeting_link', 'Meeting Link'
        SYSTEM = 'system', 'System'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages', null=True, blank=True)
    
    content = models.TextField(blank=True, null=True) # Text content or Caption
    content_type = models.CharField(max_length=20, choices=ContentType.choices, default=ContentType.TEXT)
    
    # Attachments (Simplified for MVP, could be separate table later)
    media_url = models.URLField(blank=True, null=True) 
    file_size = models.IntegerField(null=True, blank=True) # in bytes
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Interactions
    reactions = models.JSONField(default=dict, blank=True) # {'heart': [user_ids], 'thumbs_up': []}
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')
    mentions = models.ManyToManyField(User, related_name='mentions', blank=True)
    
    is_read = models.BooleanField(default=False) # Legacy simple read status
    is_forwarded = models.BooleanField(default=False)
    # TODO: Multi-user read status is handled via ConversationParticipant.last_read_at

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg {self.id} ({self.content_type})"

class Meeting(models.Model):
    class Status(models.TextChoices):
        PLANNED = 'planned', 'Planned'
        ONGOING = 'ongoing', 'Ongoing'
        ENDED = 'ended', 'Ended'
        CANCELLED = 'cancelled', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=100, blank=True, null=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_meetings')
    conversation = models.ForeignKey(Conversation, on_delete=models.SET_NULL, null=True, blank=True, related_name='meetings')
    participants = models.ManyToManyField(User, related_name='invited_meetings', blank=True)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    # LiveKit Specific
    livekit_room_name = models.CharField(max_length=100, blank=True, null=True, unique=True)
    duration = models.IntegerField(default=0, help_text="Duration in seconds")
    
    # Secure access token (temporary)
    access_token = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    
    metadata = models.JSONField(default=dict, blank=True) # Max participants, etc.
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Meeting {self.title or self.id} ({self.status})"

class MeetingLog(models.Model):
    class EventType(models.TextChoices):
        ROOM_STARTED = 'room_started', 'Room Started'
        ROOM_FINISHED = 'room_finished', 'Room Finished'
        PARTICIPANT_JOINED = 'participant_joined', 'Participant Joined'
        PARTICIPANT_LEFT = 'participant_left', 'Participant Left'
        DECLINED = 'declined', 'Call Declined'
        NO_ANSWER = 'no_answer', 'No Answer'
        CANCELLED = 'cancelled', 'Call Cancelled'

    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='logs')
    event_type = models.CharField(max_length=30, choices=EventType.choices)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Details from Webhook (identity, reason, duration)
    details = models.JSONField(default=dict, blank=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_type} - {self.meeting.id} - {self.user}"

class BlockedUser(models.Model):
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_users')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('blocker', 'blocked')

    def __str__(self):
        return f"{self.blocker} blocked {self.blocked}"

class StarredMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='starred_messages')
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='stars')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'message')

    def __str__(self):
        return f"{self.user} starred {self.message.id}"
