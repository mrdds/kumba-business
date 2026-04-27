'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';
import { Outfit } from 'next/font/google';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    variant = 'danger'
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-white/20 overflow-hidden"
                >
                    <div className="p-8 md:p-10">
                        <div className="flex flex-col items-center text-center">
                            <div className={clsx(
                                "h-20 w-20 rounded-[32px] flex items-center justify-center mb-6 shadow-xl",
                                variant === 'danger' ? "bg-rose-50 text-rose-500 shadow-rose-500/10" :
                                variant === 'warning' ? "bg-amber-50 text-amber-500 shadow-amber-500/10" :
                                "bg-indigo-50 text-indigo-500 shadow-indigo-500/10"
                            )}>
                                <AlertTriangle size={40} />
                            </div>

                            <h3 className={clsx("text-2xl font-black text-slate-900 tracking-tight mb-3", displayFont.className)}>
                                {title}
                            </h3>
                            
                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">
                                {message}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-8 py-4 bg-slate-50 text-slate-400 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={clsx(
                                        "flex-1 px-8 py-4 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl",
                                        variant === 'danger' ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" :
                                        variant === 'warning' ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" :
                                        "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                                    )}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Close button */}
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
