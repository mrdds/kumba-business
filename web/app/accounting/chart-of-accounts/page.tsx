'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/context/PreferencesContext';
import DashboardLayout from '@/app/dashboard-layout';
import { getAccounts } from '@/services/api';
import { 
    Search, 
    ArrowLeft, 
    Plus, 
    FileSpreadsheet, 
    ChevronRight,
    ArrowRightLeft,
    Filter,
    BookOpen
} from 'lucide-react';
import ImportDataModal from '@/components/accounting/ImportDataModal';
import { exportToExcel } from '@/services/excelService';
import api from '@/services/api';

interface Account {
    id: number;
    code: string;
    name: string;
    type: string;
    balance: number;
    is_active: boolean;
    parent_id: number | null;
    description: string | null;
}

export default function ChartOfAccounts() {
    const router = useRouter();
    const { t } = useTranslation();
    const { formatCurrency } = usePreferences();
    
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const typeParam = filter !== 'all' && filter !== 'active' ? filter : undefined;
            const activeOnly = filter === 'active';
            
            const data = await getAccounts(typeParam, activeOnly);
            setAccounts(data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, [filter]);

    const handleExport = () => {
        const dataToExport = accounts.map(acc => ({
            Code: acc.code,
            Nom: acc.name,
            Type: acc.type,
            Solde: acc.balance,
            Actif: acc.is_active ? 'Oui' : 'Non',
            Description: acc.description || ''
        }));
        exportToExcel(dataToExport, `Plan_Comptable_${new Date().toISOString().split('T')[0]}`);
    };

    const handleImport = async (data: any[]) => {
        // Map excel columns to API schema
        const accountsToImport = data.map(row => ({
            code: String(row.code || row.Code || ''),
            name: String(row.name || row.Nom || row.Name || ''),
            type: String(row.type || row.Type || 'ASSET'),
            description: String(row.description || row.Description || '')
        })).filter(acc => acc.code && acc.name);

        await api.post('/accounting/accounts/bulk', accountsToImport);
        await fetchAccounts();
    };

    const filteredAccounts = accounts.filter(account =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.code.includes(searchTerm)
    );

    const accountTypes = [
        { value: 'all', label: 'Tous les comptes', icon: <BookOpen size={16} /> },
        { value: 'ASSET', label: 'Actifs', icon: <div className="w-2 h-2 rounded-full bg-blue-500" /> },
        { value: 'LIABILITY', label: 'Passifs', icon: <div className="w-2 h-2 rounded-full bg-rose-500" /> },
        { value: 'EQUITY', label: 'Capitaux', icon: <div className="w-2 h-2 rounded-full bg-purple-500" /> },
        { value: 'REVENUE', label: 'Produits', icon: <div className="w-2 h-2 rounded-full bg-emerald-500" /> },
        { value: 'EXPENSE', label: 'Charges', icon: <div className="w-2 h-2 rounded-full bg-amber-500" /> },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">{t('accounting.loading')}</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <button 
                            onClick={() => router.push('/accounting')}
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm mb-4 transition-colors group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Retour au Dashboard
                        </button>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Plan Comptable</h1>
                        <p className="text-slate-500 font-medium mt-1">Structure hiérarchique SYSCOHADA de votre entreprise</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
                        >
                            <FileSpreadsheet size={18} />
                            Exporter
                        </button>
                        <button 
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
                        >
                            <Plus size={18} />
                            Importer
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                            <Plus size={18} />
                            Nouveau Compte
                        </button>
                    </div>
                </div>

                <ImportDataModal 
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={handleImport}
                    title="Importer le Plan Comptable"
                    description="Téléchargez votre plan comptable au format Excel ou CSV. Assurez-vous que les colonnes 'code', 'name' et 'type' sont présentes."
                />

                {/* --- FILTERS & SEARCH --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                    <div className="lg:col-span-8 flex flex-wrap gap-2">
                        {accountTypes.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setFilter(type.value)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                                    filter === type.value
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                {type.icon}
                                {type.label}
                            </button>
                        ))}
                    </div>
                    <div className="lg:col-span-4 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher par code ou nom..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* --- ACCOUNTS TABLE --- */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Code</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Intitulé du Compte</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Catégorie</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Solde Actuel</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredAccounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-4 bg-slate-50 rounded-full">
                                                    <BookOpen className="text-slate-300" size={40} />
                                                </div>
                                                <p className="text-slate-400 font-bold">Aucun compte trouvé</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAccounts.map((account) => (
                                        <tr
                                            key={account.id}
                                            className="hover:bg-blue-50/30 transition-all cursor-pointer group"
                                            onClick={() => router.push(`/accounting/ledger?account=${account.id}`)}
                                        >
                                            <td className="px-8 py-5">
                                                <span className="font-mono font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    {account.code}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="font-black text-slate-900 group-hover:text-blue-700 transition-colors">{account.name}</div>
                                                {account.description && (
                                                    <div className="text-[11px] text-slate-400 font-medium mt-1 line-clamp-1">{account.description}</div>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getTypeStyle(account.type)}`}>
                                                    {account.type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right font-black text-slate-900 tabular-nums">
                                                {formatCurrency(account.balance)}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center justify-center">
                                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all">
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- STATS SUMMARY --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SummaryCard
                        title="Total des Comptes"
                        value={accounts.length.toString()}
                        icon={<BookOpen className="text-blue-500" size={24} />}
                    />
                    <SummaryCard
                        title="Comptes Actifs"
                        value={accounts.filter(a => a.is_active).length.toString()}
                        icon={<Plus className="text-emerald-500" size={24} />}
                    />
                    <SummaryCard
                        title="Avec Mouvement"
                        value={accounts.filter(a => Math.abs(a.balance) > 0).length.toString()}
                        icon={<ArrowRightLeft className="text-purple-500" size={24} />}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}

function getTypeStyle(type: string): string {
    const styles: Record<string, string> = {
        'ASSET': 'bg-blue-50 text-blue-700',
        'LIABILITY': 'bg-rose-50 text-rose-700',
        'EQUITY': 'bg-purple-50 text-purple-700',
        'REVENUE': 'bg-emerald-50 text-emerald-700',
        'EXPENSE': 'bg-amber-50 text-amber-700'
    };
    return styles[type] || 'bg-slate-50 text-slate-600';
}

function SummaryCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
                <p className="text-2xl font-black text-slate-900">{value}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100">
                {icon}
            </div>
        </div>
    );
}
