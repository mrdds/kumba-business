'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../dashboard-layout';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { getPayrolls } from '../../../services/api';
import { FileText, Plus, Calendar, DollarSign, CheckCircle, Clock, ChevronRight, Users, TrendingUp, Banknote } from 'lucide-react';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function PayrollList() {
    const { user } = useAuth();
    const { formatCurrency } = usePreferences();
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayrolls = async () => {
            try {
                const data = await getPayrolls();
                setPayrolls(data);
            } catch (error) {
                console.error("Failed to fetch payrolls", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPayrolls();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatPeriod = (start: string, end: string) => {
        const s = new Date(start);
        const e = new Date(end);
        return `${s.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    };

    // Summary stats
    const totalPaid = payrolls.filter(p => p.status === 'PAID').reduce((acc, p) => acc + Number(p.total_amount), 0);
    const totalDraft = payrolls.filter(p => p.status === 'DRAFT').length;
    const totalEmployeesLastRun = payrolls[0]?.payslips?.length || 0;

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'PAID': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: CheckCircle, label: 'Payé' };
            case 'APPROVED': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: CheckCircle, label: 'Approuvé' };
            case 'DRAFT': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: Clock, label: 'Brouillon' };
            default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', icon: Clock, label: status };
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className={clsx("text-3xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            Gestion de la Paie
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Historique des runs de paie
                        </p>
                    </div>
                    <Link href="/hr/payroll/create" className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 font-black text-sm uppercase tracking-widest">
                        <Plus size={20} />
                        Lancer la Paie
                    </Link>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><Banknote size={20} /></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Décaissé</span>
                        </div>
                        <p className={clsx("text-2xl font-black text-slate-900 tracking-tighter", displayFont.className)}>
                            {formatCurrency(totalPaid, user?.company?.currency)}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Clock size={20} /></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Attente</span>
                        </div>
                        <p className={clsx("text-2xl font-black text-slate-900 tracking-tighter", displayFont.className)}>
                            {totalDraft} <span className="text-sm font-bold text-slate-400">runs</span>
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Users size={20} /></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dernier Effectif</span>
                        </div>
                        <p className={clsx("text-2xl font-black text-slate-900 tracking-tighter", displayFont.className)}>
                            {totalEmployeesLastRun} <span className="text-sm font-bold text-slate-400">employés</span>
                        </p>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center p-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                    </div>
                ) : payrolls.length === 0 ? (
                    <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 p-16 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText size={32} className="text-slate-300" />
                        </div>
                        <h3 className={clsx("text-xl font-black text-slate-900 mb-2", displayFont.className)}>Aucun run de paie</h3>
                        <p className="text-slate-500 font-medium mb-8">Vous n'avez pas encore lancé de paie.</p>
                        <Link href="/hr/payroll/create" className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all">
                            Lancer le premier run
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {payrolls.map((run) => {
                            const statusConfig = getStatusConfig(run.status);
                            const StatusIcon = statusConfig.icon;
                            return (
                                <Link href={`/hr/payroll/${run.id}`} key={run.id}>
                                    <div className="group bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        <div className="flex items-center gap-5 flex-grow">
                                            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <Banknote size={24} />
                                            </div>
                                            <div>
                                                <h3 className={clsx("font-black text-slate-900 text-lg tracking-tight", displayFont.className)}>
                                                    {formatPeriod(run.period_start, run.period_end)}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-4 mt-2">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                                        <Calendar size={12} />
                                                        <span>{formatDate(run.period_start)} — {formatDate(run.period_end)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                                        <Users size={12} />
                                                        <span>{run.payslips?.length || 0} bulletins</span>
                                                    </div>
                                                    <div className={clsx("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1", statusConfig.bg, statusConfig.text, statusConfig.border)}>
                                                        <StatusIcon size={10} />
                                                        {statusConfig.label}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Montant Net</p>
                                                <p className={clsx("text-2xl font-black text-slate-900 tracking-tighter", displayFont.className)}>
                                                    {formatCurrency(Number(run.total_amount), user?.company?.currency)}
                                                </p>
                                            </div>
                                            <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
