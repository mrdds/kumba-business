'use client';

import React from 'react';
import { 
  X, 
  MessageSquare, 
  Phone, 
  Image as ImageIcon, 
  Star, 
  Share2, 
  MoreHorizontal,
  Mail,
  User,
  Briefcase,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Participant {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  phone_number?: string;
  department?: string;
  job_title?: string;
  last_seen?: string;
  username?: string;
  kumba_id?: string;
  supervisor_name?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Participant | null;
  onStartChat?: (user: Participant) => void;
  onStartCall?: (type: 'audio' | 'video') => void;
  onShowMedia?: () => void;
}

export default function UserProfileModal({ 
  isOpen, 
  onClose, 
  user,
  onStartChat,
  onStartCall,
  onShowMedia
}: UserProfileModalProps) {
  if (!user) return null;

  const API_BASE_URL = 'http://localhost:8000/api';
  const getFullAvatarUrl = (path?: string): string | null => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
          >
            {/* Header / Top Image Area */}
            <div className="relative h-32 bg-gradient-to-br from-blue-600 to-indigo-700">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors z-10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Info Header */}
            <div className="px-8 pb-6 -mt-12 relative">
              <div className="flex items-end justify-between mb-4">
                <div className="w-24 h-24 rounded-[28px] border-4 border-white bg-slate-100 overflow-hidden shadow-lg">
                  {user.avatar ? (
                    <img 
                      src={getFullAvatarUrl(user.avatar) || ''} 
                      className="w-full h-full object-cover" 
                      alt="" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 text-2xl font-black">
                      {user.first_name?.[0]}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mb-2">
                  <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <Star size={20} />
                  </button>
                  <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <Share2 size={20} />
                  </button>
                  <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-black text-slate-900 leading-tight">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {user.job_title || 'Membre de l\'équipe'}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Disponible</span>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="flex gap-2 mb-8">
                <button 
                  onClick={() => user && onStartChat?.(user)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-blue-100 transition-colors"
                >
                  <MessageSquare size={16} />
                  Chats
                </button>
                <button 
                  onClick={() => onStartCall?.('audio')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-slate-100 transition-colors"
                >
                  <Phone size={16} />
                  Call
                </button>
                <button 
                  onClick={() => onShowMedia?.()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-slate-100 transition-colors"
                >
                  <ImageIcon size={16} />
                  Media
                </button>
              </div>

              {/* Details List */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 py-1 text-slate-300">
                    <User size={18} />
                  </div>
                  <div className="flex-1 border-b border-slate-50 pb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account</p>
                    <p className="text-sm font-bold text-slate-700">{user.kumba_id || user.username || user.email.split('@')[0]}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 py-1 text-slate-300">
                    <Phone size={18} />
                  </div>
                  <div className="flex-1 border-b border-slate-50 pb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mobile</p>
                    <p className="text-sm font-bold text-slate-700">{user.phone_number || 'Non renseigné'}</p>
                    <p className="text-[10px] font-bold text-blue-500 mt-1">(WhatsApp number)</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 py-1 text-slate-300">
                    <Mail size={18} />
                  </div>
                  <div className="flex-1 border-b border-slate-50 pb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                    {user.email ? (
                      <a href={`mailto:${user.email}`} className="text-sm font-bold text-blue-600 hover:underline">{user.email}</a>
                    ) : (
                      <p className="text-sm font-bold text-slate-700">Non renseigné</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 py-1 text-slate-300">
                    <Briefcase size={18} />
                  </div>
                  <div className="flex-1 border-b border-slate-50 pb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Svc Dept.</p>
                    <p className="text-sm font-bold text-slate-700">{user.department || 'Administration'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 py-1 text-slate-300">
                    <User size={18} />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Superviseur</p>
                    <p className="text-sm font-bold text-slate-700">{user.supervisor_name || 'Non assigné'}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
