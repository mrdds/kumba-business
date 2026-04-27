'use client';
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';
import { ArrowLeft, Save, Trash2, Plus } from 'lucide-react';
import { getSuppliers, getPurchase, updatePurchase, submitPurchaseApproval } from '@/services/api';
import DashboardLayout from '@/app/dashboard-layout';

interface Supplier {
    id: number;
    name: string;
}

export default function EditPurchaseOrder({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    const router = useRouter();
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [vendors, setVendors] = useState<Supplier[]>([]);

    const [form, setForm] = useState({
        vendor_id: null as number | null,
        vendor_name: '',
        project_name: '',
        expected_date: '',
        items: [] as any[],
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [vendorsData, poData] = await Promise.all([
                getSuppliers(),
                getPurchase(parseInt(id))
            ]);
            setVendors(vendorsData);

            // Redirect if not draft
            if (poData.status !== 'DRAFT') {
                showToast('Only draft orders can be edited', 'error');
                router.push(`/purchases/${id}`);
                return;
            }

            // Populate form
            setForm({
                vendor_id: poData.vendor_id, // backend should ensure this exists or we derive it
                vendor_name: poData.vendor_name,
                project_name: poData.project_name,
                expected_date: poData.expected_date || '',
                items: poData.items.map((i: any) => ({
                    description: i.description,
                    quantity: i.quantity.toString(),
                    unit_price: i.unit_price.toString()
                })),
                notes: poData.notes || ''
            });
        } catch (error) {
            console.error('Failed to load data', error);
            showToast('Failed to load purchase order', 'error');
            router.push('/purchases');
        } finally {
            setFetching(false);
        }
    };

    const addItem = () => {
        setForm(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: '1', unit_price: '0' }]
        }));
    };

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...form.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setForm({ ...form, items: newItems });
    };

    const removeItem = (index: number) => {
        if (form.items.length === 1) return;
        const newItems = form.items.filter((_, i) => i !== index);
        setForm({ ...form, items: newItems });
    };

    const handleSubmit = async () => {
        if (!form.project_name) {
            showToast('Project Name is required', 'error');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                vendor_id: form.vendor_id, // keep existing unless we add vendor picker logic here
                project_name: form.project_name,
                expected_date: form.expected_date || null,
                notes: form.notes,
                items: form.items.map(item => ({
                    description: item.description,
                    quantity: parseFloat(item.quantity) || 0,
                    unit_price: parseFloat(item.unit_price) || 0
                }))
            };

            await updatePurchase(parseInt(id), payload);
            
            // Re-submit for approval after rectification
            await submitPurchaseApproval(parseInt(id));
            
            showToast('Bon de commande rectifié et renvoyé pour approbation', 'success');
            router.push(`/purchases/${id}`);
        } catch (error) {
            console.error(error);
            showToast('Failed to update Purchase Order', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8 text-center text-gray-500">Loading Order...</div>;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-indigo-600 p-6 flex items-center text-white">
                    <button onClick={() => router.back()} className="mr-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold">Edit Purchase Order #{id}</h1>
                </div>

                <div className="p-8">
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">Vendor</label>
                            <div className="w-full bg-gray-100 p-4 rounded-xl border border-gray-200 text-gray-500 font-medium">
                                {form.vendor_name}
                            </div>
                            <p className="text-xs text-indigo-500 mt-2 ml-1">Vendor cannot be changed in edit mode.</p>
                        </div>
                        <div>
                            <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">Project Name</label>
                            <input
                                className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:border-indigo-500 transition"
                                value={form.project_name}
                                onChange={e => setForm({ ...form, project_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">Expected Date</label>
                            <input
                                type="date"
                                className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:border-indigo-500 transition"
                                value={form.expected_date}
                                onChange={e => setForm({ ...form, expected_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">Notes</label>
                            <input
                                className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:border-indigo-500 transition"
                                placeholder="Optional notes"
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Items</h2>
                            <button onClick={addItem} className="flex items-center px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 font-bold hover:bg-indigo-100 transition">
                                <Plus size={16} className="mr-1" />
                                Add Item
                            </button>
                        </div>

                        {form.items.map((item, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-3 flex flex-wrap gap-4 items-end">
                                <div className="flex-grow min-w-[200px]">
                                    <label className="text-xs font-bold text-gray-400 mb-1 block">Description</label>
                                    <input
                                        className="w-full bg-white p-3 rounded-lg border border-gray-200 font-medium"
                                        value={item.description}
                                        onChange={e => updateItem(index, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs font-bold text-gray-400 mb-1 block">Qty</label>
                                    <input
                                        className="w-full bg-white p-3 rounded-lg border border-gray-200 font-bold text-center"
                                        type="number"
                                        value={item.quantity}
                                        onChange={e => updateItem(index, 'quantity', e.target.value)}
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="text-xs font-bold text-gray-400 mb-1 block">Unit Price</label>
                                    <input
                                        className="w-full bg-white p-3 rounded-lg border border-gray-200 font-bold text-center"
                                        type="number"
                                        value={item.unit_price}
                                        onChange={e => updateItem(index, 'unit_price', e.target.value)}
                                    />
                                </div>
                                <button onClick={() => removeItem(index)} className="pb-3 text-red-500 hover:text-red-700">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-indigo-600 py-4 rounded-xl text-white font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex justify-center items-center"
                        >
                            <Save size={20} className="mr-2" />
                            {loading ? 'Action en cours...' : 'Rectifier & Renvoyer'}
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
