import { AlertTriangle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (inputValue?: string) => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    isDanger?: boolean;
    showInput?: boolean;
    inputPlaceholder?: string;
    initialInputValue?: string;
    description?: string; // fallback if message not enough
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false,
    isDanger = false,
    showInput = false,
    inputPlaceholder = '',
    initialInputValue = ''
}: ConfirmationModalProps) {
    const [inputValue, setInputValue] = useState(initialInputValue);

    useEffect(() => {
        if (isOpen) {
            setInputValue(initialInputValue);
        }
    }, [isOpen, initialInputValue]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            <AlertTriangle size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    </div>
                </div>

                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    {message}
                </p>

                {showInput && (
                    <div className="mb-6">
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={inputPlaceholder}
                            rows={3}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => onConfirm(inputValue)} // Pass input value
                        disabled={isLoading || (showInput && !inputValue.trim())}
                        className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50
                            ${isDanger
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                    >
                        {isLoading && <Loader2 className="animate-spin" size={16} />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
