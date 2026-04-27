'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface NotificationContextType {
    showToast: (message: string, type: ToastType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto
                            flex items-center gap-4 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-md border w-96 transform transition-all duration-500 ease-out animate-in slide-in-from-right fade-in zoom-in-95
                            ${toast.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-900' :
                                toast.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-900' :
                                    toast.type === 'warning' ? 'bg-yellow-50/80 border-yellow-200 text-yellow-900' :
                                        'bg-blue-50/90 border-blue-200 text-blue-900'}
                        `}
                    >
                        <div className={`
                            p-2 rounded-full
                            ${toast.type === 'success' ? 'bg-green-200/50' :
                                toast.type === 'error' ? 'bg-red-200/50' :
                                    toast.type === 'warning' ? 'bg-yellow-200/50' :
                                        'bg-blue-200/50'}
                        `}>
                            {toast.type === 'success' && <CheckCircle className="text-green-600" size={22} />}
                            {toast.type === 'error' && <AlertCircle className="text-red-600" size={22} />}
                            {toast.type === 'warning' && <AlertTriangle className="text-yellow-600" size={22} />}
                            {toast.type === 'info' && <Info className="text-blue-600" size={22} />}
                        </div>

                        <div className="flex-1">
                            <p className="text-sm font-semibold tracking-tight">{toast.message}</p>
                        </div>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-black/5 rounded-lg transition-colors text-gray-400 hover:text-gray-900"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
