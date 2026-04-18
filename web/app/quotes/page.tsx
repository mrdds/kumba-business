'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../dashboard-layout';
import { getQuotes, convertQuote, submitQuoteApproval } from '../../services/api';
import { Plus, FileText, CheckCircle, RefreshCw, Loader2, Send } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useNotification } from '@/context/NotificationContext';
import ApprovalStatus from '@/components/ApprovalStatus';
import { formatCurrency } from '@/utils/formatCurrency';
import { useAuth } from '@/context/AuthContext';
import QuoteModal from '@/components/approvals/QuoteModal';

export default function QuoteList() {
    const { user } = useAuth();
    const { showToast } = useNotification();
    console.log('QuotesPage User Currency:', user?.company?.currency, user);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState<number | null>(null);
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);

    // Modals
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, id: number | null }>({ isOpen: false, id: null });
    const [submitModal, setSubmitModal] = useState<{ isOpen: boolean, id: number | null }>({ isOpen: false, id: null });

    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                const data = await getQuotes();
                setQuotes(data);
            } catch (error) {
                console.error("Failed to fetch quotes", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuotes();
    }, []);

    const handleConvertClick = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmModal({ isOpen: true, id });
    };

    const handleConfirmConvert = async () => {
        if (!confirmModal.id) return;
        const id = confirmModal.id;

        setConverting(id);
        setConfirmModal({ ...confirmModal, isOpen: false });

        try {
            await convertQuote(id);
            showToast('Quote converted to Invoice successfully!', 'success');
            // Refresh list
            const data = await getQuotes();
            setQuotes(data);
        } catch (error) {
            console.error(error);
            showToast('Failed to convert quote', 'error');
        } finally {
            setConverting(null);
            setConfirmModal({ isOpen: false, id: null });
        }
    };

    const handleSubmitClick = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setSubmitModal({ isOpen: true, id });
    };

    const handleConfirmSubmit = async () => {
        if (!submitModal.id) return;
        const id = submitModal.id;

        setSubmitting(id);
        const previousQuotes = [...quotes];

        try {
            setSubmitModal({ ...submitModal, isOpen: false });

            // Optimistic update
            setQuotes(quotes.map(q =>
                q.id === id ? { ...q, status: 'PENDING' } : q
            ));

            const result = await submitQuoteApproval(id);

            // Update with actual result
            if (result && result.status) {
                setQuotes(quotes.map(q =>
                    q.id === id ? { ...q, status: result.status } : q
                ));
            }
            showToast('Quote submitted for approval', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to submit quote', 'error');
            setQuotes(previousQuotes);
        } finally {
            setSubmitting(null);
            setSubmitModal({ isOpen: false, id: null });
        }
    };

    return (
        <DashboardLayout>
            <QuoteModal
                isOpen={!!selectedQuoteId}
                onClose={() => setSelectedQuoteId(null)}
                quoteId={selectedQuoteId || 0}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmConvert}
                title="Convert Quote"
                message="Are you sure you want to convert this quote to an Invoice? A new invoice will be created from the quote details."
                confirmText="Convert"
            />

            <ConfirmationModal
                isOpen={submitModal.isOpen}
                onClose={() => setSubmitModal({ ...submitModal, isOpen: false })}
                onConfirm={handleConfirmSubmit}
                title="Submit for Approval"
                message={`Are you sure you want to submit quote #${submitModal.id} for approval?`}
                confirmText="Submit"
                isLoading={submitting === submitModal.id}
            />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
                    <p className="text-gray-500">Manage client proposals and estimates</p>
                </div>
                <Link href="/quotes/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                    <Plus size={20} />
                    New Quote
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : quotes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No quotes yet</h3>
                    <p className="text-gray-500 mb-4">Create your first quote to send to a client.</p>
                    <Link href="/quotes/create" className="text-blue-600 font-bold hover:underline">
                        Create Quote
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Valid Until</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {quotes.map((quote) => (
                                <tr
                                    key={quote.id}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedQuoteId(quote.id)}
                                >
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{quote.id}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{quote.client_name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(quote.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(quote.valid_until).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(quote.total_amount, user?.company?.currency)}</td>
                                    <td className="px-6 py-4">
                                        <ApprovalStatus status={quote.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                                        {quote.status === 'DRAFT' && (
                                            <button
                                                onClick={(e) => handleSubmitClick(quote.id, e)}
                                                disabled={submitting === quote.id}
                                                className="text-blue-600 hover:text-blue-800 p-2 disabled:opacity-50"
                                                title="Submit for Approval"
                                            >
                                                {submitting === quote.id ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                            </button>
                                        )}

                                        {(quote.status === 'APPROVED' || quote.status === 'SENT') && quote.status !== 'CONVERTED' && (
                                            <button
                                                onClick={(e) => handleConvertClick(quote.id, e)}
                                                disabled={converting === quote.id}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 justify-end"
                                            >
                                                {converting === quote.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <RefreshCw size={16} /> Convert
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        {quote.status === 'CONVERTED' && (
                                            <span className="text-gray-400 text-sm flex items-center justify-end gap-1">
                                                <CheckCircle size={16} /> Converted
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </DashboardLayout>
    );
}
