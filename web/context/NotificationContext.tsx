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
                            flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border w-80 transform transition-all duration-300 animate-in slide-in-from-right
                            ${toast.type === 'success' ? 'bg-white border-green-100 text-green-800' :
                                toast.type === 'error' ? 'bg-white border-red-100 text-red-800' :
                                    toast.type === 'warning' ? 'bg-white border-yellow-100 text-yellow-800' :
                                        'bg-white border-blue-100 text-blue-800'}
                        `}
                    >
                        {toast.type === 'success' && <CheckCircle className="text-green-500" size={20} />}
                        {toast.type === 'error' && <AlertCircle className="text-red-500" size={20} />}
                        {toast.type === 'warning' && <AlertTriangle className="text-yellow-500" size={20} />}
                        {toast.type === 'info' && <Info className="text-blue-500" size={20} />}

                        <p className="text-sm font-medium flex-1">{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-gray-400 hover:text-gray-600 transition"
                        >
                            <X size={16} />
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
