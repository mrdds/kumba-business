'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '../dashboard-layout';
import { getDebts, payDebt, createDebt, getCustomers, getSuppliers, createCustomer, createSupplier } from '../../services/api'; // Ensure createDebt is exported
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Loader2, Plus, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export default function DebtsPage() {
    const { user } = useAuth();
    const { showToast } = useNotification();
    const [activeTab, setActiveTab] = useState('SUPPLIER'); // 'SUPPLIER' | 'CLIENT'
    const [debts, setDebts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState<number | null>(null);

    // Modal States (Simplified for MVP, ideally separate components)
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        counterparty_name: '',
        amount: '',
        due_date: new Date().toISOString().split('T')[0],
        description: ''
    });

    // Searchable Contact State
    const [contacts, setContacts] = useState<any[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
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

    const fetchDebts = async () => {
        setLoading(true);
        try {
            const data = await getDebts(activeTab);
            setDebts(data);
        } catch (error) {
            console.error("Failed to fetch debts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDebts();
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
            showToast('Invalid payment amount', 'error');
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
            showToast('Payment recorded!', 'success');
            fetchDebts();
        } catch (error) {
            console.error(error);
            showToast('Failed to record payment', 'error');
        } finally {
            setPaying(null);
        }
    };


    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Auto-create contact if it doesn't exist
            const exists = contacts.some(c =>
                (c.name || `${c.first_name} ${c.last_name}`).toLowerCase() === formData.counterparty_name.toLowerCase()
            );

            if (!exists && formData.counterparty_name.trim() !== '') {
                try {
                    const nameParts = formData.counterparty_name.split(' ');
                    const firstName = nameParts[0];
                    const lastName = nameParts.slice(1).join(' ') || '-'; // Fallback last name

                    if (activeTab === 'SUPPLIER') {
                        // Suppliers usually have a single 'name' field or similar, let's check API or assume standard
                        // Assuming createSupplier takes { name: ... }
                        await createSupplier({ name: formData.counterparty_name, email: 'pending@example.com', phone: '00000000' });
                    } else {
                        // Customers usually have first/last
                        await createCustomer({ first_name: firstName, last_name: lastName, email: 'pending@example.com', phone: '00000000' });
                    }
                    showToast('New contact created automatically', 'success');
                } catch (err) {
                    console.warn("Could not auto-create contact", err);
                    // Continue anyway, debt can be created with just the string name
                }
            }

            await createDebt({
                ...formData,
                type: activeTab,
                amount: parseFloat(formData.amount)
            });
            setShowCreateModal(false);
            setFormData({ ...formData, counterparty_name: '', amount: '', description: '' });
            fetchDebts();
            showToast('Debt created successfully!', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to create debt', 'error');
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Debt Management</h1>
                    <p className="text-gray-500">Track what you owe and what is owed to you</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} /> Record {activeTab === 'SUPPLIER' ? 'Debt' : 'Credit'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('SUPPLIER')}
                    className={clsx(
                        "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
                        activeTab === 'SUPPLIER' ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Supplier Debts (I Owe)
                </button>
                <button
                    onClick={() => setActiveTab('CLIENT')}
                    className={clsx(
                        "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
                        activeTab === 'CLIENT' ? "border-green-500 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Client Credits (Owed to Me)
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
                </div>
            ) : debts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No records found</h3>
                    <p className="text-gray-500">You don't have any pending {activeTab === 'SUPPLIER' ? 'debts' : 'credits'}.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {debts.map((debt) => (
                        <div key={debt.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-lg ${debt.type === 'SUPPLIER' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                        {debt.type === 'SUPPLIER' ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${debt.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                        debt.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {debt.status}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{debt.counterparty_name}</h3>
                                <p className="text-sm text-gray-500 mb-4">{debt.description || 'No description'}</p>

                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total Amount</span>
                                        <span className="font-medium">{formatCurrency(debt.amount, user?.company?.currency)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Paid so far</span>
                                        <span className="font-medium text-green-600">{formatCurrency(debt.paid_amount, user?.company?.currency)}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                                        <span>Outstanding</span>
                                        <span>{formatCurrency(debt.amount - debt.paid_amount, user?.company?.currency)}</span>
                                    </div>
                                </div>
                            </div>

                            {debt.status !== 'PAID' && (
                                <button
                                    onClick={() => triggerPay(debt.id, debt.amount - debt.paid_amount)}
                                    disabled={paying === debt.id}
                                    className="w-full py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 flex justify-center items-center gap-2"
                                >
                                    {paying === debt.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'Record Payment'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Record New {activeTab === 'SUPPLIER' ? 'Debt' : 'Credit'}</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name (Person/Company)</label>
                                <input
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    value={formData.counterparty_name}
                                    onChange={handleNameChange}
                                    onFocus={() => {
                                        if (formData.counterparty_name) setShowSuggestions(true);
                                    }}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                                    autoComplete="off"
                                />
                                {showSuggestions && (
                                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                        {filteredContacts.map((contact, idx) => {
                                            const name = contact.name || `${contact.first_name} ${contact.last_name}`;
                                            return (
                                                <div
                                                    key={contact.id || idx}
                                                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                                    onMouseDown={() => selectContact(name)} // onMouseDown fires before onBlur
                                                >
                                                    {name}
                                                </div>
                                            );
                                        })}
                                        {filteredContacts.length === 0 && (
                                            <div
                                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-blue-600 font-medium flex items-center gap-2"
                                                onMouseDown={() => selectContact(formData.counterparty_name)}
                                            >
                                                <Plus size={14} />
                                                Create "{formData.counterparty_name}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    value={formData.due_date}
                                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save
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
                title="Confirm Payment Amount"
                message={`Total Outstanding: ${formatCurrency(confirmPayment.amount, user?.company?.currency)}. Please confirm the amount you are paying now.`}
                confirmText="Record Payment"
                showInput={true}
                initialInputValue={confirmPayment.amount.toString()}
                inputPlaceholder="Enter amount..."
            />
        </DashboardLayout>
    );
}
