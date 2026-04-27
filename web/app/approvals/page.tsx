'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { getPendingApprovals, approveRequest, rejectRequest } from '@/services/api';
import { 
    CheckCircle, Clock, FileText, ChevronRight, AlertCircle, 
    ShieldCheck, XCircle, Loader2, Calendar, User, 
    Layers, Search, Filter, ArrowUpRight, Check
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import DashboardLayout from '../dashboard-layout';
import Link from 'next/link';
import ConfirmationModal from '@/components/ConfirmationModal';
import PurchaseOrderModal from '@/components/approvals/PurchaseOrderModal';
import QuoteModal from '@/components/approvals/QuoteModal';
import TimelineModal from '@/components/approvals/TimelineModal';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { Skeleton } from '@/components/ui/Skeleton';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

interface ApprovalRequest {
    id: number;
    document_type_label?: string;
    content_type_model: string;
    object_id: number;
    description?: string;
    created_at: string;
    created_by_name?: string;
    created_by_email?: string;
}

export default function ApprovalsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { showToast } = useNotification();

    const {
        data: rawApprovals,
        loading,
        error,
        refetch
    } = useApiQuery<ApprovalRequest[]>(
        getPendingApprovals,
        [user?.id],
        { enabled: !!user, initialData: [] }
    );

    const [dismissed, setDismissed] = useState<Set<number>>(new Set());
    const requests = useMemo(
        () => (rawApprovals || []).filter(r => !dismissed.has(r.id)),
        [rawApprovals, dismissed]
    );

    const [processingId, setProcessingId] = useState<number | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean; id: number | null; type: 'approve' | 'reject' | null;
    }>({ isOpen: false, id: null, type: null });
    const [selectedPO, setSelectedPO] = useState<{ purchaseId: number; approvalId: number } | null>(null);
    const [selectedQuote, setSelectedQuote] = useState<{ quoteId: number; approvalId: number } | null>(null);
    const [timelineModal, setTimelineModal] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });

    const handleConfirmAction = useCallback(async (inputValue?: string) => {
        if (!confirmModal.id || !confirmModal.type) return;
        const { id, type } = confirmModal;

        setDismissed(prev => new Set([...prev, id]));
        setConfirmModal({ isOpen: false, id: null, type: null });
        setProcessingId(id);

        try {
            if (type === 'approve') {
                await approveRequest(id);
                showToast(t('approvals.toast.approve_success'), 'success');
            } else {
                if (!inputValue) { 
                    setDismissed(prev => { const s = new Set(prev); s.delete(id); return s; }); 
                    return; 
                }
                await rejectRequest(id, inputValue);
                showToast(t('approvals.toast.reject_success'), 'success');
            }
        } catch {
            setDismissed(prev => { const s = new Set(prev); s.delete(id); return s; });
            showToast(t('approvals.toast.action_error', { type: t(`approvals.card.${type}`).toLowerCase() }), 'error');
        } finally {
            setProcessingId(null);
        }
    }, [confirmModal, showToast, t]);

    const confirmApprove = (id: number) => setConfirmModal({ isOpen: true, id, type: 'approve' });
    const confirmReject = (id: number) => setConfirmModal({ isOpen: true, id, type: 'reject' });

    const getLink = (req: ApprovalRequest) => {
        if (req.content_type_model === 'purchaseorder') return `/purchases/${req.object_id}`;
        switch (req.content_type_model) {
            case 'payrollrun': return `/hr/payroll/${req.object_id}`;
            case 'quote': return `/quotes`;
            default: return '#';
        }
    };

    const handleViewDetails = (req: ApprovalRequest, e: React.MouseEvent) => {
        if (req.content_type_model === 'purchaseorder') {
            e.preventDefault();
            setSelectedPO({ purchaseId: req.object_id, approvalId: req.id });
        } else if (req.content_type_model === 'quote') {
            e.preventDefault();
            setSelectedQuote({ quoteId: req.object_id, approvalId: req.id });
        }
    };

    return (
        <DashboardLayout>
            {/* Modals */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null, type: null })}
                onConfirm={handleConfirmAction}
                title={confirmModal.type === 'approve' ? t('approvals.modal_confirm.approve_title') : t('approvals.modal_confirm.reject_title')}
                message={confirmModal.type === 'approve' ? t('approvals.modal_confirm.approve_msg') : t('approvals.modal_confirm.reject_msg')}
                confirmText={confirmModal.type === 'approve' ? t('approvals.modal_confirm.confirm_approve') : t('approvals.modal_confirm.confirm_reject')}
                isDanger={confirmModal.type === 'reject'}
                showInput={confirmModal.type === 'reject'}
                inputPlaceholder={t('approvals.modal_confirm.placeholder')}
            />
            <PurchaseOrderModal
                isOpen={!!selectedPO} onClose={() => setSelectedPO(null)}
                purchaseId={selectedPO?.purchaseId || 0} approvalRequestId={selectedPO?.approvalId || 0}
                onApprove={(id) => { setSelectedPO(null); confirmApprove(id); }}
                onReject={(id) => { setSelectedPO(null); confirmReject(id); }}
            />
            <QuoteModal
                isOpen={!!selectedQuote} onClose={() => setSelectedQuote(null)}
                quoteId={selectedQuote?.quoteId || 0} approvalRequestId={selectedQuote?.approvalId || 0}
                onApprove={(id) => { setSelectedQuote(null); confirmApprove(id); }}
                onReject={(id) => { setSelectedQuote(null); confirmReject(id); }}
            />
            <TimelineModal
                isOpen={timelineModal.isOpen}
                onClose={() => setTimelineModal({ isOpen: false, id: null })}
                approvalId={timelineModal.id || 0}
            />

            <div className="max-w-5xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className={clsx("text-4xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            Centre d'Approbation
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Validation des demandes & Workflow de décision
                        </p>
                    </div>
                    {requests.length > 0 && (
                        <div className="bg-amber-50 text-amber-700 px-5 py-2.5 rounded-full border border-amber-100 flex items-center gap-2 animate-pulse">
                            <Clock size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{requests.length} En Attente</span>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left: Summary/Filters */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                            <Layers className="text-indigo-400 mb-6" size={32} />
                            <h3 className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 mb-1">Queue de Travail</h3>
                            <p className={clsx("text-4xl font-black tracking-tighter", displayFont.className)}>{requests.length}</p>
                            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest italic">Action requise</p>
                        </div>

                        <div className="bg-white rounded-[32px] border border-slate-100 p-6 space-y-4 shadow-sm">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtres Rapides</h4>
                            <div className="space-y-1">
                                <FilterButton label="Tout voir" count={requests.length} active />
                                <FilterButton label="Paie" count={requests.filter(r => r.content_type_model === 'payrollrun').length} />
                                <FilterButton label="Achats" count={requests.filter(r => r.content_type_model === 'purchaseorder').length} />
                            </div>
                        </div>
                    </div>

                    {/* Right: List */}
                    <div className="lg:col-span-3 space-y-4">
                        {loading ? (
                            <Skeleton.ApprovalList count={4} />
                        ) : error ? (
                            <div className="bg-rose-50 border border-rose-100 rounded-[32px] p-10 text-center">
                                <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
                                <h3 className="text-lg font-black text-rose-900">Erreur de chargement</h3>
                                <p className="text-rose-700 text-sm mt-2">{error}</p>
                                <button onClick={refetch} className="mt-6 px-6 py-2 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700">Réessayer</button>
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="bg-white rounded-[48px] p-20 text-center border border-dashed border-slate-200">
                                <div className="mx-auto w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center mb-8 rotate-3 group-hover:rotate-0 transition-transform">
                                    <ShieldCheck className="text-emerald-500" size={48} />
                                </div>
                                <h3 className={clsx("text-2xl font-black text-slate-900 mb-2", displayFont.className)}>{t('approvals.empty.title')}</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t('approvals.empty.desc')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {requests.map(req => (
                                    <ApprovalCardExecutive 
                                        key={req.id}
                                        req={req}
                                        processingId={processingId}
                                        t={t}
                                        onApprove={confirmApprove}
                                        onReject={confirmReject}
                                        onViewDetails={handleViewDetails}
                                        onTimeline={(id) => setTimelineModal({ isOpen: true, id })}
                                        getLink={getLink}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function ApprovalCardExecutive({
    req, processingId, t,
    onApprove, onReject, onViewDetails, onTimeline, getLink
}: {
    req: ApprovalRequest;
    processingId: number | null;
    t: any;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
    onViewDetails: (req: ApprovalRequest, e: React.MouseEvent) => void;
    onTimeline: (id: number) => void;
    getLink: (req: ApprovalRequest) => string;
}) {
    const isProcessing = processingId === req.id;
    const label = req.document_type_label ||
        (req.content_type_model === 'payrollrun' ? t('approvals.types.payroll') :
         req.content_type_model === 'purchaseorder' ? t('approvals.types.purchase') :
         req.content_type_model);

    return (
        <div className={clsx(
            "group bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-slate-100/50 transition-all relative overflow-hidden",
            isProcessing && "opacity-50 pointer-events-none"
        )}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                    <div className="h-16 w-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <FileText size={28} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                            <h3 className={clsx("text-xl font-black text-slate-900 tracking-tight", displayFont.className)}>{label}</h3>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">#{req.object_id}</span>
                        </div>
                        {req.description && (
                            <p className="text-slate-500 font-medium text-sm line-clamp-1 mb-3">{req.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Calendar size={12} className="opacity-40" /> {new Date(req.created_at).toLocaleDateString('fr-FR')}</span>
                            <span className="h-1 w-1 bg-slate-200 rounded-full" />
                            <span className="flex items-center gap-1.5"><User size={12} className="opacity-40" /> {req.created_by_name || 'Système'}</span>
                        </div>
                        <button
                            onClick={() => onTimeline(req.id)}
                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 mt-4 flex items-center gap-1.5 uppercase tracking-widest"
                        >
                            Suivre le circuit <ArrowUpRight size={12} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href={getLink(req)}
                        onClick={(e) => onViewDetails(req, e)}
                        className="px-5 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2"
                    >
                        Explorer <ChevronRight size={14} />
                    </Link>
                    <div className="h-8 w-px bg-slate-100 mx-1 hidden md:block" />
                    <button
                        onClick={() => onReject(req.id)}
                        className="px-6 py-3 text-rose-600 hover:bg-rose-50 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                        {t('approvals.card.reject')}
                    </button>
                    <button
                        onClick={() => onApprove(req.id)}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2"
                    >
                        <Check size={16} />
                        {t('approvals.card.approve')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function FilterButton({ label, count, active }: any) {
    return (
        <button className={clsx(
            "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all",
            active ? "bg-indigo-50 text-indigo-700 shadow-inner" : "text-slate-500 hover:bg-slate-50"
        )}>
            <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
            <span className={clsx(
                "text-[10px] font-black px-2 py-0.5 rounded-lg",
                active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
            )}>{count}</span>
        </button>
    );
}
