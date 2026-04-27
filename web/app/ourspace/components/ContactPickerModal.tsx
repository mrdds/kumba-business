'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, User as UserIcon, Loader2 } from 'lucide-react';
import api from '../../../services/api';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface Participant {
  id: number;
  kumba_uid: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar?: string;
  email?: string;
  phone_number?: string;
  job_title?: string;
  department?: string;
}

interface ContactPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: Participant) => void;
}

export default function ContactPickerModal({ isOpen, onClose, onSelect }: ContactPickerModalProps) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/connect/users/search${search ? `?q=${search}` : ''}`);
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching users", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [search, isOpen]);

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <h3 className="text-lg font-black text-[#1E293B]">Partager un contact</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher un collaborateur..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-600/20 transition-all outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                  <Loader2 className="animate-spin" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Recherche en cours...</p>
                </div>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelect(u);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-2xl transition-all group text-left"
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:ring-2 group-hover:ring-blue-500/20 transition-all">
                      {u.avatar ? (
                        <img src={u.avatar} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <UserIcon size={20} className="text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-[#1E293B] truncate">{u.first_name} {u.last_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 truncate">{u.job_title || 'Collaborateur'}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-xs font-bold text-slate-400">Aucun collaborateur trouvé</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
