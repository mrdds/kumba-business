from django.db import models
from django.conf import settings
from companies.models import Company

class Conversation(models.Model):
    TYPE_CHOICES = (
        ('DIRECT', 'Direct Message'),
        ('GROUP', 'Group Chat'),
        ('CHANNEL', 'Channel'),
    )
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='conversations')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='DIRECT')
    title = models.CharField(max_length=255, blank=True, null=True) # For groups/channels
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_conversations')
    
    # Contextual fields
    content_type = models.CharField(max_length=50, blank=True, null=True) # e.g., 'invoice', 'project'
    object_id = models.CharField(max_length=50, blank=True, null=True)
    
    def __str__(self):
        return self.title or f"{self.type} - {self.id}"

class ConversationParticipant(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations')
    joined_at = models.DateTimeField(auto_now_add=True)
    is_admin = models.BooleanField(default=False)
    last_read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('conversation', 'user')

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='sent_messages')
    content = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_system_message = models.BooleanField(default=False)
    
    # Attachments could be a separate model or JSON field, for MVP keeping it simple
    attachments = models.JSONField(default=list, blank=True) # List of file URLs/metadata
    
    # Reply support
    parent_message = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')
    
    def __str__(self):
        return f"Message {self.id} in {self.conversation_id}"

class MessageRead(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='read_receipts')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('message', 'user')
