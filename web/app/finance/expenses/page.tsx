'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/dashboard-layout';
import { Wallet, Plus, Search, Filter, ChevronRight, Receipt, CheckCircle2, XCircle, AlertCircle, MoreVertical, CreditCard, Calendar, Trash2, Edit2, X, Paperclip, FileText, ExternalLink } from 'lucide-react';
import api from '@/services/api';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

export default function ExpensesPage() {
    const { t } = useTranslation();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        category: '',
        document_type: 'RECEIPT',
        payment_method: 'CASH'
    });
    const [attachment, setAttachment] = useState<File | null>(null);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/finance/expenses');
            setExpenses(res.data);
        } catch (err) {
            console.error("Error fetching expenses:", err);
            toast.error("Échec du chargement des dépenses");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (expense = null) => {
        if (expense) {
            setEditingExpense(expense);
            setFormData({
                title: expense.title,
                description: expense.description || '',
                amount: expense.amount.toString(),
                date: expense.date,
                category: expense.category || '',
                document_type: expense.document_type || 'RECEIPT',
                payment_method: expense.payment_method || 'CASH'
            });
        } else {
            setEditingExpense(null);
            setFormData({
                title: '',
                description: '',
                amount: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                category: '',
                document_type: 'RECEIPT',
                payment_method: 'CASH'
            });
        }
        setAttachment(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const form = new FormData();
            
            // Ninja Form expects a JSON string or individual fields
            // The way I set it up in the backend is payload: ExpenseSchema = Form(...)
            // So I should append fields individually
            form.append('title', formData.title);
            form.append('description', formData.description);
            form.append('amount', formData.amount);
            form.append('date', formData.date);
            form.append('category', formData.category);
            form.append('document_type', formData.document_type);
            form.append('payment_method', formData.payment_method);
            
            if (attachment) {
                form.append('attachment', attachment);
            }

            if (editingExpense) {
                await api.put(`/finance/expenses/${editingExpense.id}`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("Dépense mise à jour");
            } else {
                await api.post('/finance/expenses', form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("Dépense enregistrée");
            }
            setIsModalOpen(false);
            fetchExpenses();
        } catch (err) {
            toast.error("Une erreur est survenue");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) return;
        try {
            await api.delete(`/finance/expenses/${id}`);
            toast.success("Dépense supprimée");
            fetchExpenses();
        } catch (err) {
            toast.error("Impossible de supprimer une dépense approuvée");
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'APPROVED': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'PAID': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'CANCELLED': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    const filteredExpenses = expenses.filter(e => 
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalAmount = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-base font-black text-slate-900 tracking-tight">
                            {t('finance.expenses.title')}
                        </h1>
                        <p className="text-slate-500 font-medium">
                            {t('finance.expenses.subtitle')}
                        </p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        {t('finance.expenses.new')}
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <Wallet size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Dépenses</p>
                            <p className="text-base font-black text-slate-900 mt-1">{totalAmount.toLocaleString()} F</p>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                            <Calendar size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ce Mois</p>
                            <p className="text-base font-black text-slate-900 mt-1">{expenses.length} Opérations</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <Receipt size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.pending')}</p>
                            <p className="text-base font-black text-slate-900 mt-1">
                                {expenses.filter(e => e.status === 'PENDING').length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/30">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher une dépense..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-emerald-50/50 focus:border-emerald-200 transition-all outline-none text-sm font-medium"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type / Cat</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Montant</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">PJ</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Statut</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : filteredExpenses.length > 0 ? (
                                    filteredExpenses.map((expense) => (
                                        <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-slate-900">
                                                    {format(new Date(expense.date), 'dd/MM/yyyy')}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-black text-slate-700 group-hover:text-emerald-600 transition-colors">
                                                    {expense.title}
                                                </p>
                                                <p className="text-[10px] text-slate-400 truncate max-w-xs">
                                                    {expense.description || "Pas de détails"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase w-fit">
                                                        {expense.document_type || "REÇU"}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {expense.category || "Général"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-sm font-black text-slate-900">
                                                    {expense.amount.toLocaleString()} F
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-medium flex items-center justify-end gap-1">
                                                    <CreditCard size={10} /> {expense.payment_method}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {expense.attachment_url ? (
                                                    <a 
                                                        href={`${process.env.NEXT_PUBLIC_API_URL}${expense.attachment_url}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex p-1.5 bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg transition-all"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-200"><Paperclip size={14} /></span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={clsx(
                                                    "px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider",
                                                    getStatusStyle(expense.status)
                                                )}>
                                                    {expense.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {expense.status !== 'APPROVED' && expense.status !== 'PAID' && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleOpenModal(expense)}
                                                                className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                                title="Modifier"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(expense.id)}
                                                                className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Wallet size={24} className="text-slate-300" />
                                            </div>
                                            <p className="text-slate-900 font-black tracking-tight">{t('finance.expenses.empty')}</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[95vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="p-8 flex justify-between items-center border-b border-slate-50">
                            <div>
                                <h2 className="text-base font-black text-slate-900">
                                    {editingExpense ? 'Modifier la Dépense' : 'Enregistrer une Dépense'}
                                </h2>
                                <p className="text-slate-500 text-sm font-medium">Sortie de caisse ou paiement direct</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Titre / Objet</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all outline-none"
                                        placeholder="ex: Fournitures bureau"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant (CFA)</label>
                                        <input
                                            required
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                                        <input
                                            required
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all outline-none bg-white"
                                        >
                                            <option value="">Général / Autre</option>
                                            <option value="LOGISTIQUE">Logistique / Transport</option>
                                            <option value="MARKETING">Marketing / Com</option>
                                            <option value="RH">Ressources Humaines</option>
                                            <option value="LOYER">Loyer / Charges</option>
                                            <option value="FOURNITURES">Fournitures bureau</option>
                                            <option value="SALAIRE">Salaires / Primes</option>
                                            <option value="MATERIEL">Matériel / Équipement</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mode de paiement</label>
                                        <select
                                            value={formData.payment_method}
                                            onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all outline-none bg-white"
                                        >
                                            <option value="CASH">Espèces / Caisse</option>
                                            <option value="MOBILE">Mobile Money</option>
                                            <option value="BANK">Virement Bancaire</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type de pièce</label>
                                        <select
                                            value={formData.document_type}
                                            onChange={(e) => setFormData({...formData, document_type: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all outline-none bg-white"
                                        >
                                            <option value="RECEIPT">Reçu</option>
                                            <option value="INVOICE">Facture</option>
                                            <option value="TICKET">Ticket de caisse</option>
                                            <option value="VOUCHER">Bon de caisse</option>
                                            <option value="OTHER">Autre</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Justificatif (PDF, Image)</label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="attachment"
                                                className="hidden"
                                                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                                            />
                                            <label 
                                                htmlFor="attachment"
                                                className={clsx(
                                                    "w-full px-4 py-3 rounded-xl border border-dashed flex items-center gap-2 cursor-pointer transition-all",
                                                    attachment ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-400"
                                                )}
                                            >
                                                <Paperclip size={16} />
                                                <span className="text-xs font-bold truncate">
                                                    {attachment ? attachment.name : "Joindre un fichier"}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                    <textarea
                                        rows={2}
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all outline-none resize-none"
                                        placeholder="Détails de la dépense..."
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                                >
                                    {editingExpense ? 'Enregistrer' : 'Enregistrer la dépense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
