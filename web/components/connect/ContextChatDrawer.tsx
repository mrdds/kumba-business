"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useConnect } from '../../context/ConnectProvider';
import { useAuth } from '../../context/AuthContext';
import { Send, X, MessageSquare, Loader2 } from 'lucide-react';
import { fetchConversations, createConversation, fetchMessages, sendMessage as apiSendMessage } from '../../services/api';

interface ContextChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    contentType: string; // 'invoice', 'purchase_order', etc.
    objectId: string; // ID of the object
    title?: string;
}

export function ContextChatDrawer({ isOpen, onClose, contentType, objectId, title }: ContextChatDrawerProps) {
    const { messages: liveMessages } = useConnect();
    const { user } = useAuth();
    const [conversation, setConversation] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load or Create Conversation for this context
    useEffect(() => {
        if (isOpen && contentType && objectId) {
            loadContextConversation();
        }
    }, [isOpen, contentType, objectId]);

    const loadContextConversation = async () => {
        setLoading(true);
        try {
            const convos = await fetchConversations();
            const existing = convos.find((c: any) => c.content_type === contentType && c.object_id === objectId.toString());

            if (existing) {
                setConversation(existing);
                const msgs = await fetchMessages(existing.id);
                setMessages(msgs);
            } else {
                // Create new
                const newConvo = await createConversation({
                    type: 'CHANNEL', // or GROUP
                    title: title || `${contentType} #${objectId}`,
                    participant_ids: [user.id],
                    content_type: contentType,
                    object_id: objectId.toString()
                });
                setConversation(newConvo);
                setMessages([]);
            }
        } catch (e) {
            console.error("Failed to load context chat", e);
        } finally {
            setLoading(false);
        }
    };

    // Merge live messages
    const allMessages = [
        ...messages,
        ...liveMessages.filter(m => m.conversation_id === conversation?.id)
    ];
    const uniqueMessages = Array.from(new Map(allMessages.map(m => [m.id, m])).values());

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !conversation) return;
        try {
            await apiSendMessage(conversation.id, { content: input });
            setInput('');
        } catch (e) { console.error(e); }
    };

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [uniqueMessages.length, conversation?.id]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform border-l z-50 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold flex items-center gap-2 text-gray-800">
                    <MessageSquare className="h-4 w-4" />
                    {title || 'Context Chat'}
                </h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-600">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : (
                    <div className="space-y-4">
                        {uniqueMessages.map((msg) => {
                            const isMe = msg.sender?.id === user?.id || msg.sender_id === user?.id;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-3 px-4 shadow-sm text-sm ${isMe
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                        }`}>
                                        {!isMe && <div className="text-xs opacity-70 mb-0.5 font-medium">{msg.sender?.first_name}</div>}
                                        <p className="leading-relaxed">{msg.content}</p>
                                        <div className={`text-[9px] mt-1 text-right opacity-70`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                    </div>
                )}
            </div>

            <div className="p-4 border-t bg-white">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Discuss this..."
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
