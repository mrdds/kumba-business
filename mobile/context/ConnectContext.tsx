import React, { createContext, useContext, useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../services/api';

interface Message {
    id: number;
    content: string;
    sender_id: number;
    created_at: string;
    conversation_id: number;
    sender?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    };
}

interface ConnectContextType {
    isConnected: boolean;
    messages: Message[];
    sendMessage: (conversationId: number, content: string) => void;
    activeConversationId: number | null;
    setActiveConversationId: (id: number | null) => void;
}

const ConnectContext = createContext<ConnectContextType | undefined>(undefined);

export const ConnectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

    useEffect(() => {
        SecureStore.getItemAsync('access_token').then(setToken);
    }, []);

    // Construct WebSocket URL
    // Replace http/https with ws/wss
    const wsUrl = API_URL ? API_URL.replace(/^http/, 'ws') + '/connect/' : '';

    const { sendMessage: wsSendMessage, readyState } = useWebSocket(
        token && wsUrl ? `${wsUrl}?token=${token}` : null,
        {
            shouldReconnect: () => true,
            reconnectAttempts: 10,
            reconnectInterval: 3000,
            onMessage: (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'chat_message') {
                        setMessages((prev) => [...prev, data.message]);
                    }
                } catch (e) {
                    console.error("Failed to parse websocket message", e);
                }
            }
        }
    );

    const sendMessage = (conversationId: number, content: string) => {
        if (wsSendMessage && readyState === ReadyState.OPEN) {
            wsSendMessage(JSON.stringify({
                message: {
                    content,
                    conversation_id: conversationId
                }
            }));
        }
    };

    const isConnected = readyState === ReadyState.OPEN;

    return (
        <ConnectContext.Provider value={{
            isConnected,
            messages,
            sendMessage,
            activeConversationId,
            setActiveConversationId
        }}>
            {children}
        </ConnectContext.Provider>
    );
};

export const useConnect = () => {
    const context = useContext(ConnectContext);
    if (context === undefined) {
        throw new Error('useConnect must be used within a ConnectProvider');
    }
    return context;
};
