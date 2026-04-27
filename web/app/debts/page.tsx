'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../dashboard-layout';
import { getDebts, payDebt, createDebt, getCustomers, getSuppliers, createCustomer, createSupplier } from '../../services/api';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Loader2, Plus, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface Debt {
    id: number;
    type: 'SUPPLIER' | 'CLIENT';
    counterparty_name: string;
    amount: number;
    paid_amount: number;
    due_date: string;
    description: string;
    status: 'PAID' | 'PARTIAL' | 'PENDING';
}

interface Contact {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone: string;
}

export default function DebtsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { showToast } = useNotification();
    const [activeTab, setActiveTab] = useState('SUPPLIER'); // 'SUPPLIER' | 'CLIENT'
    const [debts, setDebts] = useState<Debt[]>([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState<number | null>(null);

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        counterparty_name: '',
        amount: '',
        due_date: new Date().toISOString().split('T')[0],
        description: ''
    });

    // Searchable Contact State
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                if (activeTab === 'SUPPLIER') {
                    const data = await getSuppliers();
                    setContacts(data);
                } else {
                    const data = await getCustomers();
                    setContacts(data);
                }
            } catch (error) {
                console.error("Failed to fetch contacts", error);
            }
        };

        if (showCreateModal) {
            fetchContacts();
        }
    }, [activeTab, showCreateModal]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, counterparty_name: value });

        if (value.length > 0) {
            const filtered = contacts.filter(c =>
                (c.name || `${c.first_name} ${c.last_name}`).toLowerCase().includes(value.toLowerCase())
            );
            setFilteredContacts(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const selectContact = (name: string) => {
        setFormData({ ...formData, counterparty_name: name });
        setShowSuggestions(false);
    };


    const refreshDebts = async () => {
        try {
            const data = await getDebts(activeTab);
            setDebts(data);
        } catch (error) {
            console.error("Failed to fetch debts", error);
        }
    };

    useEffect(() => {
        let isMounted = true;
        // setPageLoading(true); // Assuming we use a different state for initial load vs tab switch
        const load = async () => {
            try {
                const data = await getDebts(activeTab);
                if (isMounted) {
                    setDebts(data);
                }
            } catch (error) {
                console.error("Failed to fetch debts", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, [activeTab]);

    // Confirm Payment Modal State
    const [confirmPayment, setConfirmPayment] = useState<{ isOpen: boolean; id: number | null; amount: number; }>({
        isOpen: false,
        id: null,
        amount: 0
    });

    const triggerPay = (id: number, amount: number) => {
        setConfirmPayment({ isOpen: true, id, amount });
    };

    const handleConfirmPayment = async (inputVal?: string) => {
        if (!confirmPayment.id || !inputVal) return;
        const payAmount = parseFloat(inputVal);
        if (isNaN(payAmount) || payAmount <= 0) {
            showToast(t('debts.toast.invalid_amount'), 'error');
            return;
        }

        setPaying(confirmPayment.id);
        const id = confirmPayment.id;
        setConfirmPayment({ ...confirmPayment, isOpen: false });

        try {
            await payDebt(id, {
                amount: payAmount,
                date: new Date().toISOString().split('T')[0]
            });
            showToast(t('debts.toast.pay_success'), 'success');
            // Trigger a refresh after payment
            const data = await getDebts(activeTab);
            setDebts(data);
        } catch (error) {
            console.error(error);
            showToast(t('debts.toast.pay_error'), 'error');
        } finally {
            setPaying(null);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const exists = contacts.some(c =>
                (c.name || `${c.first_name} ${c.last_name}`).toLowerCase() === formData.counterparty_name.toLowerCase()
            );

            if (!exists && formData.counterparty_name.trim() !== '') {
                try {
                    const nameParts = formData.counterparty_name.split(' ');
                    const firstName = nameParts[0];
                    const lastName = nameParts.slice(1).join(' ') || '-';

                    if (activeTab === 'SUPPLIER') {
                        await createSupplier({ name: formData.counterparty_name, email: 'pending@example.com', phone: '00000000' });
                    } else {
                        await createCustomer({ first_name: firstName, last_name: lastName, email: 'pending@example.com', phone: '00000000' });
                    }
                    showToast(t('debts.modal_create.auto_contact_success'), 'success');
                } catch (err) {
                    console.warn("Could not auto-create contact", err);
                }
            }

            await createDebt({
                ...formData,
                type: activeTab,
                amount: parseFloat(formData.amount)
            });
            setShowCreateModal(false);
            setFormData({ ...formData, counterparty_name: '', amount: '', description: '' });
            refreshDebts();
            showToast(t('debts.toast.create_success'), 'success');
        } catch (error) {
            console.error(error);
            showToast(t('debts.toast.create_error'), 'error');
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-lg font-bold text-gray-900">{t('debts.title')}</h1>
                    <p className="text-gray-500">{t('debts.subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                    <Plus size={20} />
                    {t('debts.add_btn', { type: activeTab === 'SUPPLIER' ? t('debts.debt') : t('debts.credit') })}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('SUPPLIER')}
                    className={clsx(
                        "px-6 py-3 font-bold text-sm border-b-2 transition-colors",
                        activeTab === 'SUPPLIER' ? "border-red-600 text-red-600 bg-red-50/50" : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    {t('debts.tabs.suppliers')}
                </button>
                <button
                    onClick={() => setActiveTab('CLIENT')}
                    className={clsx(
                        "px-6 py-3 font-bold text-sm border-b-2 transition-colors",
                        activeTab === 'CLIENT' ? "border-green-600 text-green-600 bg-green-50/50" : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    {t('debts.tabs.clients')}
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
                </div>
            ) : debts.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">{t('debts.empty.title')}</h3>
                    <p className="text-gray-500 mt-1">
                        {t('debts.empty.desc', { type: activeTab === 'SUPPLIER' ? t('debts.debt').toLowerCase() : t('debts.credit').toLowerCase() })}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {debts.map((debt) => (
                        <div key={debt.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-xl ${debt.type === 'SUPPLIER' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                        {debt.type === 'SUPPLIER' ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                                    </div>
                                    <span className={clsx(
                                        "px-2.5 py-1 text-[10px] font-black rounded-full tracking-wider uppercase",
                                        debt.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                            debt.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                    )}>
                                        {t(`debts.status.${debt.status.toLowerCase()}`)}
                                    </span>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-1 leading-tight">{debt.counterparty_name}</h3>
                                <p className="text-sm text-gray-500 mb-6 font-medium">
                                    {debt.description ? debt.description : t('debts.card.no_desc')}
                                </p>

                                <div className="space-y-3 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500 font-bold uppercase tracking-wider">{t('debts.card.total')}</span>
                                        <span className="font-bold text-gray-900">{formatCurrency(debt.amount, user?.company?.currency)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500 font-bold uppercase tracking-wider">{t('debts.card.paid')}</span>
                                        <span className="font-bold text-green-600">{formatCurrency(debt.paid_amount, user?.company?.currency)}</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3 flex justify-between text-sm font-black text-gray-900">
                                        <span className="uppercase tracking-tight">{t('debts.card.outstanding')}</span>
                                        <span>{formatCurrency(debt.amount - debt.paid_amount, user?.company?.currency)}</span>
                                    </div>
                                </div>
                            </div>

                            {debt.status !== 'PAID' && (
                                <button
                                    onClick={() => triggerPay(debt.id, debt.amount - debt.paid_amount)}
                                    disabled={paying === debt.id}
                                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 flex justify-center items-center gap-2 transition-transform active:scale-[0.98]"
                                >
                                    {paying === debt.id ? <Loader2 className="animate-spin h-5 w-5" /> : t('debts.card.record_payment')}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-lg font-black text-gray-900 mb-6">
                            {t('debts.modal_create.title', { type: activeTab === 'SUPPLIER' ? t('debts.debt') : t('debts.credit') })}
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-5">
                            <div className="relative">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">{t('debts.modal_create.name_label')}</label>
                                <input
                                    required
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                    value={formData.counterparty_name}
                                    onChange={handleNameChange}
                                    onFocus={() => {
                                        if (formData.counterparty_name) setShowSuggestions(true);
                                    }}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    autoComplete="off"
                                />
                                {showSuggestions && (
                                    <div className="absolute z-10 w-full bg-white border border-gray-100 rounded-xl shadow-xl mt-2 max-h-64 overflow-y-auto border-t-0 p-1">
                                        {filteredContacts.map((contact, idx) => {
                                            const name = contact.name || `${contact.first_name} ${contact.last_name}`;
                                            return (
                                                <div
                                                    key={contact.id || idx}
                                                    className="px-4 py-2.5 hover:bg-blue-50 rounded-lg cursor-pointer text-sm font-bold text-gray-700 transition-colors"
                                                    onMouseDown={() => selectContact(name)}
                                                >
                                                    {name}
                                                </div>
                                            );
                                        })}
                                        {filteredContacts.length === 0 && (
                                            <div
                                                className="px-4 py-2.5 hover:bg-blue-50 rounded-lg cursor-pointer text-sm text-blue-600 font-black flex items-center gap-2 transition-colors"
                                                onMouseDown={() => selectContact(formData.counterparty_name)}
                                            >
                                                <Plus size={16} />
                                                    {t('common.create')} &quot;{formData.counterparty_name}&quot;
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">{t('debts.modal_create.amount_label')}</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">{t('debts.modal_create.date_label')}</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold"
                                        value={formData.due_date}
                                        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">{t('debts.modal_create.desc_label')}</label>
                                <textarea
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    {t('debts.modal_create.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                                >
                                    {t('debts.modal_create.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmPayment.isOpen}
                onClose={() => setConfirmPayment({ ...confirmPayment, isOpen: false })}
                onConfirm={handleConfirmPayment}
                title={t('debts.modal_confirm.title')}
                message={t('debts.modal_confirm.message', { amount: formatCurrency(confirmPayment.amount, user?.company?.currency) })}
                confirmText={t('debts.modal_confirm.confirm')}
                showInput={true}
                initialInputValue={confirmPayment.amount.toString()}
                inputPlaceholder={t('debts.modal_confirm.placeholder')}
            />
        </DashboardLayout>
    );
}
