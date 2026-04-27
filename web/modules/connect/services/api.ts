
import api from '../../../services/api';

// --- Connect (Chat & Meetings) ---
export const fetchConversations = async (archived: boolean = false) => {
    const response = await api.get(`/connect/conversations?archived=${archived}`);
    return response.data;
};

export const fetchMessages = async (conversationId: string) => {
    const response = await api.get(`/connect/conversations/${conversationId}/messages`);
    return response.data;
};

export const createMessage = async (conversationId: string, payload: any) => {
    const response = await api.post(`/connect/conversations/${conversationId}/messages`, payload);
    return response.data;
};

export const updatePublicKey = async (publicKeyBase64: string) => {
    const response = await api.post('/connect/keys', { public_key: publicKeyBase64 });
    return response.data;
};

export const getPublicKey = async (userId: number) => {
    const response = await api.get(`/connect/keys/${userId}`);
    return response.data;
};

export const searchUsers = async (query: string) => {
    const response = await api.get(`/connect/users/search?q=${query}`);
    return response.data;
};

export const createConversation = async (payload: any) => {
    const response = await api.post('/connect/conversations', payload);
    return response.data;
};

export const createGroupConversation = async (title: string, participantEmails: string[]) => {
    const response = await api.post('/connect/conversations', {
        type: 'group',
        title,
        participant_emails: participantEmails
    });
    return response.data;
};

export const uploadMedia = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/connect/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const reactToMessage = async (messageId: string, reaction: string) => {
    const response = await api.post(`/connect/messages/${messageId}/react?reaction=${reaction}`);
    return response.data;
};

export const starMessage = async (messageId: string) => {
    const response = await api.post(`/connect/messages/${messageId}/star`);
    return response.data;
};

export const deleteMessage = async (messageId: string) => {
    const response = await api.delete(`/connect/messages/${messageId}`);
    return response.data;
};

export const toggleConversationAction = async (conversationId: string, action: string) => {
    const response = await api.post(`/connect/conversations/${conversationId}/toggle/${action}`);
    return response.data;
};

export const clearConversation = async (conversationId: string) => {
    const response = await api.post(`/connect/conversations/${conversationId}/clear`);
    return response.data;
};

export const deleteConversation = async (conversationId: string) => {
    const response = await api.delete(`/connect/conversations/${conversationId}`);
    return response.data;
};

export const createMeeting = async (payload: any) => {
    const response = await api.post('/connect/meetings', payload);
    return response.data;
};
