
'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';

type Message = {
    message: string;
    user_id: string; // ID of sender
    timestamp: string;
    content_type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';
    media_url?: string;
};

type ConnectContextType = {
    isConnected: boolean;
    messages: Message[];
    connectToConversation: (id: string) => void;
    disconnect: () => void;
    sendMessage: (content: string, type?: string, mediaUrl?: string) => void;
    activeConversationId: string | null;
    setMessages: (messages: Message[]) => void;
};

const ConnectContext = createContext<ConnectContextType>({} as ConnectContextType);

// Helper to determine WebSocket URL
const WS_URL = 'ws://localhost:8000/ws/connect';

export function ConnectProvider({ children }: { children: React.ReactNode }) {
    const { token, user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const ws = useRef<WebSocket | null>(null);

    const connectToConversation = (id: string) => {
        if (ws.current) {
            ws.current.close();
        }

        if (!token) {
            console.error("No token available for WebSocket");
            return;
        }

        setActiveConversationId(id);
        setMessages([]); // Clear previous messages (history should be fetched via REST)

        // Append token for middleware auth
        const url = `${WS_URL}/${id}/?token=${token}`;
        const socket = new WebSocket(url);

        socket.onopen = () => {
            console.log("WebSocket Connected:", id);
            setIsConnected(true);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages((prev) => [...prev, data]);
        };

        socket.onclose = () => {
            console.log("WebSocket Disconnected");
            setIsConnected(false);
        };

        socket.onerror = (error) => {
            console.error("WebSocket Error:", error);
        };

        ws.current = socket;
    };

    const disconnect = () => {
        if (ws.current) {
            ws.current.close();
        }
        setActiveConversationId(null);
        setIsConnected(false);
    };

    const sendMessage = (content: string, type: string = 'text', mediaUrl?: string) => {
        if (ws.current && isConnected) {
            ws.current.send(JSON.stringify({
                message: content,
                user_id: user?.kumba_uid,
                content_type: type,
                media_url: mediaUrl
            }));
        } else {
            console.warn("WebSocket not connected");
        }
    };

    return (
        <ConnectContext.Provider value={{ isConnected, messages, connectToConversation, disconnect, sendMessage, activeConversationId, setMessages }}>
            {children}
        </ConnectContext.Provider>
    );
}

export const useConnect = () => useContext(ConnectContext);
