'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getPurchase, cancelPurchase, submitPurchaseApproval } from '@/services/api';
import { Loader2, ArrowLeft, Edit, XCircle, Send, Paperclip, FileText } from 'lucide-react';
import DashboardLayout from '@/app/dashboard-layout';
import Link from 'next/link';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useNotification } from '@/context/NotificationContext';
import ApprovalStatus from '@/components/ApprovalStatus';
import { formatCurrency } from '@/utils/formatCurrency';

export default function BillDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const { user } = useAuth();
    const { showToast } = useNotification();
    const router = useRouter();
    const [bill, setBill] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Modals
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    useEffect(() => {
        if (user && id) {
            fetchBill();
        }
    }, [user, id]);

    const fetchBill = async () => {
        try {
            const data = await getPurchase(parseInt(id));
            setBill(data);
        } catch (error) {
            console.error('Failed to fetch bill', error);
            showToast('Failed to load bill details', 'error');
            router.push('/bills');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await cancelPurchase(parseInt(id));
            setBill({ ...bill, status: 'CANCELLED' });
            showToast('Bill has been cancelled.', 'success');
            setShowCancelModal(false);
        } catch (error) {
            console.error('Failed to cancel bill', error);
            showToast('Failed to cancel bill', 'error');
            setShowCancelModal(false);
        } finally {
            setCancelling(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const result = await submitPurchaseApproval(parseInt(id));
            setBill({ ...bill, status: result ? result.status : 'PENDING' });
            showToast('Bill submitted for approval.', 'success');
            setShowSubmitModal(false);
        } catch (error) {
            console.error('Failed to submit bill', error);
            showToast('Failed to submit bill for approval', 'error');
            setShowSubmitModal(false);
        } finally {
            setSubmitting(false);
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

    if (!bill) return null;

    return (
        <DashboardLayout>
            <ConfirmationModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancel}
                title="Cancel Bill"
                message="Are you sure you want to CANCEL this bill? This cannot be undone."
                confirmText="Cancel Bill"
                isDanger={true}
                isLoading={cancelling}
            />

            <ConfirmationModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onConfirm={handleSubmit}
                title="Submit for Approval"
                message="Are you sure you want to submit this bill for approval?"
                confirmText="Submit"
                isLoading={submitting}
            />

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/bills" className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Vendor Bill #{bill.id}
                                </h1>
                                <ApprovalStatus status={bill.status} />
                            </div>
                            <p className="text-gray-500">{bill.project_name}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {bill.attachment && (
                            <a
                                href={bill.attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                            >
                                <Paperclip size={16} className="mr-2" />
                                View Invoice
                            </a>
                        )}

                        {bill.status === 'DRAFT' && (
                            <button
                                onClick={() => setShowSubmitModal(true)}
                                disabled={submitting}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Send size={16} className="mr-2" />}
                                Submit for Approval
                            </button>
                        )}

                        {bill.status === 'DRAFT' && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                disabled={cancelling}
                                className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium disabled:opacity-50"
                            >
                                {cancelling ? <Loader2 className="animate-spin mr-2" size={16} /> : <XCircle size={16} className="mr-2" />}
                                Cancel
                            </button>
                        )}
                    </div>
                </div>

                {/* Details Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Vendor</h3>
                                <Link href={`/crm/suppliers/${bill.vendor_id}`} className="font-bold text-blue-600 text-lg hover:underline">
                                    {bill.vendor_name}
                                </Link>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Invoice #</h3>
                                <p className="font-medium text-gray-900">{bill.vendor_invoice_number || 'N/A'}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Date</h3>
                                <p className="font-medium text-gray-900">{bill.date}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Due Date</h3>
                                <p className="font-medium text-gray-900">{bill.expected_date || 'N/A'}</p>
                            </div>
                        </div>
                        {bill.notes && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Notes</h3>
                                <p className="text-gray-600 italic">{bill.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Items List */}
                    <div className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Bill Items</h3>
                        <div className="border rounded-xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="p-4">Description</th>
                                        <th className="p-4 text-center">Qty</th>
                                        <th className="p-4 text-center">Unit Price</th>
                                        <th className="p-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {bill.items.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className="p-4 font-medium text-gray-900">{item.description}</td>
                                            <td className="p-4 text-center text-gray-600">{item.quantity}</td>
                                            <td className="p-4 text-center text-gray-600">{formatCurrency(item.unit_price, user?.company?.currency)}</td>
                                            <td className="p-4 text-right font-bold text-gray-900">{formatCurrency(Number(item.amount || 0), user?.company?.currency)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan={3} className="p-4 text-right font-bold text-gray-900 uppercase text-xs">Total Amount</td>
                                        <td className="p-4 text-right font-bold text-indigo-600 text-lg">{formatCurrency(Number(bill.total_amount || 0), user?.company?.currency)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
