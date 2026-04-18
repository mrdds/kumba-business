'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getPendingApprovals, approveRequest, rejectRequest } from '@/services/api';
import { Loader2, CheckCircle, Clock, FileText, ChevronRight } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import DashboardLayout from '../dashboard-layout';
import Link from 'next/link';
import ConfirmationModal from '@/components/ConfirmationModal';
import PurchaseOrderModal from '@/components/approvals/PurchaseOrderModal';
import QuoteModal from '@/components/approvals/QuoteModal';
import TimelineModal from '@/components/approvals/TimelineModal';

export default function ApprovalsPage() {
    const { user } = useAuth();
    const [requests, setRequests] = useState < any[] > ([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState < number | null > (null);
    const [confirmModal, setConfirmModal] = useState < {
        isOpen: boolean,
        id: number | null,
        type: 'approve' | 'reject' | null
    } > ({ isOpen: false, id: null, type: null });
    const { showToast } = useNotification();
    const [selectedPO, setSelectedPO] = useState < { purchaseId: number, approvalId: number } | null > (null);
    const [selectedQuote, setSelectedQuote] = useState < { quoteId: number, approvalId: number } | null > (null);
    const [timelineModal, setTimelineModal] = useState < { isOpen: boolean, id: number | null } > ({ isOpen: false, id: null });

    useEffect(() => {
        if (user) {
            fetchApprovals();
        }
    }, [user]);

    const fetchApprovals = async () => {
        try {
            const data = await getPendingApprovals();
            setRequests(data);
        } catch (error) {
            console.error('Failed to fetch approvals', error);
            showToast('Failed to fetch pending approvals', 'error');
        } finally {
            setLoading(false);
        }
    };

    const confirmApprove = (id: number) => {
        setConfirmModal({ isOpen: true, id, type: 'approve' });
    };

    const confirmReject = (id: number) => {
        setConfirmModal({ isOpen: true, id, type: 'reject' });
    }

    const handleConfirmAction = async (inputValue?: string) => {
        if (!confirmModal.id || !confirmModal.type) return;
        const { id, type } = confirmModal;

        setProcessingId(id);

        // Close modal immediately as per original design for approval, but for reject we might want to capture input.
        setConfirmModal({ ...confirmModal, isOpen: false });

        try {
            if (type === 'approve') {
                await approveRequest(id);
                showToast('Request approved successfully', 'success');
                setRequests(requests.filter(r => r.id !== id));
            } else if (type === 'reject') {
                if (!inputValue) return; // Should not happen due to disabled button
                await rejectRequest(id, inputValue);
                showToast('Request rejected successfully', 'success');
                setRequests(requests.filter(r => r.id !== id));
            }
        } catch (error) {
            console.error(error);
            showToast(`Failed to ${type} request`, 'error');
        } finally {
            setProcessingId(null);
        }
    };


    const getLink = (req: any) => {
        if (req.document_type_label === 'Vendor Bill' || (req.content_type_model === 'purchaseorder' && req.document_type_label === 'Vendor Bill')) {
            return `/bills/${req.object_id}`;
        }
        switch (req.content_type_model) {
            case 'payrollrun': return `/hr/payroll/${req.object_id}`;
            case 'purchaseorder': return `/purchases/${req.object_id}`;
            case 'quote': return `/quotes`; // No details page for quotes yet, list view
            default: return '#';
        }
    };

    const handleViewDetails = (req: any, e: React.MouseEvent) => {
        if (req.content_type_model === 'purchaseorder') {
            e.preventDefault();
            setSelectedPO({ purchaseId: req.object_id, approvalId: req.id });
        } else if (req.content_type_model === 'quote') {
            e.preventDefault();
            setSelectedQuote({ quoteId: req.object_id, approvalId: req.id });
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                </div>
            </DashboardLayout>
        );
    }


    return (
        <DashboardLayout>
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={confirmModal.type === 'approve' ? "Confirm Approval" : "Reject Request"}
                message={confirmModal.type === 'approve'
                    ? "Are you sure you want to approve this request? This action cannot be undone."
                    : "Please provide a reason for rejecting this request."}
                confirmText={confirmModal.type === 'approve' ? "Approve" : "Reject Request"}
                isDanger={confirmModal.type === 'reject'}
                showInput={confirmModal.type === 'reject'}
                inputPlaceholder="Reason for rejection..."
            />

            <PurchaseOrderModal
                isOpen={!!selectedPO}
                onClose={() => setSelectedPO(null)}
                purchaseId={selectedPO?.purchaseId || 0}
                approvalRequestId={selectedPO?.approvalId || 0}
                onApprove={(id) => {
                    setSelectedPO(null);
                    confirmApprove(id);
                }}
                onReject={(id) => {
                    setSelectedPO(null);
                    confirmReject(id);
                }}
            />

            <QuoteModal
                isOpen={!!selectedQuote}
                onClose={() => setSelectedQuote(null)}
                quoteId={selectedQuote?.quoteId || 0}
                approvalRequestId={selectedQuote?.approvalId || 0}
                onApprove={(id) => {
                    setSelectedQuote(null);
                    confirmApprove(id);
                }}
                onReject={(id) => {
                    setSelectedQuote(null);
                    confirmReject(id);
                }}
            />

            <TimelineModal
                isOpen={timelineModal.isOpen}
                onClose={() => setTimelineModal({ ...timelineModal, isOpen: false })}
                approvalId={timelineModal.id || 0}
            />

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Approvals Center</h1>
                <p className="text-gray-500">Manage pending requests requiring your authorization</p>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
                    <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">All Clear!</h3>
                    <p className="text-gray-500">You have no pending approvals at the moment.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {requests.map((req) => (
                            <div key={req.id} className="p-6 hover:bg-gray-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600 hidden md:block">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                            {req.document_type_label || (req.content_type_model === 'payrollrun' ? 'Payroll Run' :
                                                req.content_type_model === 'purchaseorder' ? 'Purchase Order' : req.content_type_model)}
                                            <span className="text-gray-400 font-normal">#{req.object_id}</span>
                                        </h3>
                                        {req.description && (
                                            <p className="text-sm text-gray-700 font-medium mt-1">{req.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </span>
                                            <span>Requested by: {req.created_by_name || req.created_by_email || 'System'}</span>
                                        </div>
                                        <button
                                            onClick={() => setTimelineModal({ isOpen: true, id: req.id })}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1 group"
                                        >
                                            Suivre le parcours <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Link
                                        href={getLink(req)}
                                        onClick={(e) => handleViewDetails(req, e)}
                                        className="px-4 py-2 text-gray-600 hover:text-blue-600 font-medium text-sm flex items-center gap-1"
                                    >
                                        {req.content_type_model === 'purchaseorder' ? 'Review' : 'View Details'} <ChevronRight size={16} />
                                    </Link>
                                    <button
                                        onClick={() => confirmReject(req.id)}
                                        disabled={processingId === req.id}
                                        className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => confirmApprove(req.id)}
                                        disabled={processingId === req.id}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {processingId === req.id && <Loader2 className="animate-spin" size={16} />}
                                        Approve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
