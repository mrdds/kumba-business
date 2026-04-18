'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { getCustomer, deleteCustomer } from '@/services/api';
import { Loader2, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '@/app/dashboard-layout';
import Link from 'next/link';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    const { user } = useAuth();
    const router = useRouter();
    const { showToast } = useNotification();
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (user && id) {
            fetchCustomer();
        }
    }, [user, id]);

    const fetchCustomer = async () => {
        try {
            const data = await getCustomer(parseInt(id));
            setCustomer(data);
        } catch (error) {
            console.error('Failed to fetch customer', error);
            console.error('Failed to fetch customer', error);
            // Removing alert on load failure, just redirect or show error UI in future
            router.push('/crm/customers');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteCustomer(parseInt(id));
            setShowDeleteModal(false);
            showToast('Customer deleted successfully', 'success');
            router.push('/crm/customers');
        } catch (error) {
            console.error('Failed to delete customer', error);
            showToast('Failed to delete customer', 'error');
            setShowDeleteModal(false);
        } finally {
            setDeleting(false);
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

    if (!customer) return null;

    return (
        <DashboardLayout>
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Customer"
                message="Are you sure you want to delete this customer? This action cannot be undone."
                confirmText="Delete"
                isDanger={true}
                isLoading={deleting}
            />

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/crm/customers" className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                            <p className="text-gray-500">Customer Profile</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={`/crm/customers/${id}/edit`}
                            className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            <Edit size={16} className="mr-2" />
                            Edit
                        </Link>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            disabled={deleting}
                            className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium disabled:opacity-50"
                        >
                            {deleting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Trash2 size={16} className="mr-2" />}
                            Delete
                        </button>
                    </div>
                </div>

                {/* Details Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Contact Info</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500">Email</label>
                                    <p className="font-medium text-gray-900">{customer.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Phone</label>
                                    <p className="font-medium text-gray-900">{customer.phone || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Billing Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500">Tax ID / NCC</label>
                                    <p className="font-medium text-gray-900">{customer.tax_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Address</label>
                                    <p className="font-medium text-gray-900 whitespace-pre-wrap">{customer.address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
