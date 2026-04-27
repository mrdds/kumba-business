'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../dashboard-layout';
import { getQuotes, convertQuote, submitQuoteApproval } from '../../services/api';
import { 
    Plus, FileText, CheckCircle, RefreshCw, Loader2, Send, 
    Search, Filter, ChevronRight, FileSignature, TrendingUp,
    Clock, CheckCircle2, ArrowUpRight, Sparkles, MoreHorizontal,
    Download, FileUp, FileSpreadsheet
} from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useNotification } from '@/context/NotificationContext';
import ApprovalStatus from '@/components/ApprovalStatus';
import { usePreferences } from '@/context/PreferencesContext';
import { useAuth } from '@/context/AuthContext';
import QuoteModal from '@/components/approvals/QuoteModal';
import { useTranslation } from 'react-i18next';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';
import { exportToExcel } from '@/services/excelService';
import ImportDataModal from '@/components/accounting/ImportDataModal';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function QuoteList() {
    const { user } = useAuth();
    const { showToast } = useNotification();
    const { formatCurrency } = usePreferences();
    const { t } = useTranslation();
    
    const [quotes, setQuotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [converting, setConverting] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState<number | null>(null);
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);

    // Modals
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, id: number | null }>({ isOpen: false, id: null });
    const [submitModal, setSubmitModal] = useState<{ isOpen: boolean, id: number | null }>({ isOpen: false, id: null });
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                const data = await getQuotes();
                setQuotes(data);
            } catch (error) {
                console.error("Failed to fetch quotes", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuotes();
    }, []);

    const handleConvertClick = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmModal({ isOpen: true, id });
    };

    const handleConfirmConvert = async () => {
        if (!confirmModal.id) return;
        const id = confirmModal.id;
        setConverting(id);
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
            await convertQuote(id);
            showToast(t('quotes.toast_convert_success'), 'success');
            const data = await getQuotes();
            setQuotes(data);
        } catch (error) {
            console.error(error);
            showToast(t('quotes.toast_convert_error'), 'error');
        } finally {
            setConverting(null);
            setConfirmModal({ isOpen: false, id: null });
        }
    };

    const handleSubmitClick = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setSubmitModal({ isOpen: true, id });
    };

    const handleConfirmSubmit = async () => {
        if (!submitModal.id) return;
        const id = submitModal.id;
        setSubmitting(id);
        const previousQuotes = [...quotes];
        try {
            setSubmitModal({ ...submitModal, isOpen: false });
            setQuotes(quotes.map(q => q.id === id ? { ...q, status: 'PENDING' } : q));
            const result = await submitQuoteApproval(id);
            if (result && result.status) {
                setQuotes(quotes.map(q => q.id === id ? { ...q, status: result.status } : q));
            }
            showToast(t('quotes.toast_submit_success'), 'success');
        } catch (error) {
            console.error(error);
            showToast(t('quotes.toast_submit_error'), 'error');
            setQuotes(previousQuotes);
        } finally {
            setSubmitting(null);
            setSubmitModal({ isOpen: false, id: null });
        }
    };

    const handleExport = () => {
        const data = quotes.map(q => ({
            Reference: `DQ-${q.id}`,
            Client: q.client_name,
            Date: q.date,
            Validite: q.valid_until,
            Montant: q.total_amount,
            Statut: q.status
        }));
        exportToExcel(data, `Devis_${new Date().toISOString().split('T')[0]}`);
    };

    const filtered = quotes.filter(q => 
        q.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.id.toString().includes(searchTerm)
    );

    const totalValue = quotes.reduce((acc, q) => acc + parseFloat(q.total_amount || 0), 0);

    return (
        <DashboardLayout>
            <QuoteModal
                isOpen={!!selectedQuoteId}
                onClose={() => setSelectedQuoteId(null)}
                quoteId={selectedQuoteId || 0}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmConvert}
                title={t('quotes.convert_modal.title')}
                message={t('quotes.convert_modal.message')}
                confirmText={t('quotes.convert_modal.confirm')}
            />

            <ConfirmationModal
                isOpen={submitModal.isOpen}
                onClose={() => setSubmitModal({ ...submitModal, isOpen: false })}
                onConfirm={handleConfirmSubmit}
                title={t('quotes.submit_modal.title')}
                message={t('quotes.submit_modal.message', { id: submitModal.id })}
                confirmText={t('quotes.submit_modal.confirm')}
                isLoading={submitting === submitModal.id}
            />

            <ImportDataModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={(data) => {
                    showToast('Importation terminée', 'success');
                    setIsImportModalOpen(false);
                }}
                title="Importer des Devis"
                description="Téléchargez vos propositions au format Excel."
            />

            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-1">
                        <h1 className={clsx("text-4xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            Deformulaire & Devis
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-[3px]">
                            Cycle de Vente & Propositions
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={handleExport}
                            className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <Download size={16} />
                            Exporter
                        </button>
                        <button 
                            onClick={() => setIsImportModalOpen(true)}
                            className="px-6 py-4 bg-white border-2 border-slate-100 hover:border-indigo-200 text-slate-600 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <FileUp size={16} />
                            Importer
                        </button>
                        <Link href="/quotes/create" className="bg-slate-900 text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all active:scale-95">
                            <Plus size={18} />
                            Créer un Devis
                        </Link>
                    </div>
                </div>

                {/* KPI Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <SalesStat label="Pipeline Total" value={formatCurrency(totalValue)} icon={<TrendingUp />} color="slate" />
                    <SalesStat label="En Approbation" value={quotes.filter(q => q.status === 'PENDING').length} icon={<Clock />} color="amber" />
                    <SalesStat label="Validés" value={quotes.filter(q => q.status === 'APPROVED').length} icon={<CheckCircle2 />} color="emerald" />
                    <SalesStat label="Taux de Conv." value="64%" icon={<RefreshCw />} color="indigo" />
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher par client, n° de devis..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        />
                    </div>
                    <button className="px-6 py-4 bg-slate-50 text-slate-400 rounded-[20px] flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                        <Filter size={16} />
                        Filtres
                    </button>
                </div>

                {/* List Content */}
                {loading ? (
                    <div className="py-32 flex justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-slate-50 rounded-[64px] p-32 text-center border-2 border-dashed border-slate-100">
                        <Sparkles size={64} className="mx-auto text-slate-200 mb-8" />
                        <h3 className={clsx("text-2xl font-black text-slate-900 mb-2", displayFont.className)}>Aucun Devis Actif</h3>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-10">Générez votre première proposition commerciale</p>
                        <Link href="/quotes/create" className="bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-[2px] shadow-2xl shadow-slate-900/20">
                            Lancer un devis
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Validité</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant H.T</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtered.map((quote) => (
                                        <tr 
                                            key={quote.id} 
                                            className="group hover:bg-slate-50/50 transition-all cursor-pointer"
                                            onClick={() => setSelectedQuoteId(quote.id)}
                                        >
                                            <td className="p-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                                                        <FileSignature size={20} />
                                                    </div>
                                                    <p className="font-black text-slate-900 text-sm tracking-tight">#{quote.id.toString().padStart(5, '0')}</p>
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                <p className="font-black text-slate-900 text-base tracking-tight">{quote.client_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Partenaire Premium</p>
                                            </td>
                                            <td className="p-8">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-slate-900">{new Date(quote.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Expire le {new Date(quote.valid_until).toLocaleDateString('fr-FR')}</p>
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                <p className={clsx("text-lg font-black text-slate-900 tracking-tighter", displayFont.className)}>
                                                    {formatCurrency(parseFloat(quote.total_amount || 0))}
                                                </p>
                                            </td>
                                            <td className="p-8">
                                                <ApprovalStatus status={quote.status} />
                                            </td>
                                            <td className="p-8 text-right">
                                                <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                    {quote.status === 'DRAFT' && (
                                                        <button
                                                            onClick={(e) => handleSubmitClick(quote.id, e)}
                                                            className="h-10 w-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                                                        >
                                                            {submitting === quote.id ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                                        </button>
                                                    )}
                                                    {(quote.status === 'APPROVED' || quote.status === 'SENT') && (
                                                        <button
                                                            onClick={(e) => handleConvertClick(quote.id, e)}
                                                            className="px-4 h-10 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                                                        >
                                                            {converting === quote.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                                            Convertir
                                                        </button>
                                                    )}
                                                    {quote.status === 'CONVERTED' && (
                                                        <div className="h-10 px-4 bg-slate-50 text-slate-400 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest border border-slate-100">
                                                            <CheckCircle2 size={14} /> Facturé
                                                        </div>
                                                    )}
                                                    <button className="h-10 w-10 flex items-center justify-center bg-slate-50 text-slate-300 hover:text-slate-900 rounded-xl transition-all">
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function SalesStat({ label, value, icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
            <div className={clsx("absolute -right-4 -top-4 w-20 h-20 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity", 
                color === 'indigo' ? 'bg-indigo-600' : color === 'amber' ? 'bg-amber-600' : color === 'emerald' ? 'bg-emerald-600' : 'bg-slate-600'
            )} />
            <div className="flex items-center gap-4">
                <div className={clsx("p-3 rounded-2xl", 
                    color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 
                    color === 'amber' ? 'bg-amber-50 text-amber-600' : 
                    color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
                )}>{icon}</div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className={clsx("text-2xl font-black text-slate-900", displayFont.className)}>{value}</p>
                </div>
            </div>
        </div>
    );
}
