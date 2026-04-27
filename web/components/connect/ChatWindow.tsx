"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useConnect } from '../../context/ConnectProvider';
import { useAuth } from '../../context/AuthContext';
import { Send, Phone, Video, MoreVertical } from 'lucide-react';
import { fetchMessages, sendMessage as apiSendMessage } from '../../services/api';
import { useTranslation } from 'react-i18next';

interface ChatWindowProps {
    conversation: any;
}

export function ChatWindow({ conversation }: ChatWindowProps) {
    const { t } = useTranslation();
    const { messages: liveMessages } = useConnect();
    const { user } = useAuth();
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load history when conversation changes
    useEffect(() => {
        if (conversation?.id) {
            fetchMessages(conversation.id).then(setHistory).catch(console.error);
        }
    }, [conversation?.id]);

    // Merge history and live messages for this conversation
    const allMessages = [
        ...history,
        ...liveMessages.filter(m => m.conversation_id === conversation?.id)
    ];

    // Dedup messages by ID just in case
    const uniqueMessages = Array.from(new Map(allMessages.map(m => [m.id, m])).values());

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !conversation) return;

        try {
            await apiSendMessage(conversation.id, { content: input });
            setInput('');
        } catch (err) {
            console.error("Failed to send", err);
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [uniqueMessages.length, conversation?.id]);

    if (!conversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Send className="h-8 w-8 text-gray-300" />
                </div>
                <p>{t('connect.select_to_start')}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="font-bold text-blue-600">
                            {conversation.title?.[0] || '#'}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{conversation.title || t('connect.chat')}</h3>
                        <p className="text-xs text-gray-500 uppercase">{conversation.type}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><Phone className="h-4 w-4" /></button>
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><Video className="h-4 w-4" /></button>
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><MoreVertical className="h-4 w-4" /></button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                <div className="space-y-4">
                    {uniqueMessages.map((msg) => {
                        const isMe = msg.sender?.id === user?.id || msg.sender_id === user?.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl p-3 px-4 shadow-sm ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}>
                                    {!isMe && <div className="text-xs opacity-70 mb-1 font-medium">{msg.sender?.first_name}</div>}
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                    <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('connect.type_message')}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="h-5 w-5 ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
