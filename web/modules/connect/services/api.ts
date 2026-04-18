
import api from '../../../services/api';

// --- Connect (Chat) ---
export const fetchConversations = async () => {
    const response = await api.get('/connect/conversations');
    return response.data;
};

export const createConversation = async (data: any) => {
    const response = await api.post('/connect/conversations', data);
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
    // Note: Axios/fetch usually handles multipart automatically if body is FormData
    const response = await api.post('/connect/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data; // Returns { url: string }
};

export const fetchMessages = async (conversationId: string) => {
    const response = await api.get(`/connect/conversations/${conversationId}/messages`);
    return response.data;
};

export const sendMessage = async (conversationId: string, data: any) => {
    const response = await api.post(`/connect/conversations/${conversationId}/messages`, data);
    return response.data;
};
