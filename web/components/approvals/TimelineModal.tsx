'use client';
import { useEffect, useState } from 'react';
import { getApprovalTimeline } from '@/services/api';
import { Loader2, X, CheckCircle, Clock, Circle, User } from 'lucide-react';

interface TimelineModalProps {
    isOpen: boolean;
    onClose: () => void;
    approvalId: number;
}

export default function TimelineModal({ isOpen, onClose, approvalId }: TimelineModalProps) {
    const [timeline, setTimeline] = useState < any > (null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && approvalId) {
            fetchTimeline();
        }
    }, [isOpen, approvalId]);

    const fetchTimeline = async () => {
        setLoading(true);
        try {
            const data = await getApprovalTimeline(approvalId);
            setTimeline(data);
        } catch (error) {
            console.error('Failed to fetch timeline', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Suivi d'approbation</h2>
                        <p className="text-sm text-gray-500">Demande #{approvalId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                            <p className="text-gray-500 font-medium">Chargement du parcours...</p>
                        </div>
                    ) : timeline ? (
                        <div className="space-y-0">
                            {timeline.steps.map((step: any, idx: number) => (
                                <div key={idx} className="relative flex gap-4 pb-8 last:pb-0">
                                    {/* Line */}
                                    {idx < timeline.steps.length - 1 && (
                                        <div className={`absolute left-[15px] top-[30px] w-0.5 h-full ${step.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-200'
                                            }`} />
                                    )}

                                    {/* Icon */}
                                    <div className="relative z-10 flex-shrink-0 mt-1">
                                        {step.status === 'COMPLETED' ? (
                                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center border-2 border-white shadow-sm">
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            </div>
                                        ) : step.status === 'CURRENT' ? (
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                                                <Clock className="h-5 w-5 text-blue-600" />
                                            </div>
                                        ) : step.status === 'REJECTED' ? (
                                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center border-2 border-white shadow-sm">
                                                <X className="h-5 w-5 text-red-600" />
                                            </div>
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm">
                                                <Circle className="h-3 w-3 text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className={`font-bold ${step.status === 'CURRENT' ? 'text-blue-700' : 'text-gray-900'
                                                }`}>
                                                Étape {step.order}: {step.role || 'Approbation'}
                                            </span>
                                            {step.status === 'CURRENT' && (
                                                <span className="text-[10px] font-extrabold uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                    Action requise
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {step.approver || 'En attente...'}
                                        </p>

                                        {/* Logs associated with this step */}
                                        {timeline.history.filter((h: any) => h.step_order === step.order).map((h: any, i: number) => (
                                            <div key={i} className="mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                <p className="text-xs text-gray-700 font-medium">"{h.comments}"</p>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {new Date(h.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Impossible de charger le parcours.</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
