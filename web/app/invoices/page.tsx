'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../dashboard-layout';
import { getInvoices, sendInvoiceEmail, submitInvoiceApproval } from '../../services/api';
import { 
    Plus, Eye, Mail, Loader2, Send, Filter, Search, 
    ChevronRight, Download, FileUp, TrendingUp, Wallet,
    AlertCircle, CheckCircle2, MoreHorizontal, Sparkles,
    FileSpreadsheet, FileText, Clock
} from 'lucide-react';
import Link from 'next/link';
import ConfirmationModal from '@/components/ConfirmationModal';
import { formatCurrency } from '@/utils/formatCurrency';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import ApprovalStatus from '@/components/ApprovalStatus';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/Skeleton';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';
import { exportToExcel } from '@/services/excelService';
import ImportDataModal from '@/components/accounting/ImportDataModal';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function InvoicesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useNotification();
    const { t } = useTranslation();

    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingId, setSendingId] = useState<number | null>(null);
    const [submittingId, setSubmittingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const [submitModal, setSubmitModal] = useState<{ isOpen: boolean, id: number | null }>({ isOpen: false, id: null });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getInvoices();
            setInvoices(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSubmit = async () => {
        if (!submitModal.id) return;
        const id = submitModal.id;
        setSubmittingId(id);
        try {
            setSubmitModal({ ...submitModal, isOpen: false });
            setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'PENDING_LEVEL_1' } : inv));
            await submitInvoiceApproval(id);
            showToast('Facture soumise pour approbation', 'success');
        } catch (error) {
            fetchData(); 
            showToast('Erreur lors de la soumission', 'error');
        } finally {
            setSubmittingId(null);
        }
    };

    const handleExport = () => {
        const data = invoices.map(inv => ({
            Reference: `FA-${inv.id}`,
            Client: inv.client_name,
            Date: inv.date,
            Montant: inv.total_amount,
            Statut: inv.status
        }));
        exportToExcel(data, `Factures_${new Date().toISOString().split('T')[0]}`);
    };

    const filtered = invoices.filter(inv => 
        inv.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.id.toString().includes(searchTerm)
    );

    const totalUnpaid = invoices.reduce((acc, inv) => acc + (inv.balance_due || 0), 0);
    const totalRevenue = invoices.reduce((acc, inv) => acc + parseFloat(inv.total_amount || 0), 0);

    return (
        <DashboardLayout>
            <ConfirmationModal
                isOpen={submitModal.isOpen}
                onClose={() => setSubmitModal({ isOpen: false, id: null })}
                onConfirm={handleConfirmSubmit}
                title="Soumettre pour approbation"
                message={`Voulez-vous lancer le circuit de validation pour la facture #${submitModal.id} ?`}
                confirmText="Lancer le workflow"
                isLoading={submittingId === submitModal.id}
            />

            <ImportDataModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={(data) => {
                    showToast('Importation terminée', 'success');
                    setIsImportModalOpen(false);
                }}
                title="Importer des Factures"
                description="Téléchargez vos factures au format Excel."
            />

            <div className="max-w-7xl mx-auto space-y-10 pb-20">
                
                {/* --- MASTERPIECE HEADER --- */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/30">
                                <FileText size={20} />
                            </div>
                            <span className="text-blue-600 text-xs font-black uppercase tracking-widest">Billing Engine v3.0</span>
                        </div>
                        <h1 className={clsx("text-4xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            {t('invoices.title')}
                        </h1>
                        <p className="text-slate-500 font-bold uppercase tracking-[2px] mt-1 text-xs">
                            Suivi des Ventes & Encaissements
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={handleExport}
                            className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <Download size={16} />
                            Exporter
                        </button>
                        <button 
                            onClick={() => setIsImportModalOpen(true)}
                            className="px-6 py-3.5 bg-white border-2 border-slate-100 hover:border-blue-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <FileUp size={16} />
                            Importer
                        </button>
                        <Link href="/invoices/create" className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 font-black text-xs uppercase tracking-widest">
                            <Plus size={18} />
                            {t('invoices.create')}
                        </Link>
                    </div>
                </div>

                {/* --- ANALYTICS CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InvoiceStat 
                        label="Chiffre d'Affaires" 
                        value={formatCurrency(totalRevenue, user?.company?.currency)} 
                        icon={<TrendingUp size={24} />} 
                        color="indigo" 
                    />
                    <InvoiceStat 
                        label="Total Impayés" 
                        value={formatCurrency(totalUnpaid, user?.company?.currency)} 
                        icon={<AlertCircle size={24} />} 
                        color="rose" 
                    />
                    <InvoiceStat 
                        label="Factures Payées" 
                        value="84%" 
                        icon={<CheckCircle2 size={24} />} 
                        color="emerald" 
                    />
                </div>

                {/* --- FILTERS & SEARCH --- */}
                <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Rechercher par client, n° de facture..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-300"
                        />
                    </div>
                    <button className="px-6 py-4 bg-slate-50 text-slate-400 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                        <Filter size={16} />
                        Filtrer
                    </button>
                </div>

                {/* --- INVOICES LIST --- */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="p-8 font-black text-[10px] uppercase tracking-widest text-slate-400">{t('invoices.table.client')}</th>
                                    <th className="p-8 font-black text-[10px] uppercase tracking-widest text-slate-400">{t('invoices.table.date')}</th>
                                    <th className="p-8 font-black text-[10px] uppercase tracking-widest text-slate-400">{t('invoices.table.amount')}</th>
                                    <th className="p-8 font-black text-[10px] uppercase tracking-widest text-slate-400">{t('invoices.table.status')}</th>
                                    <th className="p-8 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i}>
                                            <td className="p-8"><Skeleton.Box className="h-12 w-48 rounded-xl" /></td>
                                            <td className="p-8"><Skeleton.Box className="h-4 w-24" /></td>
                                            <td className="p-8"><Skeleton.Box className="h-8 w-32" /></td>
                                            <td className="p-8"><Skeleton.Box className="h-8 w-24 rounded-full" /></td>
                                            <td className="p-8"><Skeleton.Box className="h-10 w-10 rounded-xl ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-32 text-center">
                                            <div className="bg-slate-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Sparkles size={40} className="text-slate-200" />
                                            </div>
                                            <h3 className={clsx("text-2xl font-black text-slate-900 mb-2", displayFont.className)}>Aucune facture trouvée</h3>
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Commencez par créer votre première facture.</p>
                                        </td>
                                    </tr>
                                ) : filtered.map((invoice) => (
                                    <tr key={invoice.id} className="group hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => router.push(`/invoices/${invoice.id}`)}>
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 text-base tracking-tight">{invoice.client_name}</div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">FA-{invoice.id.toString().padStart(5, '0')}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="text-sm font-black text-slate-900">
                                                {new Date(invoice.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                                                <Clock size={10} /> Échéance: 30j
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className={clsx("text-lg font-black text-slate-900 tabular-nums tracking-tighter", displayFont.className)}>
                                                {formatCurrency(invoice.total_amount, user?.company?.currency)}
                                            </div>
                                            {invoice.balance_due > 0 && (
                                                <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">
                                                    Reste à payer: {formatCurrency(invoice.balance_due, user?.company?.currency)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-8">
                                            <ApprovalStatus 
                                                status={invoice.status} 
                                                reason={invoice.rejection_reason}
                                            />
                                        </td>
                                        <td className="p-8 text-right">
                                            <div className="flex justify-end items-center gap-2" onClick={e => e.stopPropagation()}>
                                                {invoice.status === 'DRAFT' && (
                                                    <button
                                                        onClick={() => setSubmitModal({ isOpen: true, id: invoice.id })}
                                                        className="h-10 w-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                        title="Soumettre"
                                                    >
                                                        {submittingId === invoice.id ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/invoices/${invoice.id}`}
                                                    className="h-10 w-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                                <button className="h-10 w-10 flex items-center justify-center bg-slate-50 text-slate-300 hover:text-slate-900 rounded-xl transition-all">
                                                    <MoreHorizontal size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function InvoiceStat({ label, value, icon, color }: any) {
    const colors: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600',
        rose: 'bg-rose-50 text-rose-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        blue: 'bg-blue-50 text-blue-600'
    };

    return (
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
            <div className={clsx("absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity", 
                color === 'indigo' ? 'bg-indigo-600' : color === 'rose' ? 'bg-rose-600' : 'bg-emerald-600'
            )} />
            <div className="flex items-center gap-5">
                <div className={clsx("p-4 rounded-2xl shadow-inner", colors[color])}>{icon}</div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{label}</p>
                    <p className={clsx("text-3xl font-black text-slate-900 tracking-tighter mt-1", displayFont.className)}>{value}</p>
                </div>
            </div>
        </div>
    );
}
