'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../app/dashboard-layout';
import { getSuppliers, createPurchase, uploadPurchaseAttachment } from '../../../services/api';
import { ArrowLeft, Save, Plus, Trash, Upload, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';

export default function CreateBillPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useNotification();

    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Form State
    const [vendorId, setVendorId] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const [items, setItems] = useState([
        { description: '', quantity: 1, unit_price: 0 }
    ]);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const data = await getSuppliers();
                setSuppliers(data);
            } catch (error) {
                console.error(error);
            } finally {
                setPageLoading(false);
            }
        };
        fetchSuppliers();
    }, []);

    const handleAddItem = () => {
        setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length > 1) {
            const newItems = [...items];
            newItems.splice(index, 1);
            setItems(newItems);
        }
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vendorId) {
            showToast('Please select a vendor', 'error');
            return;
        }
        if (items.some(i => !i.description || i.quantity <= 0 || i.unit_price < 0)) {
            showToast('Please check item details', 'error');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Purchase Order (Bill)
            const vendor = suppliers.find(s => s.id === parseInt(vendorId));
            const payload = {
                vendor_id: parseInt(vendorId),
                vendor_name: vendor?.name || '',
                project_name: `Bill ${invoiceNumber || ''} - ${vendor?.name}`, // Auto-generate title
                expected_date: date, // Using expected date as bill date roughly
                notes: notes,
                document_type: 'BILL',
                vendor_invoice_number: invoiceNumber,
                items: items.map(item => ({
                    description: item.description,
                    quantity: parseFloat(item.quantity.toString()),
                    unit_price: parseFloat(item.unit_price.toString())
                }))
            };

            const response = await createPurchase(payload);

            // 2. Upload Attachment if exists
            if (file && response && response.id) {
                await uploadPurchaseAttachment(response.id, file);
            }

            showToast('Bill recorded successfully', 'success');
            router.push('/bills');
        } catch (error) {
            console.error('Failed to create bill', error);
            showToast('Failed to record bill. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <DashboardLayout><div className="p-12 text-center">Loading...</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/bills" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Record Vendor Bill</h1>
                        <p className="text-gray-500">Record a new invoice received from a supplier or contractor</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Main Info */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor / Contractor</label>
                                <select
                                    value={vendorId}
                                    onChange={(e) => setVendorId(e.target.value)}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                >
                                    <option value="">Select Vendor...</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                                <input
                                    type="text"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. INV-2023-001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (Invoice Photo/PDF)</label>
                                <div className="border border-dashed border-gray-300 rounded-lg p-2.5 bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
                                    <input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                        accept="image/*,.pdf"
                                    />
                                    <div className="flex items-center gap-2 text-gray-500 justify-center">
                                        <Upload size={18} />
                                        <span className="text-sm truncate">{file ? file.name : "Click to upload photo or PDF"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20"
                                placeholder="Additional details..."
                            />
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900">Line Items</h3>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                            >
                                <Plus size={16} /> Add Item
                            </button>
                        </div>

                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={index} className="flex gap-4 items-start bg-gray-50 p-3 rounded-lg group">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Description / Service"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            className="w-full p-2 border border-gray-200 rounded bg-white text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="w-24">
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="Qty"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                                            className="w-full p-2 border border-gray-200 rounded bg-white text-sm text-center"
                                            required
                                        />
                                    </div>
                                    <div className="w-32">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Price"
                                            value={item.unit_price}
                                            onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                                            className="w-full p-2 border border-gray-200 rounded bg-white text-sm text-right"
                                            required
                                        />
                                    </div>
                                    <div className="w-32 py-2 text-right font-medium text-gray-700 text-sm">
                                        {(item.quantity * item.unit_price).toFixed(2)}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Trash size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end items-center gap-4 pt-4 border-t border-gray-100">
                            <span className="text-gray-500 font-medium">Total Amount</span>
                            <span className="text-xl font-bold text-gray-900">
                                {items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString('fr-FR', { style: 'currency', currency: user?.company?.currency || 'USD' })}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href="/bills" className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/20"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Record Bill
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
