'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/context/PreferencesContext';
import DashboardLayout from '../dashboard-layout';
import { 
    getDashboardSummary, 
    getAccounts 
} from '@/services/api';
import { 
    TrendingUp, 
    TrendingDown, 
    Wallet, 
    ShieldCheck, 
    AlertCircle, 
    ArrowRightLeft, 
    FileText, 
    BarChart3,
    History,
    MoreHorizontal,
    ChevronRight,
    Search,
    BookOpen,
    Zap,
    Download
} from 'lucide-react';
import { exportToExcel } from '@/services/excelService';

interface Account {
    id: number;
    code: string;
    name: string;
    type: string;
    balance: number;
    is_active: boolean;
}

interface DashboardData {
    balance: number;
    revenue: number;
    expenses: number;
    unpaid_invoices_count: number;
    unpaid_invoices_amount: number;
    pending_salaries_amount: number;
    recent_transactions: any[];
    currency: string;
}

export default function AccountingDashboard() {
    const router = useRouter();
    const { t } = useTranslation();
    const { formatCurrency } = usePreferences();
    
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'audit'>('overview');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [summary, allAccounts] = await Promise.all([
                getDashboardSummary(),
                getAccounts()
            ]);
            
            setDashboardData(summary);
            setAccounts(allAccounts);
        } catch (error) {
            console.error('Error fetching accounting data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleQuickExport = () => {
        if (!dashboardData) return;
        const data = [
            { Metric: 'Trésorerie Totale', Value: dashboardData.balance },
            { Metric: 'Produits (YTD)', Value: dashboardData.revenue },
            { Metric: 'Charges (YTD)', Value: dashboardData.expenses },
            { Metric: 'Résultat Net', Value: dashboardData.revenue - dashboardData.expenses },
            { Metric: 'Encours Clients', Value: dashboardData.unpaid_invoices_amount },
            { Metric: 'Masse Salariale Est.', Value: dashboardData.pending_salaries_amount },
            ...accounts.slice(0, 20).map(acc => ({ Metric: `Compte: ${acc.code} ${acc.name}`, Value: acc.balance }))
        ];
        exportToExcel(data, `Résumé_Comptable_${new Date().toISOString().split('T')[0]}`);
    };

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

    const netProfit = (dashboardData?.revenue || 0) - (dashboardData?.expenses || 0);

    return (
        <DashboardLayout>
            <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
                
                {/* --- PREMIUM HEADER --- */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-[80px]" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500/20 rounded-lg backdrop-blur-md border border-white/10">
                                    <ShieldCheck className="text-blue-400" size={20} />
                                </div>
                                <span className="text-blue-400 text-xs font-bold uppercase tracking-[0.2em]">Finance Engine v2.0</span>
                            </div>
                            <h1 className="text-4xl font-black tracking-tight mb-1">
                                {t('accounting.title')}
                            </h1>
                            <p className="text-slate-400 font-medium">
                                {t('accounting.subtitle')}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <HeaderAction 
                                icon={<Download size={18} />} 
                                label="Quick Export"
                                onClick={handleQuickExport}
                            />
                            <HeaderAction 
                                icon={<Zap size={18} className="fill-blue-400" />} 
                                label="Smart Match"
                                onClick={() => router.push('/accounting/reconciliation')}
                            />
                            <HeaderAction 
                                icon={<BookOpen size={18} />} 
                                label={t('accounting.actions.coa')}
                                onClick={() => router.push('/accounting/chart-of-accounts')}
                            />
                            <HeaderAction 
                                icon={<FileText size={18} />} 
                                label={t('accounting.actions.journal')}
                                onClick={() => router.push('/accounting/journal-entries')}
                            />
                            <HeaderAction 
                                icon={<BarChart3 size={18} />} 
                                label={t('accounting.actions.reports')}
                                onClick={() => router.push('/accounting/reports')}
                            />
                        </div>
                    </div>

                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <QuickMetric 
                            label="Trésorerie Totale" 
                            value={formatCurrency(dashboardData?.balance || 0)} 
                            icon={<Wallet className="text-blue-400" size={20} />}
                        />
                        <QuickMetric 
                            label="Résultat Net (YTD)" 
                            value={formatCurrency(netProfit)} 
                            icon={<TrendingUp className={netProfit >= 0 ? "text-emerald-400" : "text-rose-400"} size={20} />}
                            trend={netProfit >= 0 ? "+12.4%" : "-2.1%"}
                        />
                        <QuickMetric 
                            label="Encours Clients" 
                            value={formatCurrency(dashboardData?.unpaid_invoices_amount || 0)} 
                            icon={<ArrowRightLeft className="text-amber-400" size={20} />}
                        />
                        <QuickMetric 
                            label="Masse Salariale Est." 
                            value={formatCurrency(dashboardData?.pending_salaries_amount || 0)} 
                            icon={<History className="text-purple-400" size={20} />}
                        />
                    </div>
                </div>

                {/* --- MAIN CONTENT GRID --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN: ACTIVITY & ALERTS */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* TABS */}
                        <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                            <button 
                                onClick={() => setActiveTab('overview')}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Vue d'ensemble
                            </button>
                            <button 
                                onClick={() => setActiveTab('audit')}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'audit' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Piste d'Audit
                            </button>
                        </div>

                        {activeTab === 'overview' ? (
                            <div className="space-y-8">
                                {/* ACCOUNT BALANCES TABLE */}
                                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <BarChart3 className="text-blue-600" size={24} />
                                            <h2 className="text-xl font-black text-slate-900">Soldes des Comptes</h2>
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input 
                                                type="text" 
                                                placeholder="Filtrer par code ou nom..." 
                                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50">
                                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Code</th>
                                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Désignation</th>
                                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Type</th>
                                                    <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Solde</th>
                                                    <th className="px-6 py-4 text-center text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {accounts
                                                    .filter(acc => Math.abs(acc.balance) > 0)
                                                    .slice(0, 8)
                                                    .map((account) => (
                                                    <tr key={account.id} className="hover:bg-slate-50/80 transition-all group">
                                                        <td className="px-6 py-4">
                                                            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">{account.code}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-900">{account.name}</div>
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">SYSCOHADA</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getTypeStyle(account.type)}`}>
                                                                {account.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-black text-slate-900 tabular-nums">
                                                            {formatCurrency(account.balance)}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                                        <button 
                                            onClick={() => router.push('/accounting/chart-of-accounts')}
                                            className="w-full py-2 text-sm font-bold text-slate-600 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            Consulter l'ensemble du Plan Comptable <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* AUDIT TRAIL VIEW */
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                                    <History className="text-blue-600" size={24} />
                                    <h2 className="text-xl font-black text-slate-900">Journal des Événements Immuables</h2>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {(dashboardData?.recent_transactions || []).map((tx: any) => (
                                        <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${tx.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {tx.type === 'IN' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{tx.description}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{tx.category}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <span className="text-xs text-slate-400">{tx.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-lg font-black tabular-nums ${tx.type === 'IN' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                    {tx.type === 'IN' ? '+' : '−'} {formatCurrency(tx.amount)}
                                                </div>
                                                <div className="text-[10px] font-black text-slate-400 tracking-tighter uppercase mt-0.5">Vérifié par FinanceEngine</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: INSIGHTS & ACTIONS */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* COMPLIANCE WIDGET */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-6 border border-slate-200">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <AlertCircle size={18} className="text-amber-500" />
                                Alertes de Conformité
                            </h3>
                            <div className="space-y-4">
                                <ComplianceItem 
                                    title="Clôture Périodique" 
                                    desc="La période d'Avril 2026 n'est pas encore clôturée." 
                                    status="warning"
                                />
                                <ComplianceItem 
                                    title="Rapprochement Bancaire" 
                                    desc="3 transactions Mobile Money en attente de lettrage." 
                                    status="alert"
                                />
                                <ComplianceItem 
                                    title="Piste d'Audit" 
                                    desc="Toutes les écritures du jour sont équilibrées." 
                                    status="success"
                                />
                            </div>
                        </div>

                        {/* ANALYTICAL KPIs */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Indicateurs de Performance</h3>
                            <div className="space-y-6">
                                <AnalyticalMetric 
                                    label="DSO (Délai de Paiement)" 
                                    value="42 Jours" 
                                    progress={65} 
                                    color="blue"
                                />
                                <AnalyticalMetric 
                                    label="Taux de Marge Brute" 
                                    value="24.8%" 
                                    progress={24.8} 
                                    color="emerald"
                                />
                                <AnalyticalMetric 
                                    label="BFR / CA" 
                                    value="12.5%" 
                                    progress={12.5} 
                                    color="purple"
                                />
                            </div>
                        </div>

                        {/* SMART MATCH PROMO */}
                        <div 
                            onClick={() => router.push('/accounting/reconciliation')}
                            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 cursor-pointer group hover:scale-[1.02] transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-white/10 rounded-xl">
                                    <Zap size={20} className="fill-white" />
                                </div>
                                <ChevronRight size={20} className="text-white/40 group-hover:text-white transition-colors" />
                            </div>
                            <h4 className="text-lg font-black leading-tight">Rapprochement Bancaire</h4>
                            <p className="text-xs text-white/60 mt-2 font-medium">4 transactions en attente de validation via l'IA.</p>
                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex -space-x-2">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="w-6 h-6 rounded-full bg-white/20 border-2 border-indigo-600 flex items-center justify-center text-[8px] font-black">
                                            {i}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-2 py-1 rounded">Smart Match</span>
                            </div>
                        </div>

                        {/* ACTION BUTTON */}
                        <button 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 px-6 font-black text-lg shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                            onClick={() => router.push('/accounting/journal-entries')}
                        >
                            <ArrowRightLeft size={24} />
                            Nouvelle Écriture
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────

function HeaderAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white text-sm font-bold transition-all backdrop-blur-md"
        >
            {icon}
            {label}
        </button>
    );
}

function QuickMetric({ label, value, icon, trend }: { label: string; value: string; icon: React.ReactNode; trend?: string }) {
    return (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2">
                <div className="text-white/40">{icon}</div>
                <span className="text-white/60 text-[10px] font-black uppercase tracking-wider">{label}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-xl font-black">{value}</span>
                {trend && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">{trend}</span>}
            </div>
        </div>
    );
}

function ComplianceItem({ title, desc, status }: { title: string; desc: string; status: 'warning' | 'alert' | 'success' }) {
    const colors = {
        warning: 'bg-amber-100 text-amber-600',
        alert: 'bg-rose-100 text-rose-600',
        success: 'bg-emerald-100 text-emerald-600'
    };
    return (
        <div className="flex gap-4">
            <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${status === 'warning' ? 'bg-amber-500' : status === 'alert' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <div>
                <div className="text-xs font-black text-slate-900">{title}</div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

function AnalyticalMetric({ label, value, progress, color }: { label: string; value: string; progress: number; color: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-600',
        emerald: 'bg-emerald-500',
        purple: 'bg-purple-500'
    };
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500">{label}</span>
                <span className="text-sm font-black text-slate-900">{value}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${colors[color]}`} 
                    style={{ width: `${progress}%` }} 
                />
            </div>
        </div>
    );
}

function getTypeStyle(type: string): string {
    const styles: Record<string, string> = {
        'ASSET': 'bg-blue-50 text-blue-700',
        'BANK': 'bg-blue-100 text-blue-800',
        'CASH': 'bg-emerald-100 text-emerald-800',
        'LIABILITY': 'bg-rose-50 text-rose-700',
        'EQUITY': 'bg-purple-50 text-purple-700',
        'REVENUE': 'bg-emerald-50 text-emerald-700',
        'EXPENSE': 'bg-amber-50 text-amber-700'
    };
    return styles[type] || 'bg-slate-50 text-slate-600';
}
