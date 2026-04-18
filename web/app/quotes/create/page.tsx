'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';
import DashboardLayout from '../../dashboard-layout';
import { createQuote, getCustomers } from '../../../services/api';
import { ArrowLeft, Plus, Trash2, Loader2, FileText } from 'lucide-react';
import Link from 'next/link';

export default function CreateQuotePage() {
    const router = useRouter();
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [dates, setDates] = useState({
        date: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +14 days default
    });

    const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const data = await getCustomers();
                setCustomers(data);
            } catch (error) {
                console.error("Failed to fetch customers", error);
            }
        };
        fetchCustomers();
    }, []);

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        // @ts-ignore
        newItems[index][field] = value;
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const customer = customers.find(c => c.id.toString() === selectedCustomer);
        if (!customer) {
            showToast('Please select a customer', 'error');
            setLoading(false);
            return;
        }

        try {
            await createQuote({
                client_name: customer.name,
                client_email: customer.email,
                customer_id: customer.id,
                date: dates.date,
                valid_until: dates.valid_until,
                items: items
            });
            showToast('Quote created successfully', 'success');
            router.push('/quotes');
        } catch (error) {
            console.error(error);
            showToast('Failed to create quote', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/quotes" className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <FileText size={20} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">New Quote</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
                {/* Client Details */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Client & Dates</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                            <select
                                required
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                            >
                                <option value="">Select a customer...</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quote Date</label>
                            <input
                                type="date"
                                required
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={dates.date}
                                onChange={(e) => setDates({ ...dates, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                            <input
                                type="date"
                                required
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={dates.valid_until}
                                onChange={(e) => setDates({ ...dates, valid_until: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Items</h2>
                        <button type="button" onClick={addItem} className="text-blue-600 font-medium text-sm flex items-center gap-1 hover:underline">
                            <Plus size={16} /> Add Item
                        </button>
                    </div>

                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                        value={item.description}
                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                        value={item.unit_price}
                                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="pt-6">
                                    {items.length > 1 && (
                                        <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-2">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                        <div className="text-right">
                            <p className="text-gray-500 text-sm">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900">${calculateTotal().toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link href="/quotes" className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin h-5 w-5" />}
                        Create Quote
                    </button>
                </div>
            </form>
        </DashboardLayout>
    );
}
