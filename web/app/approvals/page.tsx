'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { getPendingApprovals, approveRequest, rejectRequest } from '@/services/api';
import { 
    AlertCircle, ShieldCheck, Settings
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import DashboardLayout from '../dashboard-layout';
import Link from 'next/link';
import ConfirmationModal from '@/components/ConfirmationModal';
import PurchaseOrderModal from '@/components/approvals/PurchaseOrderModal';
import QuoteModal from '@/components/approvals/QuoteModal';
import TimelineModal from '@/components/approvals/TimelineModal';
import { useApiQuery } from '@/hooks/useApiQuery';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import ExecutiveCard from '@/components/approvals/ExecutiveCard';
import BentoStats from '@/components/approvals/BentoStats';
import FilterSidebar from '@/components/approvals/FilterSidebar';

const displayFont = Outfit({ subsets: ['latin'], weight: ['800'] });

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

    const [activeFilter, setActiveFilter] = useState('all');
    const [dismissed, setDismissed] = useState<Set<number>>(new Set());
    
    const filteredRequests = useMemo(() => {
        let base = (rawApprovals || []).filter(r => !dismissed.has(r.id));
        if (activeFilter === 'payroll') return base.filter(r => r.content_type_model === 'payrollrun');
        if (activeFilter === 'purchases') return base.filter(r => r.content_type_model === 'purchaseorder');
        return base;
    }, [rawApprovals, dismissed, activeFilter]);

    const filters = useMemo(() => [
        { id: 'all', label: 'Tout voir', count: (rawApprovals || []).filter(r => !dismissed.has(r.id)).length },
        { id: 'payroll', label: 'Paie', count: (rawApprovals || []).filter(r => !dismissed.has(r.id) && r.content_type_model === 'payrollrun').length },
        { id: 'purchases', label: 'Achats', count: (rawApprovals || []).filter(r => !dismissed.has(r.id) && r.content_type_model === 'purchaseorder').length },
    ], [rawApprovals, dismissed]);

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
        const model = req.content_type_model.toLowerCase();
        if (model === 'purchaseorder') return `/purchases/${req.object_id}`;
        if (model === 'payrollrun') return `/hr/payroll/${req.object_id}`;
        if (model === 'quote') return `/quotes`;
        if (model === 'salaryadvance') return `/hr/advances`;
        return '#';
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

            <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 min-h-screen bg-slate-50/30">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[3px]">Live System</span>
                        </div>
                        <h1 className={clsx("text-5xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            Approbations
                        </h1>
                        <p className="text-slate-500 font-medium mt-2 text-lg">
                            Validez les flux de travail et gardez le contrôle sur les opérations.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {user?.role === 'SUPER_ADMIN' && (
                            <Link
                                href="/approvals/config"
                                className="px-6 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <Settings size={16} />
                                Configurer
                            </Link>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                <BentoStats totalPending={filters[0].count} />

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
                    {/* Left: Sticky Sidebar */}
                    <aside className="lg:col-span-1">
                        <FilterSidebar 
                            filters={filters} 
                            activeFilter={activeFilter} 
                            onFilterChange={setActiveFilter} 
                        />
                    </aside>

                    {/* Right: List Area */}
                    <div className="lg:col-span-3 space-y-6">
                        {loading ? (
                            <div className="space-y-6">
                                {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-[40px] animate-pulse border border-slate-100" />)}
                            </div>
                        ) : error ? (
                            <div className="bg-rose-50 border border-rose-100 rounded-[40px] p-12 text-center">
                                <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
                                <h3 className="text-xl font-black text-rose-900">Erreur de chargement</h3>
                                <p className="text-rose-700 font-medium mt-2">{error}</p>
                                <button onClick={refetch} className="mt-8 px-8 py-4 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-900/10">Réessayer</button>
                            </div>
                        ) : filteredRequests.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[60px] p-24 text-center border border-dashed border-slate-200 shadow-sm"
                            >
                                <div className="mx-auto w-32 h-32 bg-emerald-50 rounded-[48px] flex items-center justify-center mb-10 rotate-3">
                                    <ShieldCheck className="text-emerald-500" size={64} />
                                </div>
                                <h3 className={clsx("text-3xl font-black text-slate-900 mb-4", displayFont.className)}>Tout est en ordre !</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-[3px] text-xs">Aucune demande en attente pour le moment.</p>
                            </motion.div>
                        ) : (
                            <div className="space-y-6">
                                <AnimatePresence mode="popLayout">
                                    {filteredRequests.map(req => (
                                        <ExecutiveCard 
                                            key={req.id}
                                            req={req}
                                            processingId={processingId}
                                            onApprove={confirmApprove}
                                            onReject={confirmReject}
                                            onViewDetails={handleViewDetails}
                                            onTimeline={(id) => setTimelineModal({ isOpen: true, id })}
                                            getLink={getLink}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
