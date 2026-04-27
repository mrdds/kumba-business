'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'danger'
}: ConfirmModalProps) {
  const colors = {
    danger: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 shadow-red-200',
      icon: 'bg-red-100 text-red-600'
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
      icon: 'bg-amber-100 text-amber-600'
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
      icon: 'bg-blue-100 text-blue-600'
    }
  }[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-white rounded-[24px] shadow-2xl overflow-hidden p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-14 h-14 rounded-2xl ${colors.icon} flex items-center justify-center mb-4`}>
                <AlertCircle size={28} />
              </div>
              
              <h3 className="text-lg font-black text-slate-900 mb-2">{title}</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
                {message}
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-black text-[11px] uppercase tracking-wider transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-3 px-4 ${colors.button} text-white rounded-xl font-black text-[11px] uppercase tracking-wider transition-all shadow-lg active:scale-95`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
