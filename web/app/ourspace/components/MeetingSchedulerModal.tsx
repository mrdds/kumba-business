'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, Video, Mic, AlignLeft, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface MeetingSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (meeting: { title: string, scheduled_at: string, is_audio_only: boolean, description?: string }) => void;
}

export default function MeetingSchedulerModal({ isOpen, onClose, onSchedule }: MeetingSchedulerModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<'audio' | 'video'>('video');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && date && time) {
      const scheduled_at = `${date}T${time}:00`;
      onSchedule({ title, scheduled_at, is_audio_only: type === 'audio', description });
      setTitle('');
      setDate('');
      setTime('');
      setDescription('');
      onClose();
    }
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Calendar size={20} />
                </div>
                <h3 className="text-lg font-black text-[#1E293B]">Programmer un meeting</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Titre de la réunion</label>
                <input
                  type="text"
                  placeholder="Ex: Point hebdomadaire"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Heure</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Type de réunion</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('video')}
                    className={clsx(
                      "flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all border",
                      type === 'video' 
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20" 
                        : "bg-slate-50 text-slate-600 border-slate-50 hover:bg-slate-100"
                    )}
                  >
                    <Video size={16} />
                    VIDÉO
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('audio')}
                    className={clsx(
                      "flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all border",
                      type === 'audio' 
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20" 
                        : "bg-slate-50 text-slate-600 border-slate-50 hover:bg-slate-100"
                    )}
                  >
                    <Mic size={16} />
                    AUDIO
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description (Optionnel)</label>
                <div className="relative">
                  <AlignLeft className="absolute left-4 top-4 text-slate-400" size={16} />
                  <textarea
                    placeholder="Ordre du jour, notes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none min-h-[80px] resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all mt-2"
              >
                Confirmer la programmation
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
