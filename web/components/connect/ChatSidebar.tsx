"use client";

import React from 'react';
import { useConnect } from '../../context/ConnectProvider';
import { Plus, Hash, Users } from 'lucide-react';

interface ChatSidebarProps {
    onSelectConversation: (id: number) => void;
    conversations: any[];
}

export function ChatSidebar({ onSelectConversation, conversations }: ChatSidebarProps) {
    const { activeConversationId } = useConnect();

    return (
        <div className="w-80 border-r h-full flex flex-col bg-gray-50/50">
            <div className="p-4 border-b flex justify-between items-center bg-white">
                <h2 className="font-semibold text-lg">Messages</h2>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Plus className="h-5 w-5 text-gray-600" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-2 space-y-2">
                    {conversations.length === 0 && (
                        <div className="text-center p-4 text-gray-500 text-sm">
                            No conversations yet.
                        </div>
                    )}

                    {conversations.map((convo) => (
                        <button
                            key={convo.id}
                            onClick={() => onSelectConversation(convo.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${activeConversationId === convo.id
                                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                                    : 'hover:bg-white hover:shadow-sm border border-transparent'
                                }`}
                        >
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${activeConversationId === convo.id ? 'bg-blue-100' : 'bg-gray-200'
                                }`}>
                                {convo.type === 'DIRECT' ? (
                                    <Users className="h-5 w-5" />
                                ) : (
                                    <Hash className="h-5 w-5" />
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium truncate">
                                        {convo.type === 'DIRECT'
                                            ? convo.title || 'Direct Message'
                                            : convo.title}
                                    </span>
                                    {convo.unread_count > 0 && (
                                        <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                                            {convo.unread_count}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                    {convo.last_message?.content || 'No messages yet'}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
