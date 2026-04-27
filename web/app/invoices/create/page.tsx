'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '../../dashboard-layout';
import { createInvoice, submitToApproval } from '@/services/finance.service';
import { getCustomers } from '@/services/crm.service';
import { Trash2, Loader2, Plus, ArrowLeft, Send, Save, Info, User } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/utils/formatCurrency';
import { useTranslation } from 'react-i18next';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';

export default function CreateInvoicePage() {
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useNotification();
    const { t } = useTranslation();

    const { data: customers } = useApiQuery(getCustomers, [user?.id], { initialData: [] });
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);

    const { mutate: handleCreate, loading } = useApiMutation(async (submitImmediate: boolean) => {
        const customer = (customers || []).find((c: any) => c.id.toString() === selectedCustomerId);
        if (!customer) throw new Error('Veuillez sélectionner un client');

        const today = new Date().toISOString().split('T')[0];
        const invoiceData = {
            customer_id: customer.id,
            client_name: customer.name,
            client_email: customer.email,
            date: today,
            due_date: today,
            items: items.map(i => ({ ...i, amount: i.quantity * i.unit_price })),
            total_amount: items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0),
            status: 'DRAFT'
        };

        const result = await createInvoice(invoiceData);
        
        if (submitImmediate && result?.id) {
            await submitToApproval('invoice', result.id);
            showToast('Facture créée et soumise pour approbation', 'success');
        } else {
            showToast('Facture enregistrée comme brouillon', 'success');
        }

        router.push('/invoices');
    });

    const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
    const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
    const updateItem = (idx: number, field: string, val: any) => {
        const next = [...items];
        (next[idx] as any)[field] = val;
        setItems(next);
    };

    const total = useMemo(() => items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0), [items]);

    return (
        <DashboardLayout>
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => router.back()}
                    className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <ArrowLeft size={20} className="text-gray-500" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">Nouvelle Facture</h1>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Édition en cours</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Client Section */}
                    <Section title="Détails du Client" icon={<User size={18} />}>
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">Client Débiteur</label>
                            <select
                                required
                                className="w-full h-14 px-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-bold text-gray-900"
                                value={selectedCustomerId}
                                onChange={(e) => setSelectedCustomerId(e.target.value)}
                            >
                                <option value="">Choisir un client...</option>
                                {(customers || []).map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
                                ))}
                            </select>
                            <div className="flex justify-end pt-2">
                                <Link href="/crm/customers/create" className="text-xs font-black text-blue-600 hover:underline uppercase tracking-tight">
                                    + Ajouter un nouveau client
                                </Link>
                            </div>
                        </div>
                    </Section>

                    {/* Items Section */}
                    <Section 
                        title="Articles & Services" 
                        icon={<Plus size={18} />}
                        action={<button type="button" onClick={addItem} className="text-xs font-black text-blue-600 uppercase tracking-widest">+ Ajouter</button>}
                    >
                        <div className="space-y-4">
                            {items.map((item, i) => (
                                <div key={i} className="flex flex-col md:flex-row gap-4 p-5 bg-gray-50/50 rounded-3xl border border-gray-50 group relative">
                                    <div className="flex-1 space-y-2">
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">Description</label>
                                        <input
                                            type="text" placeholder="Design UX, Consultant Senior..."
                                            className="w-full bg-transparent font-bold text-gray-900 outline-none"
                                            value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:w-20 space-y-2">
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">Qté</label>
                                        <input
                                            type="number" min="1"
                                            className="w-full bg-transparent font-bold text-gray-900 outline-none"
                                            value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="md:w-40 space-y-2">
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">Prix Unit.</label>
                                        <input
                                            type="number" min="0" step="0.01"
                                            className="w-full bg-transparent font-bold text-gray-900 outline-none"
                                            value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="md:w-32 space-y-2 text-right">
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">Total</label>
                                        <p className="font-black text-blue-600">{formatCurrency(item.quantity * item.unit_price, user?.company?.currency)}</p>
                                    </div>
                                    {items.length > 1 && (
                                        <button 
                                            onClick={() => removeItem(i)}
                                            className="absolute -right-2 -top-2 h-8 w-8 bg-white shadow-md rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>
                </div>

                {/* Sidebar Sticky Summary */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 sticky top-8">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                            <h3 className="font-black text-gray-900 tracking-tight">Récapitulatif</h3>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-gray-400">Total HT</span>
                                <span className="text-gray-900">{formatCurrency(total, user?.company?.currency)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-gray-400">TVA (18%)</span>
                                <span className="text-gray-900">{formatCurrency(total * 0.18, user?.company?.currency)}</span>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                                <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Net à Payer</span>
                                <span className="text-xl font-black text-gray-900 tracking-tighter">{formatCurrency(total * 1.18, user?.company?.currency)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleCreate(true)}
                                disabled={loading || !selectedCustomerId}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-900/10 flex items-center justify-center gap-2 disabled:opacity-30"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <><Send size={16} /> Soumettre pour Approbation</>}
                            </button>
                            <button
                                onClick={() => handleCreate(false)}
                                disabled={loading || !selectedCustomerId}
                                className="w-full py-4 bg-white border border-gray-100 text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={16} className="opacity-40" /> Enregistrer Brouillon
                            </button>
                        </div>

                        <div className="mt-8 p-4 bg-amber-50 rounded-2xl flex gap-3">
                            <Info size={16} className="text-amber-500 shrink-0" />
                            <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase tracking-tighter">
                                Une fois soumise, la facture entrera dans le circuit de validation Manager ➔ Finance ➔ DGI.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function Section({ title, icon, action, children }: any) {
    return (
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100">
                        {icon}
                    </div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase">{title}</h2>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}
