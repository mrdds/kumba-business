'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getPurchase, cancelPurchase, submitPurchaseApproval } from '@/services/api'; // Added submitPurchaseApproval
import { Loader2, ArrowLeft, Edit, XCircle, Send } from 'lucide-react'; // Added Send
import DashboardLayout from '@/app/dashboard-layout';
import Link from 'next/link';
import { use } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useNotification } from '@/context/NotificationContext'; // Added useNotification
import ApprovalStatus from '@/components/ApprovalStatus'; // Added ApprovalStatus
import { formatCurrency } from '@/utils/formatCurrency';

export default function PurchaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    // Correctly unwrap params using React.use()
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const { user } = useAuth();
    const { showToast } = useNotification(); // Added showToast
    const router = useRouter();
    const [po, setPo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [submitting, setSubmitting] = useState(false); // State for submission

    // Modals
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    useEffect(() => {
        if (user && id) {
            fetchPO();
        }
    }, [user, id]);

    const fetchPO = async () => {
        try {
            const data = await getPurchase(parseInt(id));

            // Redirect if it's a Bill
            if (data.document_type === 'BILL') {
                router.replace(`/bills/${id}`);
                return;
            }

            setPo(data);
        } catch (error) {
            console.error('Failed to fetch purchase order', error);
            showToast('Failed to load purchase order', 'error');
            router.push('/purchases');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await cancelPurchase(parseInt(id));
            setPo({ ...po, status: 'CANCELLED' });
            showToast('Purchase Order has been cancelled.', 'success');
            setShowCancelModal(false);
        } catch (error) {
            console.error('Failed to cancel order', error);
            showToast('Failed to cancel order', 'error');
            setShowCancelModal(false);
        } finally {
            setCancelling(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const result = await submitPurchaseApproval(parseInt(id));
            // Update status
            setPo({ ...po, status: result ? result.status : 'PENDING' }); // Fallback to PENDING if auto-approved logic differs
            showToast('Purchase Order submitted for approval.', 'success');
            setShowSubmitModal(false);
        } catch (error) {
            console.error('Failed to submit order', error);
            showToast('Failed to submit order for approval', 'error');
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

    if (!po) return null;

    return (
        <DashboardLayout>
            <ConfirmationModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancel}
                title="Cancel Purchase Order"
                message="Are you sure you want to CANCEL this order? This cannot be undone."
                confirmText="Cancel Order"
                isDanger={true}
                isLoading={cancelling}
            />

            <ConfirmationModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onConfirm={handleSubmit}
                title="Submit for Approval"
                message="Are you sure you want to submit this purchase order for approval?"
                confirmText="Submit"
                isLoading={submitting}
            />

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/purchases" className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Purchase Order #{po.id}
                                </h1>
                                <ApprovalStatus status={po.status} />
                            </div>
                            <p className="text-gray-500">{po.project_name}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {po.status === 'DRAFT' && (
                            <button
                                onClick={() => setShowSubmitModal(true)}
                                disabled={submitting}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Send size={16} className="mr-2" />}
                                Submit for Approval
                            </button>
                        )}

                        {po.status === 'DRAFT' && (
                            <>
                                <Link
                                    href={`/purchases/${id}/edit`}
                                    className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                >
                                    <Edit size={16} className="mr-2" />
                                    Edit
                                </Link>
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    disabled={cancelling}
                                    className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium disabled:opacity-50"
                                >
                                    {cancelling ? <Loader2 className="animate-spin mr-2" size={16} /> : <XCircle size={16} className="mr-2" />}
                                    Cancel Order
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Details Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Vendor</h3>
                                <p className="font-bold text-gray-900 text-lg">{po.vendor_name}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Date Created</h3>
                                <p className="font-medium text-gray-900">{po.date}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Expected Date</h3>
                                <p className="font-medium text-gray-900">{po.expected_date || 'N/A'}</p>
                            </div>
                        </div>
                        {po.notes && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Notes</h3>
                                <p className="text-gray-600 italic">{po.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Items List */}
                    <div className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Items</h3>
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
                                    {po.items.map((item: any) => (
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
                                        <td colSpan={3} className="p-4 text-right font-bold text-gray-900 uppercase text-xs">Total</td>
                                        <td className="p-4 text-right font-bold text-indigo-600 text-lg">{formatCurrency(Number(po.total_amount || 0), user?.company?.currency)}</td>
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
