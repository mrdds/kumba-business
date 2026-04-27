import os
import time
from django.conf import settings
from livekit import api

class LiveKitService:
    def __init__(self):
        self.api_key = getattr(settings, 'LIVEKIT_API_KEY', 'devkey')
        self.api_secret = getattr(settings, 'LIVEKIT_API_SECRET', 'secret')
        self.url = getattr(settings, 'LIVEKIT_URL', 'http://localhost:7880')

    def generate_token(self, room_name, participant_identity, participant_name=None):
        """
        Generates a join token for a LiveKit room.
        """
        token = api.AccessToken(self.api_key, self.api_secret)
        token.with_identity(participant_identity)
        if participant_name:
            token.with_name(participant_name)
        
        # Grant permissions
        token.with_grants(api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True
        ))
        
        return token.to_jwt()

    def get_room_client(self):
        return api.RoomServiceClient(self.url, self.api_key, self.api_secret)

    async def list_rooms(self):
        client = self.get_room_client()
        return await client.list_rooms()

    async def delete_room(self, room_name):
        client = self.get_room_client()
        await client.delete_room(api.DeleteRoomRequest(room=room_name))

# Singleton instance
livekit_service = LiveKitService()
