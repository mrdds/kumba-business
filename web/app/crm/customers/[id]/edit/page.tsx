'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getCustomer, updateCustomer } from '@/services/api';
import { useNotification } from '@/context/NotificationContext';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import DashboardLayout from '@/app/dashboard-layout';
import Link from 'next/link';

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    const router = useRouter();
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        tax_id: ''
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const data = await getCustomer(parseInt(id));
            setForm({
                name: data.name,
                email: data.email || '',
                phone: data.phone || '',
                address: data.address || '',
                tax_id: data.tax_id || ''
            });
        } catch (error) {
            console.error('Failed to load customer', error);
            showToast('Failed to load customer data', 'error');
            router.push('/crm/customers');
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.name) {
            showToast('Name is required', 'error');
            return;
        }

        setLoading(true);
        try {
            await updateCustomer(parseInt(id), form);
            showToast('Customer updated successfully', 'success');
            router.push(`/crm/customers/${id}`);
        } catch (error) {
            console.error(error);
            showToast('Failed to update customer', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <DashboardLayout>
            <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.back()} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">Edit Customer</h1>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                            <input
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Acme Corp"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                                <input
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    placeholder="contact@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                                <input
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tax ID / NCC</label>
                            <input
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                                value={form.tax_id}
                                onChange={e => setForm({ ...form, tax_id: e.target.value })}
                                placeholder="Tax Identification Number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                            <textarea
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition h-32"
                                value={form.address}
                                onChange={e => setForm({ ...form, address: e.target.value })}
                                placeholder="Full Address"
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center disabled:opacity-50"
                            >
                                <Save size={20} className="mr-2" />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
