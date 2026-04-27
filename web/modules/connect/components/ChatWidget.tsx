
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, Image as ImageIcon, Users, Plus } from 'lucide-react';
import { useConnect } from '../context/ConnectProvider';
import { useAuth } from '../../../context/AuthContext';
import { fetchConversations, fetchMessages, createGroupConversation, uploadMedia } from '../services/api';

export default function ChatWidget() {
    const { user } = useAuth();
    const { connectToConversation, disconnect, sendMessage, messages, isConnected, setMessages } = useConnect();

    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [view, setView] = useState<'list' | 'chat' | 'create_group'>('list');
    const [activeChat, setActiveChat] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Group Creation State
    const [groupTitle, setGroupTitle] = useState('');
    const [groupEmails, setGroupEmails] = useState('');

    const loadConversations = useCallback(async () => {
        try {
            const data = await fetchConversations();
            setConversations(data);
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadConversations();
        }
    }, [isOpen, loadConversations]);

    const handleSelectChat = async (conv: any) => {
        setActiveChat(conv);
        try {
            const history = await fetchMessages(conv.id);
            const formattedHistory = history.map((m: any) => ({
                message: m.content,
                user_id: m.sender_id,
                timestamp: m.created_at,
                content_type: m.content_type,
                media_url: m.media_url
            }));
            setMessages(formattedHistory);
            connectToConversation(conv.id);
            setView('chat');
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue);
        setInputValue('');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Optimistic UI could show uploading state here
            const { url } = await uploadMedia(file);
            const type = file.type.startsWith('image/') ? 'image' : 'document';
            sendMessage(file.name, type, url);
        } catch (err) {
            console.error("Upload failed", err);
            alert("Upload failed");
        }
    };

    const handleCreateGroup = async () => {
        if (!groupTitle || !groupEmails) return;
        try {
            const emails = groupEmails.split(',').map(e => e.trim());
            await createGroupConversation(groupTitle, emails);
            setGroupTitle('');
            setGroupEmails('');
            loadConversations();
            setView('list');
        } catch (e) {
            console.error("Failed to create group", e);
        }
    };

    const handleBack = () => {
        disconnect();
        setView('list');
        setActiveChat(null);
        loadConversations();
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-105 transition-transform"
                >
                    <MessageSquare size={24} />
                </button>
            )}

            {isOpen && (
                <div className="flex flex-col w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-10 fade-in duration-200">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between text-white shrink-0">
                        <div className="flex items-center space-x-3">
                            <h3 className="font-bold text-lg">
                                {view === 'list' && 'Messages'}
                                {view === 'create_group' && 'Nouveau Groupe'}
                                {view === 'chat' && (activeChat?.title || 'Chat')}
                            </h3>
                        </div>
                        <div className="flex items-center space-x-2">
                            {view !== 'list' && (
                                <button onClick={handleBack} className="p-1 hover:bg-white/20 rounded-lg text-sm bg-white/10 px-3">
                                    Retour
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 relative">
                        {view === 'list' && (
                            <>
                                <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                                    <button
                                        onClick={() => setView('create_group')}
                                        className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium text-sm flex items-center justify-center hover:bg-indigo-100 transition-colors"
                                    >
                                        <Plus size={16} className="mr-2" /> Nouveau Groupe / Chat
                                    </button>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {conversations.length === 0 && (
                                        <div className="p-8 text-center text-slate-400">
                                            <MessageSquare size={48} className="mx-auto mb-2 opacity-20" />
                                            <p>Aucune conversation</p>
                                        </div>
                                    )}
                                    {conversations.map((conv) => (
                                        <button
                                            key={conv.id}
                                            onClick={() => handleSelectChat(conv)}
                                            className="w-full text-left p-4 hover:bg-white hover:shadow-sm transition-all flex items-start space-x-3"
                                        >
                                            <div className="w-10 h-10 bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 rounded-full overflow-hidden">
                                                {conv.icon ? (
                                                    <img src={conv.icon} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    conv.type === 'group' ? <Users size={20} /> : (conv.title?.[0] || '?')
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h4 className="font-semibold text-slate-800 truncate pr-2">
                                                        {conv.title || 'Sans titre'}
                                                    </h4>
                                                    {conv.last_message && (
                                                        <span className="text-xs text-slate-400">
                                                            {new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500 truncate">
                                                    {conv.last_message?.content_type === 'image' ? '📷 Image' : (conv.last_message?.content || 'Nouvelle conversation')}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {view === 'create_group' && (
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom du groupe</label>
                                    <input
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="Ex: Marketing Team"
                                        value={groupTitle}
                                        onChange={e => setGroupTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Participants (Emails)</label>
                                    <textarea
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-24"
                                        placeholder="alice@ourspace.app, bob@ourspace.app"
                                        value={groupEmails}
                                        onChange={e => setGroupEmails(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Séparez les emails par des virgules</p>
                                </div>
                                <button
                                    onClick={handleCreateGroup}
                                    disabled={!groupTitle || !groupEmails}
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Créer le Groupe
                                </button>
                            </div>
                        )}

                        {view === 'chat' && (
                            <div className="p-4 space-y-4 min-h-full flex flex-col justify-end">
                                {!isConnected && <div className="text-center text-xs text-slate-400 py-2">Connexion...</div>}

                                {messages.map((msg, idx) => {
                                    const isMe = msg.user_id === user.kumba_uid;
                                    return (
                                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            {!isMe && <div className="w-8 h-8 rounded-full bg-slate-200 mr-2 flex-shrink-0" />}
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-none'}`}>
                                                {msg.content_type === 'image' && msg.media_url ? (
                                                    <img src={msg.media_url} alt="Shared image" className="rounded-lg max-w-full mb-1" />
                                                ) : (
                                                    <p className="text-sm leading-relaxed">{msg.message}</p>
                                                )}
                                                <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {view === 'chat' && (
                        <div className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2 shrink-0">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            >
                                <ImageIcon size={20} />
                            </button>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Message..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <Send size={18} className="translate-x-0.5" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
