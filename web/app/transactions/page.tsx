'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { getTransactions } from '../../services/api';
import DashboardLayout from '../../app/dashboard-layout';
import { 
    Loader2, ArrowUpRight, ArrowDownRight, Search, Filter, 
    Download, Calendar, Wallet, TrendingUp, TrendingDown,
    MoreHorizontal, ChevronRight, FileText, Sparkles, Receipt
} from 'lucide-react';
import TransactionDetailsModal from '@/components/TransactionDetailsModal';
import { useTranslation } from 'react-i18next';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function TransactionsPage() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { formatCurrency } = usePreferences();
    
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTxId, setSelectedTxId] = useState<number | null>(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const data = await getTransactions();
            setTransactions(data);
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(tx =>
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalIn = transactions.filter(t => t.type === 'IN').reduce((acc, t) => acc + parseFloat(t.amount), 0);
    const totalOut = transactions.filter(t => t.type === 'OUT').reduce((acc, t) => acc + parseFloat(t.amount), 0);

    return (
        <DashboardLayout>
            <TransactionDetailsModal
                isOpen={!!selectedTxId}
                onClose={() => setSelectedTxId(null)}
                transactionId={selectedTxId || 0}
            />

            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-1">
                        <h1 className={clsx("text-4xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            Journal de Caisse
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-[3px]">
                            Flux de Trésorerie & Opérations
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white border border-slate-100 p-2 rounded-2xl flex items-center gap-2 shadow-sm">
                            <Calendar size={18} className="text-slate-400 ml-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 pr-4 py-2">Ce Mois-ci</span>
                        </div>
                        <button className="bg-slate-900 text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all">
                            <Download size={18} />
                            Exporter
                        </button>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden group shadow-2xl shadow-slate-200">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-20" />
                        <Wallet className="text-indigo-400 mb-6" size={32} />
                        <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-2">Solde Net Période</p>
                        <h2 className={clsx("text-4xl font-black tracking-tighter", displayFont.className)}>
                            {formatCurrency(totalIn - totalOut)}
                        </h2>
                        <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            <ArrowUpRight size={14} /> +12.5% vs mois dernier
                        </div>
                    </div>

                    <SummaryBox 
                        label="Total Entrées" 
                        value={formatCurrency(totalIn)} 
                        icon={<TrendingUp size={24} />} 
                        color="emerald" 
                    />
                    <SummaryBox 
                        label="Total Sorties" 
                        value={formatCurrency(totalOut)} 
                        icon={<TrendingDown size={24} />} 
                        color="rose" 
                    />
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher une transaction par libellé, catégorie ou référence..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        />
                    </div>
                    <button className="px-6 py-4 bg-slate-50 text-slate-400 rounded-[20px] flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                        <Filter size={16} />
                        Filtres Avancés
                    </button>
                </div>

                {/* Ledger Content */}
                {loading ? (
                    <div className="py-32 flex justify-center">
                        <Loader2 className="animate-spin h-10 w-10 text-slate-900" />
                    </div>
                ) : (
                    <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Désignation & Détails</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Valeur</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Montant</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredTransactions.map((tx) => (
                                        <tr
                                            key={tx.id}
                                            className="group hover:bg-slate-50/50 transition-all cursor-pointer"
                                            onClick={() => setSelectedTxId(tx.id)}
                                        >
                                            <td className="p-8">
                                                <div className={clsx(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                                                    tx.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                )}>
                                                    {tx.type === 'IN' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                <div className="space-y-1">
                                                    <p className="font-black text-slate-900 text-base tracking-tight">{tx.description || '-'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Receipt size={10} /> REF-{tx.id.toString().padStart(6, '0')}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                <span className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:bg-white transition-colors">
                                                    {tx.category}
                                                </span>
                                            </td>
                                            <td className="p-8">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-slate-900">{new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(tx.date).getFullYear()}</p>
                                                </div>
                                            </td>
                                            <td className="p-8 text-right">
                                                <p className={clsx(
                                                    "text-lg font-black tracking-tighter",
                                                    displayFont.className,
                                                    tx.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                                                )}>
                                                    {tx.type === 'IN' ? '+' : '-'}{formatCurrency(parseFloat(tx.amount))}
                                                </p>
                                            </td>
                                            <td className="p-8 text-center">
                                                <button className="h-10 w-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-300 group-hover:text-slate-900 group-hover:bg-white transition-all shadow-sm">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTransactions.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-32 text-center">
                                                <Sparkles size={48} className="mx-auto text-slate-100 mb-6" />
                                                <p className="text-slate-400 font-black uppercase tracking-[3px] text-[10px]">
                                                    Aucune écriture trouvée
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function SummaryBox({ label, value, icon, color }: any) {
    return (
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group">
            <div className={clsx(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner transition-transform group-hover:-rotate-3",
                color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            )}>
                {icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-2">{label}</p>
            <h3 className={clsx("text-3xl font-black text-slate-900 tracking-tight", displayFont.className)}>{value}</h3>
        </div>
    );
}
