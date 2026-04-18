'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../app/dashboard-layout';
import { createSupplier } from '../../../../services/api';
import { useNotification } from '@/context/NotificationContext';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateSupplierPage() {
    const router = useRouter();
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        tax_id: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createSupplier(formData);
            showToast('Supplier created successfully!', 'success');
            router.push('/crm/suppliers');
        } catch (error) {
            console.error(error);
            showToast('Failed to create supplier', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/crm/suppliers" className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Add Supplier</h1>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier / Contractor Name</label>
                        <input
                            type="text"
                            required
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="tel"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID / NINEA</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formData.tax_id}
                            onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
                    <Link href="/crm/suppliers" className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Save size={18} />}
                        Save Supplier
                    </button>
                </div>
            </form>
        </DashboardLayout>
    );
}
