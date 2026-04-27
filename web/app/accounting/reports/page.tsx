'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboard-layout';
import { usePreferences } from '@/context/PreferencesContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, BarChart3, PieChart, TrendingUp, TrendingDown, Loader2, Download, Calendar } from 'lucide-react';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';
import api from '@/services/api';
import { exportToExcel } from '@/services/excelService';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

interface ReportLine {
    account_code: string;
    account_name: string;
    amount: number;
}

interface IncomeStatement {
    from_date: string;
    to_date: string;
    revenue_lines: ReportLine[];
    total_revenue: number;
    expense_lines: ReportLine[];
    total_expenses: number;
    net_profit: number;
}

interface BalanceSheet {
    as_of_date: string;
    asset_lines: ReportLine[];
    total_assets: number;
    liability_lines: ReportLine[];
    total_liabilities: number;
    equity_lines: ReportLine[];
    total_equity: number;
    is_balanced: boolean;
}

export default function FinancialReports() {
    const router = useRouter();
    const { user } = useAuth();
    const { formatCurrency } = usePreferences();
    const [activeReport, setActiveReport] = useState<'income' | 'balance'>('income');
    const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
    const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
    const [loading, setLoading] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const yearStart = `${new Date().getFullYear()}-01-01`;
    const [fromDate, setFromDate] = useState(yearStart);
    const [toDate, setToDate] = useState(today);

    const fetchIncomeStatement = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/reports/income-statement`, { params: { from_date: fromDate, to_date: toDate } });
            setIncomeStatement(res.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBalanceSheet = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/reports/balance-sheet`, { params: { as_of_date: toDate } });
            setBalanceSheet(res.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = () => {
        if (activeReport === 'income') fetchIncomeStatement();
        else fetchBalanceSheet();
    };

    const handleExport = () => {
        if (activeReport === 'income' && incomeStatement) {
            const data = [
                ...incomeStatement.revenue_lines.map(l => ({ Type: 'Produit', Code: l.account_code, Nom: l.account_name, Montant: l.amount })),
                { Type: 'TOTAL PRODUITS', Code: '', Nom: '', Montant: incomeStatement.total_revenue },
                ...incomeStatement.expense_lines.map(l => ({ Type: 'Charge', Code: l.account_code, Nom: l.account_name, Montant: l.amount })),
                { Type: 'TOTAL CHARGES', Code: '', Nom: '', Montant: incomeStatement.total_expenses },
                { Type: 'RESULTAT NET', Code: '', Nom: '', Montant: incomeStatement.net_profit }
            ];
            exportToExcel(data, `Compte_Resultat_${fromDate}_${toDate}`);
        } else if (activeReport === 'balance' && balanceSheet) {
             const data = [
                ...balanceSheet.asset_lines.map(l => ({ Type: 'Actif', Code: l.account_code, Nom: l.account_name, Montant: l.amount })),
                { Type: 'TOTAL ACTIFS', Code: '', Nom: '', Montant: balanceSheet.total_assets },
                ...balanceSheet.liability_lines.map(l => ({ Type: 'Passif', Code: l.account_code, Nom: l.account_name, Montant: l.amount })),
                { Type: 'TOTAL PASSIFS', Code: '', Nom: '', Montant: balanceSheet.total_liabilities },
                ...balanceSheet.equity_lines.map(l => ({ Type: 'Capitaux', Code: l.account_code, Nom: l.account_name, Montant: l.amount })),
                { Type: 'TOTAL CAPITAUX', Code: '', Nom: '', Montant: balanceSheet.total_equity }
            ];
            exportToExcel(data, `Bilan_${toDate}`);
        }
    };

    const fmtAmount = (amount: number) => formatCurrency(amount, user?.company?.currency);

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/accounting')} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className={clsx("text-3xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            États Financiers
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Bilan & Compte de Résultat
                        </p>
                    </div>
                </div>

                {/* Controls Card */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-6">
                    {/* Report Type Tabs */}
                    <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl w-fit">
                        <button
                            onClick={() => setActiveReport('income')}
                            className={clsx(
                                "px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-2",
                                activeReport === 'income'
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <BarChart3 size={16} />
                            Compte de Résultat
                        </button>
                        <button
                            onClick={() => setActiveReport('balance')}
                            className={clsx(
                                "px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-2",
                                activeReport === 'balance'
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <PieChart size={16} />
                            Bilan
                        </button>
                    </div>

                    {/* Date Filters */}
                    <div className="flex flex-wrap items-end gap-4">
                        {activeReport === 'income' && (
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Du</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all outline-none font-bold text-sm text-slate-700"
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">
                                {activeReport === 'income' ? 'Au' : 'Au'}
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all outline-none font-bold text-sm text-slate-700"
                            />
                        </div>
                        <button
                            onClick={handleGenerateReport}
                            disabled={loading}
                            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
                            {loading ? 'Génération...' : 'Générer'}
                        </button>
                        
                        {(incomeStatement || balanceSheet) && !loading && (
                            <button
                                onClick={handleExport}
                                className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                            >
                                <Download size={16} />
                                Exporter Excel
                            </button>
                        )}
                    </div>
                </div>

                {/* Report Display */}
                {loading && (
                    <div className="bg-white rounded-[32px] border border-slate-100 p-16 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                    </div>
                )}

                {!loading && activeReport === 'income' && incomeStatement && (
                    <IncomeStatementView data={incomeStatement} fmtAmount={fmtAmount} />
                )}

                {!loading && activeReport === 'balance' && balanceSheet && (
                    <BalanceSheetView data={balanceSheet} fmtAmount={fmtAmount} />
                )}

                {!loading && !incomeStatement && !balanceSheet && (
                    <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 p-16 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BarChart3 size={32} className="text-slate-300" />
                        </div>
                        <h3 className={clsx("text-xl font-black text-slate-900 mb-2", displayFont.className)}>
                            Aucun rapport généré
                        </h3>
                        <p className="text-slate-500 font-medium">
                            Sélectionnez une période et cliquez sur « Générer »
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function ReportLineRow({ line, fmtAmount }: { line: ReportLine; fmtAmount: (n: number) => string }) {
    return (
        <div className="flex justify-between items-center py-3 px-4 hover:bg-slate-50/80 rounded-xl transition-colors group">
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest w-16">{line.account_code}</span>
                <span className="text-sm font-bold text-slate-700">{line.account_name}</span>
            </div>
            <span className="text-sm font-black text-slate-900 tabular-nums">{fmtAmount(line.amount)}</span>
        </div>
    );
}

function IncomeStatementView({ data, fmtAmount }: { data: IncomeStatement; fmtAmount: (n: number) => string }) {
    const isProfit = data.net_profit >= 0;

    return (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className={clsx("text-xl font-black tracking-tight", displayFont.className)}>
                            Compte de Résultat
                        </h2>
                        <p className="text-sm font-bold text-white/60 mt-1 flex items-center gap-2">
                            <Calendar size={14} />
                            {new Date(data.from_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} — {new Date(data.to_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Résultat Net</p>
                        <p className={clsx("text-3xl font-black tracking-tighter", displayFont.className, isProfit ? "text-emerald-400" : "text-rose-400")}>
                            {fmtAmount(data.net_profit)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-8">
                {/* Revenue */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><TrendingUp size={16} /></div>
                        <h3 className={clsx("text-sm font-black text-slate-900 uppercase tracking-widest", displayFont.className)}>
                            Produits (Revenue)
                        </h3>
                    </div>
                    <div className="space-y-1">
                        {data.revenue_lines.map((line, idx) => (
                            <ReportLineRow key={idx} line={line} fmtAmount={fmtAmount} />
                        ))}
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 mt-2 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <span className="text-sm font-black text-emerald-700 uppercase tracking-widest">Total Produits</span>
                        <span className={clsx("text-lg font-black text-emerald-700 tabular-nums", displayFont.className)}>
                            {fmtAmount(data.total_revenue)}
                        </span>
                    </div>
                </div>

                {/* Expenses */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-rose-50 rounded-xl text-rose-600"><TrendingDown size={16} /></div>
                        <h3 className={clsx("text-sm font-black text-slate-900 uppercase tracking-widest", displayFont.className)}>
                            Charges (Expenses)
                        </h3>
                    </div>
                    <div className="space-y-1">
                        {data.expense_lines.map((line, idx) => (
                            <ReportLineRow key={idx} line={line} fmtAmount={fmtAmount} />
                        ))}
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 mt-2 bg-rose-50 rounded-2xl border border-rose-100">
                        <span className="text-sm font-black text-rose-700 uppercase tracking-widest">Total Charges</span>
                        <span className={clsx("text-lg font-black text-rose-700 tabular-nums", displayFont.className)}>
                            {fmtAmount(data.total_expenses)}
                        </span>
                    </div>
                </div>

                {/* Net Profit */}
                <div className={clsx(
                    "flex justify-between items-center py-6 px-8 rounded-[24px]",
                    isProfit ? "bg-emerald-600" : "bg-rose-600"
                )}>
                    <span className="text-sm font-black text-white/80 uppercase tracking-widest">Résultat Net</span>
                    <span className={clsx("text-3xl font-black text-white tracking-tighter", displayFont.className)}>
                        {fmtAmount(data.net_profit)}
                    </span>
                </div>
            </div>
        </div>
    );
}

function BalanceSheetView({ data, fmtAmount }: { data: BalanceSheet; fmtAmount: (n: number) => string }) {
    return (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-900 to-violet-900 text-white p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className={clsx("text-xl font-black tracking-tight", displayFont.className)}>
                            Bilan Comptable
                        </h2>
                        <p className="text-sm font-bold text-white/60 mt-1 flex items-center gap-2">
                            <Calendar size={14} />
                            Au {new Date(data.as_of_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    {data.is_balanced && (
                        <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl px-4 py-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-xs font-black text-emerald-300 uppercase tracking-widest">Équilibré</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Assets */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><TrendingUp size={16} /></div>
                        <h3 className={clsx("text-sm font-black text-slate-900 uppercase tracking-widest", displayFont.className)}>
                            Actifs
                        </h3>
                    </div>
                    <div className="space-y-1">
                        {data.asset_lines.map((line, idx) => (
                            <ReportLineRow key={idx} line={line} fmtAmount={fmtAmount} />
                        ))}
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <span className="text-sm font-black text-blue-700 uppercase tracking-widest">Total Actifs</span>
                        <span className={clsx("text-lg font-black text-blue-700 tabular-nums", displayFont.className)}>
                            {fmtAmount(data.total_assets)}
                        </span>
                    </div>
                </div>

                {/* Liabilities + Equity */}
                <div className="space-y-8">
                    {/* Liabilities */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-rose-50 rounded-xl text-rose-600"><TrendingDown size={16} /></div>
                            <h3 className={clsx("text-sm font-black text-slate-900 uppercase tracking-widest", displayFont.className)}>
                                Passifs
                            </h3>
                        </div>
                        <div className="space-y-1">
                            {data.liability_lines.map((line, idx) => (
                                <ReportLineRow key={idx} line={line} fmtAmount={fmtAmount} />
                            ))}
                        </div>
                        <div className="flex justify-between items-center py-3 px-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <span className="text-sm font-black text-rose-700 uppercase tracking-widest">Total Passifs</span>
                            <span className={clsx("text-lg font-black text-rose-700 tabular-nums", displayFont.className)}>
                                {fmtAmount(data.total_liabilities)}
                            </span>
                        </div>
                    </div>

                    {/* Equity */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-violet-50 rounded-xl text-violet-600"><PieChart size={16} /></div>
                            <h3 className={clsx("text-sm font-black text-slate-900 uppercase tracking-widest", displayFont.className)}>
                                Capitaux Propres
                            </h3>
                        </div>
                        <div className="space-y-1">
                            {data.equity_lines.map((line, idx) => (
                                <ReportLineRow key={idx} line={line} fmtAmount={fmtAmount} />
                            ))}
                        </div>
                        <div className="flex justify-between items-center py-3 px-4 bg-violet-50 rounded-2xl border border-violet-100">
                            <span className="text-sm font-black text-violet-700 uppercase tracking-widest">Total Capitaux</span>
                            <span className={clsx("text-lg font-black text-violet-700 tabular-nums", displayFont.className)}>
                                {fmtAmount(data.total_equity)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
