"use client";

import React, { useEffect, useState } from 'react';
import { useConnect } from '../../context/ConnectProvider';
import { ChatSidebar } from '../../components/connect/ChatSidebar';
import { ChatWindow } from '../../components/connect/ChatWindow';
import { fetchConversations, createConversation, getEmployees } from '../../services/api';
import { Plus, X } from 'lucide-react';

export default function ConnectPage() {
    const { activeConversationId, setActiveConversationId } = useConnect();
    const [conversations, setConversations] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);

    useEffect(() => {
        loadConversations();
    }, [activeConversationId]); // Reload when convo changes to update unread/last msg? Or just initial.

    // Initial load
    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        try {
            const data = await fetchConversations();
            setConversations(data);
        } catch (e) {
            console.error("Failed to load conversations", e);
        }
    };

    const handleCreateChat = async (userId: number) => {
        try {
            const convo = await createConversation({
                type: 'DIRECT',
                participant_ids: [userId]
            });
            setConversations(prev => {
                // unique add
                if (prev.find(c => c.id === convo.id)) return prev;
                return [convo, ...prev];
            });
            setActiveConversationId(convo.id);
            setIsNewChatOpen(false);
        } catch (e) {
            console.error("Failed to create chat", e);
        }
    };

    const openNewChatModal = async () => {
        setIsNewChatOpen(true);
        if (employees.length === 0) {
            try {
                const data = await getEmployees();
                setEmployees(data);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    return (
        <div className="flex h-[calc(100vh-4rem)] border rounded-xl overflow-hidden bg-white shadow-sm my-4 mx-6">
            <div className="flex flex-col border-r w-80">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50/80 backdrop-blur">
                    <h2 className="font-bold text-lg text-gray-800">Kumba Connect</h2>
                    <button
                        onClick={openNewChatModal}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        title="New Chat"
                    >
                        <Plus className="h-5 w-5 text-gray-700" />
                    </button>
                </div>
                <ChatSidebar
                    conversations={conversations}
                    onSelectConversation={setActiveConversationId}
                />
            </div>

            <div className="flex-1 flex flex-col relative">
                <ChatWindow conversation={activeConversation} />

                {/* Simple Modal for New Chat */}
                {isNewChatOpen && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col max-h-[500px] border">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h3 className="font-semibold">New Message</h3>
                                <button onClick={() => setIsNewChatOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="p-2 overflow-y-auto flex-1">
                                {employees.map(emp => (
                                    <button
                                        key={emp.id}
                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg flex items-center gap-3 transition-colors"
                                        onClick={() => handleCreateChat(emp.user_id || emp.id)}
                                    >
                                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                            {emp.first_name?.[0]}{emp.last_name?.[0]}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{emp.first_name} {emp.last_name}</div>
                                            <div className="text-xs text-gray-500">{emp.role || 'Employee'}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
