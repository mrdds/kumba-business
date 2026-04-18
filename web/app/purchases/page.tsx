'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { getPurchases, deletePurchase } from '@/services/api';
import { Loader2, Plus, Trash2, FileText, Calendar, User } from 'lucide-react';
import DashboardLayout from '@/app/dashboard-layout';
import Link from 'next/link';
import ConfirmationModal from '@/components/ConfirmationModal';
import { formatCurrency } from '@/utils/formatCurrency';

export default function PurchasesPage() {
    const { user } = useAuth();
    const { showToast } = useNotification();
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, id: number | null }>({ isOpen: false, id: null });

    useEffect(() => {
        if (user) {
            fetchPurchases();
        }
    }, [user]);

    const fetchPurchases = async () => {
        try {
            const data = await getPurchases();
            // Filter out Vendor Bills, show only POs
            const pos = data.filter((p: any) => p.document_type !== 'BILL');
            setPurchases(pos);
        } catch (error) {
            console.error('Failed to fetch purchases', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setConfirmModal({ isOpen: true, id });
    };

    const handleConfirmDelete = async () => {
        if (!confirmModal.id) return;
        const id = confirmModal.id;

        setDeletingId(id);
        // Ensure modal is closed
        setConfirmModal({ ...confirmModal, isOpen: false });

        try {
            await deletePurchase(id);
            setPurchases(purchases.filter(p => p.id !== id));
            showToast('Purchase Order deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete purchase', error);
            showToast('Failed to delete purchase order', 'error');
        } finally {
            setDeletingId(null);
            setConfirmModal({ isOpen: false, id: null });
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
                onConfirm={handleConfirmDelete}
                title="Delete Purchase Order"
                message="Are you sure you want to delete this purchase order? This action cannot be undone."
                confirmText="Delete"
                isDanger={true}
            />

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
                    <p className="text-gray-500">Manage procurement and vendor orders</p>
                </div>
                <Link href="/purchases/create" className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
                    <Plus size={20} className="mr-2" />
                    New Order
                </Link>
            </div>

            {purchases.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
                    <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                        <FileText className="text-indigo-600" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Purchase Orders Yet</h3>
                    <p className="text-gray-500 mb-6">Create your first purchase order to track expenses and vendor requests.</p>
                    <Link href="/purchases/create" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
                        <Plus size={20} className="mr-2" />
                        Create Order
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {purchases.map((po) => (
                        <div key={po.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <Link href={`/purchases/${po.id}`} className="flex-grow flex items-start gap-4">
                                <div className="p-3 bg-indigo-50 rounded-lg hidden md:block">
                                    <FileText className="text-indigo-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                        {po.project_name}
                                        <span className="text-xs font-normal text-gray-400">#{po.id}</span>
                                    </h3>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <User size={14} />
                                            {po.vendor_name}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {po.date}
                                        </div>
                                        {po.status === 'SENT' && (
                                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">SENT</span>
                                        )}
                                        {po.status === 'CANCELLED' && (
                                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">CANCELLED</span>
                                        )}
                                        {po.status === 'DRAFT' && (
                                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">DRAFT</span>
                                        )}
                                    </div>
                                </div>
                            </Link>

                            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-gray-100">
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 uppercase font-bold">Total Amount</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(Number(po.total_amount || 0), user?.company?.currency)}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteClick(po.id)}
                                    disabled={deletingId === po.id}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                    title="Delete Order"
                                >
                                    {deletingId === po.id ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
