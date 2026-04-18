'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '../dashboard-layout';
import { getInvoices, sendInvoiceEmail, submitInvoiceApproval } from '../../services/api'; // Added submitInvoiceApproval
import { Plus, FileText, Mail, Loader2, Send } from 'lucide-react'; // Added MessageSquare
import Link from 'next/link';
import ConfirmationModal from '@/components/ConfirmationModal';
import { formatCurrency } from '@/utils/formatCurrency';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import ApprovalStatus from '@/components/ApprovalStatus';


export default function InvoicesPage() {
    const { user } = useAuth();
    const { showToast } = useNotification();

    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingId, setSendingId] = useState<number | null>(null);
    const [submittingId, setSubmittingId] = useState<number | null>(null); // State for submission

    // Send Email Modal
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, id: number | null, email: string }>({ isOpen: false, id: null, email: '' });

    // Submit Approval Modal
    const [submitModal, setSubmitModal] = useState<{ isOpen: boolean, id: number | null }>({ isOpen: false, id: null });



    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const data = await getInvoices();
                setInvoices(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    const handleSendClick = (id: number, email: string) => {
        setConfirmModal({ isOpen: true, id, email });
    };

    const handleConfirmSend = async () => {
        if (!confirmModal.id) return;
        const id = confirmModal.id;

        setSendingId(id);
        setConfirmModal({ ...confirmModal, isOpen: false });

        try {
            await sendInvoiceEmail(id);
            showToast('Email sent successfully!', 'success');
        } catch (e) {
            console.error(e);
            showToast('Failed to send email.', 'error');
        } finally {
            setSendingId(null);
            setConfirmModal({ isOpen: false, id: null, email: '' });
        }
    };

    const handleSubmitClick = (id: number) => {
        setSubmitModal({ isOpen: true, id });
    };

    const handleConfirmSubmit = async () => {
        if (!submitModal.id) return;
        const id = submitModal.id;

        setSubmittingId(id);
        const previousInvoices = [...invoices]; // Optimistic update backup

        try {
            setSubmitModal({ ...submitModal, isOpen: false });

            // Optimistic update
            setInvoices(invoices.map(inv =>
                inv.id === id ? { ...inv, status: 'PENDING' } : inv
            ));

            const result = await submitInvoiceApproval(id);

            // Update with actual result
            if (result && result.status) {
                setInvoices(invoices.map(inv =>
                    inv.id === id ? { ...inv, status: result.status } : inv
                ));
            }
            showToast('Invoice submitted for approval', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to submit invoice', 'error');
            setInvoices(previousInvoices); // Revert on failure
        } finally {
            setSubmittingId(null);
            setSubmitModal({ isOpen: false, id: null });
        }
    };

    return (
        <DashboardLayout>
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmSend}
                title="Send Invoice"
                message={`Are you sure you want to send invoice #${confirmModal.id} to ${confirmModal.email}?`}
                confirmText="Send Email"
                isLoading={sendingId === confirmModal.id}
            />

            <ConfirmationModal
                isOpen={submitModal.isOpen}
                onClose={() => setSubmitModal({ ...submitModal, isOpen: false })}
                onConfirm={handleConfirmSubmit}
                title="Submit for Approval"
                message={`Are you sure you want to submit invoice #${submitModal.id} for approval?`}
                confirmText="Submit"
                isLoading={submittingId === submitModal.id}
            />



            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
                <Link href="/invoices/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                    <Plus size={20} />
                    Create Invoice
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Client</th>
                            <th className="p-4 font-semibold text-gray-600">Date</th>
                            <th className="p-4 font-semibold text-gray-600">Amount</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                            <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-5">
                        {invoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <div className="font-medium text-gray-900">{invoice.client_name}</div>
                                    <div className="text-sm text-gray-500">{invoice.client_email}</div>
                                </td>
                                <td className="p-4 text-gray-600">{invoice.date}</td>
                                <td className="p-4">
                                    <div className="font-medium text-gray-900">{formatCurrency(invoice.total_amount, user?.company?.currency)}</div>
                                    {(invoice.status === 'PARTIAL' || (invoice.total_paid > 0 && invoice.balance_due > 0)) && (
                                        <div className="text-xs text-orange-600 mt-1">
                                            Due: {formatCurrency(invoice.balance_due, user?.company?.currency)}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <ApprovalStatus status={invoice.status} />
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    {invoice.status === 'DRAFT' && (
                                        <button
                                            onClick={() => handleSubmitClick(invoice.id)}
                                            disabled={submittingId === invoice.id}
                                            className="text-blue-600 hover:text-blue-800 p-2 disabled:opacity-50"
                                            title="Submit for Approval"
                                        >
                                            {submittingId === invoice.id ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                        </button>
                                    )}

                                    <Link
                                        href={`/invoices/${invoice.id}/print`}
                                        target="_blank"
                                        className="text-gray-500 hover:text-blue-600 p-2"
                                        title="Print PDF"
                                    >
                                        <FileText size={18} />
                                    </Link>

                                    {(invoice.status === 'APPROVED' || invoice.status === 'SENT' || invoice.status === 'PAID') && (
                                        <button
                                            onClick={() => handleSendClick(invoice.id, invoice.client_email)}
                                            disabled={sendingId === invoice.id}
                                            className="text-gray-500 hover:text-green-600 p-2 disabled:opacity-50"
                                            title="Send Email"
                                        >
                                            {sendingId === invoice.id ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {invoices.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    No invoices found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}
