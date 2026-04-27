'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, LayoutGrid, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface PollCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (poll: { question: string, options: string[] }) => void;
}

export default function PollCreatorModal({ isOpen, onClose, onCreate }: PollCreatorModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredOptions = options.filter(o => o.trim() !== '');
    if (question.trim() && filteredOptions.length >= 2) {
      onCreate({ question, options: filteredOptions });
      setQuestion('');
      setOptions(['', '']);
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
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                  <BarChart2 size={20} />
                </div>
                <h3 className="text-lg font-black text-[#1E293B]">Créer un sondage</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Question</label>
                <textarea
                  placeholder="Posez votre question..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all outline-none min-h-[100px] resize-none"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Options</label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2 group">
                      <input
                        type="text"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(i, e.target.value)}
                        className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                        required={i < 2}
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(i)}
                          className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {options.length < 10 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="flex items-center gap-2 text-amber-600 hover:text-amber-700 text-[10px] font-black uppercase tracking-wider px-1 py-2 transition-colors"
                  >
                    <Plus size={14} />
                    Ajouter une option
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={!question.trim() || options.filter(o => o.trim() !== '').length < 2}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:shadow-none mt-4"
              >
                Lancer le sondage
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
