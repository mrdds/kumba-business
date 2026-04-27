'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/dashboard-layout';
import { 
    BarChart3, Plus, Search, Filter, ChevronRight, Target, 
    CheckCircle2, Clock, XCircle, AlertCircle, MoreVertical, 
    Briefcase, Calendar, Trash2, Edit2, Send, X, TrendingUp,
    ArrowUpRight, PieChart, Layers, Download, Sparkles
} from 'lucide-react';
import api from '@/services/api';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/context/PreferencesContext';
import clsx from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { Outfit } from 'next/font/google';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function BudgetsPage() {
    const { t } = useTranslation();
    const { formatCurrency } = usePreferences();
    const [budgets, setBudgets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<any>(null);
    const [formData, setFormData] = useState({
        category: '',
        project_name: '',
        amount_limit: '',
        period_start: format(new Date(), 'yyyy-MM-dd'),
        period_end: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
        description: '',
        items: [{ description: '', quantity: '1', unit_price: '0' }]
    });

    useEffect(() => {
        fetchBudgets();
    }, []);

    const fetchBudgets = async () => {
        try {
            const res = await api.get('/budgets');
            setBudgets(res.data);
        } catch (err) {
            console.error("Error fetching budgets:", err);
            toast.error("Échec du chargement des budgets");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (budget = null) => {
        if (budget) {
            setEditingBudget(budget);
            setFormData({
                category: budget.category,
                project_name: budget.project_name || '',
                amount_limit: budget.amount_limit.toString(),
                period_start: budget.period_start,
                period_end: budget.period_end,
                description: budget.description || '',
                items: budget.items && budget.items.length > 0 
                    ? budget.items.map((it: any) => ({
                        description: it.description,
                        quantity: it.quantity.toString(),
                        unit_price: it.unit_price.toString()
                    }))
                    : [{ description: '', quantity: '1', unit_price: '0' }]
            });
        } else {
            setEditingBudget(null);
            setFormData({
                category: '',
                project_name: '',
                amount_limit: '',
                period_start: format(new Date(), 'yyyy-MM-dd'),
                period_end: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
                description: '',
                items: [{ description: '', quantity: '1', unit_price: '0' }]
            });
        }
        setIsModalOpen(true);
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: '1', unit_price: '0' }]
        }));
    };

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index: number) => {
        if (formData.items.length === 1) return;
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const calculateItemsTotal = () => {
        return formData.items.reduce((acc, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.unit_price) || 0;
            return acc + (qty * price);
        }, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                amount_limit: formData.items.length > 0 ? calculateItemsTotal() : parseFloat(formData.amount_limit),
                items: formData.items.map(it => ({
                    description: it.description,
                    quantity: parseFloat(it.quantity),
                    unit_price: parseFloat(it.unit_price)
                }))
            };

            if (editingBudget) {
                await api.put(`/budgets/${editingBudget.id}`, data);
                toast.success("Budget mis à jour");
            } else {
                await api.post('/budgets', data);
                toast.success("Budget créé");
            }
            setIsModalOpen(false);
            fetchBudgets();
        } catch (err) {
            toast.error("Une erreur est survenue");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce budget ?")) return;
        try {
            await api.delete(`/budgets/${id}`);
            toast.success("Budget supprimé");
            fetchBudgets();
        } catch (err) {
            toast.error("Impossible de supprimer un budget approuvé");
        }
    };

    const handleSubmitForApproval = async (id: number) => {
        try {
            await api.post(`/budgets/${id}/submit`);
            toast.success("Budget soumis pour approbation");
            fetchBudgets();
        } catch (err) {
            toast.error("Échec de la soumission");
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'bg-slate-50 text-slate-400 border-slate-100';
            case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'CLOSED': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-slate-50 text-slate-400 border-slate-100';
        }
    };

    const filteredBudgets = budgets.filter(b => 
        b.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalBudgeted = budgets.reduce((acc, b) => acc + Number(b.amount_limit), 0);
    const totalSpent = budgets.reduce((acc, b) => acc + Number(b.current_amount), 0);

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-1">
                        <h1 className={clsx("text-4xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            Gestion Budgétaire
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-[3px]">
                            Contrôle Analytique & Allocation
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 shadow-sm transition-all">
                            <Download size={20} />
                        </button>
                        <button 
                            onClick={() => handleOpenModal()}
                            className="bg-slate-900 text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all active:scale-95"
                        >
                            <Plus size={18} />
                            Nouveau Budget
                        </button>
                    </div>
                </div>

                {/* KPI Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        label="Total Alloué" 
                        value={formatCurrency(totalBudgeted)} 
                        icon={<Target />} 
                        color="indigo" 
                        subLabel="Période en cours"
                    />
                    <StatCard 
                        label="Utilisation" 
                        value={`${((totalSpent / (totalBudgeted || 1)) * 100).toFixed(1)}%`} 
                        icon={<TrendingUp />} 
                        color="emerald" 
                        subLabel={`${formatCurrency(totalSpent)} dépensés`}
                    />
                    <StatCard 
                        label="En Attente" 
                        value={budgets.filter(b => b.status === 'PENDING').length} 
                        icon={<Clock />} 
                        color="amber" 
                        subLabel="Révision nécessaire"
                    />
                    <StatCard 
                        label="Catégories" 
                        value={new Set(budgets.map(b => b.category)).size} 
                        icon={<PieChart />} 
                        color="slate" 
                        subLabel="Postes analytiques"
                    />
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Filtrer par projet, catégorie ou responsable..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        />
                    </div>
                    <button className="px-6 py-4 bg-slate-50 text-slate-400 rounded-[20px] flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                        <Filter size={16} />
                        Options
                    </button>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="py-32 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                    </div>
                ) : filteredBudgets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {filteredBudgets.map((budget) => (
                            <BudgetCard 
                                key={budget.id} 
                                budget={budget} 
                                onEdit={handleOpenModal}
                                onDelete={handleDelete}
                                onSubmit={handleSubmitForApproval}
                                formatCurrency={formatCurrency}
                                getStatusStyle={getStatusStyle}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-[64px] p-32 text-center border-2 border-dashed border-slate-100">
                        <Sparkles size={64} className="mx-auto text-slate-200 mb-8" />
                        <h2 className={clsx("text-2xl font-black text-slate-900 mb-2", displayFont.className)}>Aucun Budget Détecté</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-10">Commencez par définir votre premier poste analytique</p>
                        <button 
                            onClick={() => handleOpenModal()}
                            className="bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-[2px] shadow-2xl shadow-slate-900/20"
                        >
                            Créer un budget
                        </button>
                    </div>
                )}
            </div>

            {/* Redesigned Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white rounded-[48px] w-full max-w-5xl my-8 overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300">
                        <div className="p-10 flex justify-between items-center border-b border-slate-50">
                            <div>
                                <h2 className={clsx("text-3xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                                    {editingBudget ? 'Édition Analytique' : 'Configuration Budgétaire'}
                                </h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mt-1">Établissement du plafond financier</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="h-14 w-14 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-10 space-y-12 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                <div className="space-y-10">
                                    <SectionTitle number="01" title="Périmètre du Budget" />
                                    
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie Analytique</label>
                                            <select
                                                required
                                                value={formData.category}
                                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                                className="w-full h-16 px-6 rounded-[20px] bg-slate-50 border-none text-base font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                                            >
                                                <option value="">Sélectionner une catégorie...</option>
                                                <option value="FONCTIONNEMENT">Charges de fonctionnement</option>
                                                <option value="INVESTISSEMENT">Investissements (CAPEX)</option>
                                                <option value="MARKETING">Marketing & Ventes</option>
                                                <option value="RH">Masse Salariale / RH</option>
                                                <option value="LOGISTIQUE">Logistique & Transport</option>
                                                <option value="AUTRE">Autre</option>
                                            </select>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Intitulé du Projet</label>
                                            <input
                                                type="text"
                                                value={formData.project_name}
                                                onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                                                className="w-full h-16 px-6 rounded-[20px] bg-slate-50 border-none text-base font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                placeholder="ex: Campagne Q4 - 2024"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date d'Ouverture</label>
                                                <input
                                                    required
                                                    type="date"
                                                    value={formData.period_start}
                                                    onChange={(e) => setFormData({...formData, period_start: e.target.value})}
                                                    className="w-full h-16 px-6 rounded-[20px] bg-slate-50 border-none text-base font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date de Clôture</label>
                                                <input
                                                    required
                                                    type="date"
                                                    value={formData.period_end}
                                                    onChange={(e) => setFormData({...formData, period_end: e.target.value})}
                                                    className="w-full h-16 px-6 rounded-[20px] bg-slate-50 border-none text-base font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Objectifs & Notes</label>
                                            <textarea
                                                rows={4}
                                                value={formData.description}
                                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                                className="w-full p-6 rounded-[24px] bg-slate-50 border-none text-base font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none leading-relaxed"
                                                placeholder="Détails stratégiques sur l'utilisation de ces fonds..."
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="flex justify-between items-end">
                                        <SectionTitle number="02" title="Décomposition Financière" />
                                        <button 
                                            type="button"
                                            onClick={addItem}
                                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                                        >
                                            <Plus size={14} /> Ligne
                                        </button>
                                    </div>

                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {formData.items.map((item, index) => (
                                            <div key={index} className="p-6 bg-slate-50 rounded-[28px] border border-slate-100 space-y-4 relative group/item">
                                                <button 
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="absolute -right-2 -top-2 w-8 h-8 bg-white border border-slate-100 text-slate-300 hover:text-rose-500 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover/item:opacity-100 transition-all"
                                                >
                                                    <X size={14} />
                                                </button>
                                                
                                                <input
                                                    required
                                                    placeholder="Désignation du poste..."
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                    className="w-full h-12 bg-white border-none rounded-xl px-4 text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500/10"
                                                />
                                                
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Volume / Qte</label>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                            className="w-full h-11 bg-white border-none rounded-xl px-4 text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500/10"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">P.U / Forfait</label>
                                                        <input
                                                            type="number"
                                                            value={item.unit_price}
                                                            onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                                            className="w-full h-11 bg-white border-none rounded-xl px-4 text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500/10"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-10 bg-slate-900 rounded-[40px] text-white space-y-4 shadow-2xl shadow-slate-200 group relative overflow-hidden">
                                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity" />
                                        
                                        <div className="flex justify-between items-center opacity-60 relative z-10">
                                            <span className="text-[10px] font-black uppercase tracking-[3px]">Total Budgetisé</span>
                                            <span className="text-sm font-bold uppercase tracking-widest">{formData.items.length} lignes analytiques</span>
                                        </div>
                                        <div className="flex justify-between items-end pt-4 border-t border-slate-800 relative z-10">
                                            <span className={clsx("text-4xl font-black tracking-tighter", displayFont.className)}>
                                                {calculateItemsTotal().toLocaleString()} <span className="text-sm font-bold text-slate-500">FCFA</span>
                                            </span>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Montant Plafond</p>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Révision Annuelle</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-6 pt-10 border-t border-slate-50">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 h-16 rounded-[20px] text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    Abandonner
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-[2] h-16 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[3px] hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <CheckCircle2 size={20} />
                                    {editingBudget ? 'Enregistrer les modifications' : 'Confirmer & Activer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

function StatCard({ label, value, icon, color, subLabel }: any) {
    return (
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-100/50 transition-all group relative overflow-hidden">
            <div className={clsx("absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity", 
                color === 'indigo' ? 'bg-indigo-600' : 
                color === 'emerald' ? 'bg-emerald-600' : 
                color === 'amber' ? 'bg-amber-600' : 'bg-slate-600'
            )}></div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className={clsx("p-3 rounded-2xl", 
                    color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 
                    color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
                    color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                )}>{icon}</div>
                <div className="h-1.5 w-1.5 bg-slate-100 rounded-full" />
            </div>
            
            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <h3 className={clsx("text-2xl font-black text-slate-900 tracking-tight", displayFont.className)}>{value}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{subLabel}</p>
            </div>
        </div>
    );
}

function BudgetCard({ budget, onEdit, onDelete, onSubmit, formatCurrency, getStatusStyle }: any) {
    const progress = Math.min((Number(budget.current_amount) / Number(budget.amount_limit)) * 100, 100);
    const isOver = progress >= 90;

    return (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/40 transition-all group overflow-hidden flex flex-col relative">
            <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                    <div className={clsx(
                        "px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[2px]",
                        getStatusStyle(budget.status)
                    )}>
                        {budget.status || 'DRAFT'}
                    </div>
                    <div className="flex gap-2">
                        {budget.status !== 'APPROVED' && budget.status !== 'CLOSED' && (
                            <>
                                <button 
                                    onClick={() => onEdit(budget)}
                                    className="h-10 w-10 flex items-center justify-center text-slate-300 hover:text-slate-900 bg-slate-50 rounded-xl transition-all"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => onDelete(budget.id)}
                                    className="h-10 w-10 flex items-center justify-center text-slate-300 hover:text-rose-600 bg-slate-50 rounded-xl transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                                {(budget.status === 'DRAFT' || !budget.status) && (
                                    <button 
                                        onClick={() => onSubmit(budget.id)}
                                        className="h-10 w-10 flex items-center justify-center text-slate-300 hover:text-emerald-600 bg-slate-50 rounded-xl transition-all"
                                    >
                                        <Send size={16} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-5 mb-6">
                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                        <Layers size={28} />
                    </div>
                    <div>
                        <h3 className={clsx("text-2xl font-black text-slate-900 tracking-tight", displayFont.className)}>{budget.category}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg uppercase tracking-widest">{budget.project_name || 'Budget Global'}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{budget.id}</span>
                        </div>
                    </div>
                </div>
                
                <p className="text-slate-500 text-base font-medium leading-relaxed mb-10 h-12 line-clamp-2">
                    {budget.description || "Allocation stratégique des ressources pour le développement du pôle analytique."}
                </p>

                {/* Performance Visualizer */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consommation Réelle</p>
                            <p className={clsx("text-2xl font-black text-slate-900 tracking-tighter", displayFont.className)}>
                                {formatCurrency(Number(budget.current_amount))}
                            </p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisation</p>
                            <p className={clsx("text-xl font-black tracking-tight", isOver ? "text-rose-600" : "text-slate-900")}>
                                {progress.toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1">
                        <div 
                            className={clsx(
                                "h-full rounded-full transition-all duration-1000 ease-out",
                                isOver ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]" : "bg-slate-900"
                            )}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[2px] pt-2">
                        <span>Plafond: {formatCurrency(Number(budget.amount_limit))}</span>
                        <div className="flex items-center gap-2">
                            <Calendar size={12} />
                            <span>{format(new Date(budget.period_end), 'MMM yyyy')}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <button className="w-full py-5 bg-slate-50/80 border-t border-slate-50 text-[10px] font-black text-slate-900 uppercase tracking-[3px] hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3">
                Audit Analytique Détaillé
                <ArrowUpRight size={14} />
            </button>
        </div>
    );
}

function SectionTitle({ number, title }: any) {
    return (
        <div className="flex items-center gap-4">
            <span className="text-3xl font-black text-slate-100 italic">{number}</span>
            <h3 className={clsx("text-xl font-black text-slate-900 tracking-tight", displayFont.className)}>{title}</h3>
            <div className="h-px flex-grow bg-slate-50"></div>
        </div>
    );
}
