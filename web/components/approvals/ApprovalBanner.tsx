'use client';

/**
 * ApprovalBanner — Composant de décision critique.
 * Affiche le statut actuel du workflow et permet aux approbateurs d'agir.
 */
import React, { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { approveRequest, rejectRequest } from '@/services/auth.service';
import { useNotification } from '@/context/NotificationContext';
import { 
    Clock, ShieldCheck, XCircle, ChevronRight, MessageSquare, 
    Send, AlertCircle, RotateCcw, ShieldAlert
} from 'lucide-react';

interface ApprovalBannerProps {
    approvalId: number;
    status: 'draft' | 'pending_level_1' | 'pending_level_2' | 'pending_level_3' | 'approved' | 'rejected';
    currentLevel: number;
    rejectionReason?: string;
    userRole: string; // 'MANAGER', 'FINANCE', 'DIRECTOR', etc.
    onSuccess?: () => void;
    onRectify?: () => void;
}

const LEVEL_MAP: Record<string, number> = {
    'MANAGER': 1,
    'FINANCE': 2,
    'DIRECTOR': 3,
};

export function ApprovalBanner({ approvalId, status, currentLevel, rejectionReason, userRole, onSuccess, onRectify }: ApprovalBannerProps) {
    const { showToast } = useNotification();
    const [comment, setComment] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);

    const { mutate: approve, loading: approving } = useApiMutation(approveRequest, {
        onSuccess: () => {
            showToast('Document approuvé avec succès', 'success');
            onSuccess?.();
        }
    });

    const { mutate: reject, loading: rejecting } = useApiMutation(rejectRequest, {
        onSuccess: () => {
            showToast('Document rejeté', 'error');
            setShowRejectForm(false);
            onSuccess?.();
        }
    });

    const canApprove = (status.startsWith('pending') && LEVEL_MAP[userRole] === currentLevel);

    if (status === 'approved') {
        return (
            <div className="bg-green-600 text-white px-6 py-4 rounded-2xl flex items-center justify-between mb-6 shadow-lg shadow-green-600/20">
                <div className="flex items-center gap-3">
                    <ShieldCheck size={24} className="opacity-80" />
                    <div>
                        <p className="font-bold">Facture Approuvée</p>
                        <p className="text-xs text-green-100 italic">Prete pour envoi FNE / Règlement</p>
                    </div>
                </div>
                <div className="bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-300 rounded-full animate-pulse" />
                    FNE Éligible
                </div>
            </div>
        );
    }

    if (status === 'rejected') {
        return (
            <div className="bg-red-50 border border-red-200 text-red-900 px-6 py-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6">
                <div className="flex items-start gap-4">
                    <div className="bg-red-500 text-white p-2.5 rounded-2xl mt-0.5 shrink-0 shadow-lg shadow-red-200">
                        <XCircle size={24} />
                    </div>
                    <div className="space-y-1">
                        <p className="font-black text-lg tracking-tight uppercase">Document Rejeté</p>
                        <p className="text-sm opacity-90 leading-relaxed max-w-2xl">
                            {rejectionReason ? (
                                <span className="block italic bg-red-100/50 p-3 rounded-xl border border-red-100 mt-2 font-medium">
                                    &ldquo;{rejectionReason}&rdquo;
                                </span>
                            ) : (
                                "Ce document a été rejeté et doit être modifié pour repasser en validation."
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0">
                    <button 
                        onClick={onRectify}
                        className="w-full md:w-auto bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95"
                    >
                        <RotateCcw size={18} /> Rectifier & Renvoyer
                    </button>
                </div>
            </div>
        );
    }

    if (!canApprove) {
        const waitingLabel = {
            'pending_level_1': 'Manager',
            'pending_level_2': 'Finance',
            'pending_level_3': 'Direction',
        }[status] || 'Validation';

        return (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-6 py-4 rounded-2xl flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500 text-white p-2 rounded-xl">
                        <Clock size={20} className="animate-spin-slow" />
                    </div>
                    <div>
                        <p className="font-bold">Vérification en cours</p>
                        <p className="text-sm opacity-80 tracking-tight">Actuellement en attente du : <span className="font-black italic underline">{waitingLabel}</span></p>
                    </div>
                </div>
                <div className="text-xs font-bold text-amber-600/50 uppercase tracking-tighter">Lecture seule (Approbation requise)</div>
            </div>
        );
    }

    return (
        <div className="bg-blue-600 text-white p-1 rounded-3xl mb-6 shadow-xl shadow-blue-600/20 overflow-hidden">
            {!showRejectForm ? (
                <div className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <p className="font-black text-xl tracking-tight italic">Votre Approbation est Requise</p>
                            <p className="text-blue-100 text-sm font-medium">Vérifiez les détails avant de valider ce document.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowRejectForm(true)}
                            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-sm transition-all border border-white/10"
                        >
                            Rejeter
                        </button>
                        <button 
                            onClick={() => approve(approvalId)}
                            disabled={approving}
                            className="px-6 py-3 rounded-2xl bg-white text-blue-600 font-black text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg"
                        >
                            {approving ? 'Action en cours...' : 'Approuver Maintenant'}
                            {!approving && <ChevronRight size={18} />}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white m-1 rounded-2xl p-6 text-gray-900 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-red-50 text-red-500 p-2 rounded-xl">
                            <MessageSquare size={18} />
                        </div>
                        <h4 className="font-black uppercase tracking-tight text-red-600">Motif du rejet</h4>
                    </div>
                    <textarea 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-gray-300 min-h-[100px]"
                        placeholder="Ex: Le montant total ne correspond pas au bon de commande attaché..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <button 
                            onClick={() => setShowRejectForm(false)}
                            className="px-5 py-2.5 rounded-xl text-gray-400 font-bold text-sm hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button 
                            disabled={!comment.trim() || rejecting}
                            onClick={() => reject(approvalId, comment)}
                            className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-black text-sm flex items-center gap-2 disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-red-600/20"
                        >
                            {rejecting ? 'Rejet en cours...' : 'Confirmer le Rejet'}
                            {!rejecting && <Send size={14} />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
