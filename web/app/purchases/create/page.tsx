'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Plus, Trash2, X, CheckCircle, ChevronDown, Camera } from 'lucide-react';
import { getSuppliers, createSupplier, createPurchase } from '@/services/api';
import { formatCurrency } from '@/utils/formatCurrency';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/app/dashboard-layout';

interface Supplier {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_id?: string;
}

export default function CreatePurchaseOrder() {
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useNotification();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState < Supplier[] > ([]);
    const [showVendorPicker, setShowVendorPicker] = useState(false);
    const [isAddingVendor, setIsAddingVendor] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    // New Vendor Form State
    const [newVendor, setNewVendor] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        tax_id: ''
    });

    const [form, setForm] = useState({
        vendor_id: null as number | null,
        vendor_name: '',
        project_name: '',
        expected_date: '',
        items: [{ description: '', quantity: '1', unit_price: '0' }],
        notes: ''
    });

    const simulateOCR = (file: File) => {
        setIsScanning(true);
        // Simulate a 2.5 second AI analysis
        setTimeout(() => {
            setIsScanning(false);
            showToast('Facture analysée avec succès', 'success');

            // Auto-fill form with mock extracted data
            const mockExtractedItems = [
                { description: 'MacBook Pro 16" M3 Max', quantity: '2', unit_price: '2500000' },
                { description: 'Licences Logiciels (1 an)', quantity: '5', unit_price: '150000' }
            ];

            setForm(prev => ({
                ...prev,
                vendor_name: 'Apple Enterprise CI',
                project_name: 'Renouvellement Parc Informatique',
                items: mockExtractedItems
            }));

            // Check if vendor exists in list to auto-select id, else keep it null so it can be created or left as is
            const existingVendor = vendors.find(v => v.name.toLowerCase().includes('apple'));
            if (existingVendor) {
                setForm(prev => ({ ...prev, vendor_id: existingVendor.id, vendor_name: existingVendor.name }));
            }
        }, 2500);
    };

    const fetchVendors = async () => {
        try {
            const data = await getSuppliers();
            setVendors(data);
        } catch (error) {
            console.error('Failed to fetch vendors', error);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const handleCreateVendor = async () => {
        if (!newVendor.name) {
            showToast(t('purchases.create_page.error_vendor'), 'error');
            return;
        }
        try {
            const created = await createSupplier(newVendor);
            setVendors([...vendors, created]);
            setForm({ ...form, vendor_id: created.id, vendor_name: created.name });
            setIsAddingVendor(false);
            setNewVendor({ name: '', email: '', phone: '', address: '', tax_id: '' });
            setShowVendorPicker(false);
            showToast(t('purchases.create_page.success_vendor'), 'success');
        } catch (error) {
            console.error(error);
            showToast(t('purchases.create_page.error_create_vendor'), 'error');
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

    const calculateTotal = () => {
        return form.items.reduce((acc, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.unit_price) || 0;
            return acc + (qty * price);
        }, 0);
    };

    const handleSubmit = async () => {
        if (!form.vendor_name || !form.project_name) {
            showToast(t('purchases.create_page.error_vendor_project'), 'error');
            return;
        }

        setLoading(true);
        // Removed duplicated setLoading(true)
        try {
            const payload = {
                ...form,
                expected_date: form.expected_date || null,
                items: form.items.map(item => ({
                    ...item,
                    quantity: parseFloat(item.quantity) || 0,
                    unit_price: parseFloat(item.unit_price) || 0
                }))
            };
            console.log('Sending Purchase Payload:', payload);
            await createPurchase(payload);
            showToast(t('purchases.create_page.success', { vendor: form.vendor_name }), 'success');
            router.push('/purchases');
        } catch (error) {
            console.error(error);
            showToast(t('purchases.create_page.error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-indigo-600 p-6 flex items-center text-white">
                    <button onClick={() => router.back()} className="mr-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold">{t('purchases.create_page.title')}</h1>
                </div>

                <div className="p-8">
                    {/* OCR Upload Area */}
                    <div className="mb-8">
                        <div
                            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${isScanning ? 'border-indigo-400 bg-indigo-50/50' : 'border-indigo-100 hover:border-indigo-300 bg-slate-50 hover:bg-slate-50/80 cursor-pointer'
                                }`}
                            onClick={() => {
                                if (isScanning) return;
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*,application/pdf';
                                input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) simulateOCR(file);
                                };
                                input.click();
                            }}
                        >
                            {isScanning ? (
                                <div className="flex flex-col items-center justify-center space-y-4 py-4">
                                    <div className="w-16 h-16 relative">
                                        <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                                        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                                        <Camera size={24} className="absolute inset-0 m-auto text-indigo-600 animate-pulse" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-indigo-900">Analyse IA en cours...</h3>
                                        <p className="text-xs text-indigo-600/70 font-medium">Extraction du fournisseur, montants et articles</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-3 py-4">
                                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <Camera size={28} strokeWidth={2.5} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-slate-800">Scanner une facture (OCR)</h3>
                                        <p className="text-xs text-slate-500">Déposez votre facture (PDF, PNG, JPG) ou cliquez pour parcourir</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* General Info */}
                    <div className="mb-8">
                        <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">{t('purchases.create_page.project_vendor')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Vendor Selector */}
                            <div className="relative">
                                <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">{t('purchases.create_page.vendor')}</label>
                                <button
                                    onClick={() => setShowVendorPicker(!showVendorPicker)}
                                    className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center text-left hover:border-indigo-300 transition"
                                >
                                    <span className={`font-medium ${form.vendor_name ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {form.vendor_name || t('purchases.create_page.select')}
                                    </span>
                                    <ChevronDown size={20} className="text-gray-400" />
                                </button>

                                {/* Vendor Picker Dropdown/Modal */}
                                {showVendorPicker && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-10 max-h-96 overflow-y-auto">
                                        {isAddingVendor ? (
                                            <div className="p-4 bg-gray-50">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="font-bold text-gray-700">{t('purchases.create_page.add_vendor')}</h3>
                                                    <button onClick={() => setIsAddingVendor(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                                                </div>
                                                <input
                                                    className="w-full bg-white p-3 rounded-lg border border-gray-200 mb-3"
                                                    placeholder={t('purchases.create_page.vendor_name')}
                                                    value={newVendor.name}
                                                    onChange={e => setNewVendor({ ...newVendor, name: e.target.value })}
                                                />
                                                <input
                                                    className="w-full bg-white p-3 rounded-lg border border-gray-200 mb-3"
                                                    placeholder={t('purchases.create_page.email')}
                                                    value={newVendor.email}
                                                    onChange={e => setNewVendor({ ...newVendor, email: e.target.value })}
                                                />
                                                <input
                                                    className="w-full bg-white p-3 rounded-lg border border-gray-200 mb-3"
                                                    placeholder={t('purchases.create_page.phone')}
                                                    value={newVendor.phone}
                                                    onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })}
                                                />
                                                <input
                                                    className="w-full bg-white p-3 rounded-lg border border-gray-200 mb-3"
                                                    placeholder={t('purchases.create_page.tax_id')}
                                                    value={newVendor.tax_id}
                                                    onChange={e => setNewVendor({ ...newVendor, tax_id: e.target.value })}
                                                />
                                                <textarea
                                                    className="w-full bg-white p-3 rounded-lg border border-gray-200 mb-3"
                                                    placeholder={t('purchases.create_page.address')}
                                                    value={newVendor.address}
                                                    onChange={e => setNewVendor({ ...newVendor, address: e.target.value })}
                                                />
                                                <button onClick={handleCreateVendor} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700">{t('purchases.create_page.save_vendor')}</button>
                                            </div>
                                        ) : (
                                            <div>
                                                <button
                                                    onClick={() => setIsAddingVendor(true)}
                                                    className="w-full p-4 flex items-center justify-center text-indigo-600 font-bold hover:bg-indigo-50 border-b border-gray-100"
                                                >
                                                    <Plus size={20} className="mr-2" />
                                                    {t('purchases.create_page.add_vendor')}
                                                </button>
                                                {vendors.map(vendor => (
                                                    <button
                                                        key={vendor.id}
                                                        onClick={() => {
                                                            setForm({ ...form, vendor_id: vendor.id, vendor_name: vendor.name });
                                                            setShowVendorPicker(false);
                                                        }}
                                                        className="w-full p-4 text-left hover:bg-gray-50 border-b border-gray-50 flex justify-between items-center"
                                                    >
                                                        <div>
                                                            <div className="font-bold text-gray-900">{vendor.name}</div>
                                                            <div className="text-gray-500 text-xs">{vendor.tax_id ? `NCC: ${vendor.tax_id}` : vendor.email}</div>
                                                        </div>
                                                        {form.vendor_id === vendor.id && <CheckCircle size={20} className="text-indigo-600" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">{t('purchases.create_page.project_name')}</label>
                                <input
                                    className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:border-indigo-500 transition"
                                    placeholder={t('purchases.create_page.project_name_placeholder')}
                                    value={form.project_name}
                                    onChange={e => setForm({ ...form, project_name: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">{t('purchases.create_page.items')}</h2>
                            <button onClick={addItem} className="flex items-center px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 font-bold hover:bg-indigo-100 transition">
                                <Plus size={16} className="mr-1" />
                                {t('purchases.create_page.add_item')}
                            </button>
                        </div>

                        {form.items.map((item, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-3 flex flex-wrap gap-4 items-end">
                                <div className="flex-grow min-w-[200px]">
                                    <label className="text-xs font-bold text-gray-400 mb-1 block">{t('purchases.create_page.desc')}</label>
                                    <input
                                        className="w-full bg-white p-3 rounded-lg border border-gray-200 font-medium"
                                        placeholder={t('purchases.create_page.desc_placeholder')}
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
                                    <label className="text-xs font-bold text-gray-400 mb-1 block">{t('purchases.create_page.price')}</label>
                                    <input
                                        className="w-full bg-white p-3 rounded-lg border border-gray-200 font-bold text-center"
                                        type="number"
                                        value={item.unit_price}
                                        onChange={e => updateItem(index, 'unit_price', e.target.value)}
                                    />
                                </div>
                                <div className="w-32 text-right pb-3">
                                    <span className="text-xl font-bold text-indigo-600">
                                        {formatCurrency(parseFloat(item.quantity || '0') * parseFloat(item.unit_price || '0'), user?.company?.currency)}
                                    </span>
                                </div>
                                <button onClick={() => removeItem(index)} className="pb-3 text-red-500 hover:text-red-700">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-900 p-8 rounded-3xl shadow-xl shadow-indigo-500/10 mb-8 max-w-sm ml-auto">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
                            <span className="text-gray-400 text-sm">{t('purchases.create_page.total_items')}</span>
                            <span className="text-white font-bold">{form.items.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-white text-xl font-bold">{t('purchases.create_page.total')}</span>
                            <span className="text-xl font-bold text-green-400">{formatCurrency(calculateTotal(), user?.company?.currency)}</span>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-indigo-600 py-4 rounded-xl text-white font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                        >
                            {loading ? t('purchases.create_page.creating') : t('purchases.create_page.create_btn')}
                        </button>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );

}
