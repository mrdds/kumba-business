import React, { useEffect, useState } from 'react';
import { X, Loader2, Calendar, FileText, CheckCircle, XCircle, Paperclip } from 'lucide-react';
import { getPurchase } from '@/services/api';
import { formatCurrency } from '@/utils/formatCurrency';
import ApprovalStatus from '@/components/ApprovalStatus';
import { useAuth } from '@/context/AuthContext';

interface PurchaseOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    purchaseId: number;
    approvalRequestId: number;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
}

export default function PurchaseOrderModal({
    isOpen,
    onClose,
    purchaseId,
    approvalRequestId,
    onApprove,
    onReject
}: PurchaseOrderModalProps) {
    const { user } = useAuth();
    const [po, setPo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && purchaseId) {
            setLoading(true);
            setError('');
            fetchPO();
        } else {
            setPo(null);
        }
    }, [isOpen, purchaseId]);

    const fetchPO = async () => {
        try {
            const data = await getPurchase(purchaseId);
            setPo(data);
        } catch (err) {
            console.error('Failed to fetch PO details', err);
            setError('Failed to load purchase order details.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            {po ? (po.document_type === 'BILL' ? 'Vendor Bill' : 'Purchase Order') : 'Purchase Order'} #{purchaseId}
                            {po && <ApprovalStatus status={po.status} />}
                        </h2>
                        {po && <p className="text-gray-500 text-sm mt-1">{po.project_name}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500 hover:text-gray-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <Loader2 className="animate-spin mb-3" size={32} />
                            <p>Loading details...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center text-gray-500 py-12">
                            <XCircle className="mx-auto mb-3 text-red-400" size={48} />
                            <p>{error}</p>
                            <button onClick={fetchPO} className="mt-4 text-blue-600 hover:underline">Try Again</button>
                        </div>
                    ) : po ? (
                        <div className="space-y-8">
                            {/* Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Vendor</h3>
                                    <p className="font-bold text-gray-900 text-lg">{po.vendor_name}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Date Created</h3>
                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                        <Calendar size={14} /> {po.date}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Expected Date</h3>
                                    <p className="font-medium text-gray-900">{po.expected_date || 'N/A'}</p>
                                </div>
                                {po.attachment && (
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Attachment</h3>
                                        <a
                                            href={po.attachment}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            <Paperclip size={16} /> View Document
                                        </a>
                                    </div>
                                )}
                                {po.notes && (
                                    <div className="col-span-1 md:col-span-3 pt-4 border-t border-gray-200/50">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Notes</h3>
                                        <p className="text-gray-600 italic">{po.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Items Table */}
                            <div>
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText size={18} /> Items
                                </h3>
                                <div className="border border-gray-100 rounded-xl overflow-hidden">
                                    <table className="w-full text-left bg-white">
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
                                                <tr key={item.id} className="hover:bg-gray-50/50">
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
                    ) : null}
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between items-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-medium transition shadow-sm"
                    >
                        Close
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={() => onReject(approvalRequestId)}
                            className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-medium transition flex items-center gap-2"
                        >
                            <XCircle size={18} />
                            Reject
                        </button>
                        <button
                            onClick={() => onApprove(approvalRequestId)}
                            className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition flex items-center gap-2 shadow-lg shadow-green-600/20"
                        >
                            <CheckCircle size={18} />
                            Approve
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
