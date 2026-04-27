'use client';

import { useState, useEffect } from 'react';
import { getAttendance, getAdvances, approveAdvance, rejectAdvance, getEmployees, getPayrolls } from '../../services/api';
import DashboardLayout from '../dashboard-layout';
import { useTranslation } from 'react-i18next';
import { useNotification } from '@/context/NotificationContext';
import { usePreferences } from '@/context/PreferencesContext';
import { 
    Loader2, Users, Calendar, Banknote, Clock, ArrowUpRight, 
    CheckCircle, XCircle, UserCheck, Timer, ChevronRight, TrendingUp
} from 'lucide-react';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';
import Link from 'next/link';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function HRPage() {
    const { t } = useTranslation();
    const { showToast } = useNotification();
    const { formatCurrency } = usePreferences();
    
    const [attendance, setAttendance] = useState([]);
    const [advances, setAdvances] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            const [att, adv, emp, pay] = await Promise.all([
                getAttendance(), 
                getAdvances(),
                getEmployees(),
                getPayrolls()
            ]);
            setAttendance(att);
            setAdvances(adv);
            setEmployees(emp);
            setPayrolls(pay);
        } catch (error) {
            console.error('Failed to fetch HR data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (id: number) => {
        setActionLoading(id);
        try {
            await approveAdvance(id);
            showToast(t('hr.advances.toast.approve_success'), 'success');
            await fetchData();
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: number) => {
        setActionLoading(id);
        try {
            await rejectAdvance(id);
            showToast(t('hr.advances.toast.reject_success'), 'success');
            await fetchData();
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin text-slate-900" size={40} />
            </div>
        </DashboardLayout>
    );

    const activeEmployees = employees.filter((e: any) => e.status === 'ACTIVE').length;
    const latestPayroll = payrolls[0] || { total_amount: 0 };
    const pendingAdvances = advances.filter((a: any) => a.status === 'PENDING').length;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className={clsx("text-4xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            Tableau de Bord RH
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Vue d'ensemble de votre capital humain
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/hr/employees/create" className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 font-black text-xs uppercase tracking-widest">
                            <Users size={16} />
                            Recrutement
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        icon={<Users className="text-indigo-600" size={20} />} 
                        label="Effectif Total" 
                        value={employees.length} 
                        subLabel={`${activeEmployees} actifs`}
                        color="indigo"
                        link="/hr/employees"
                    />
                    <StatCard 
                        icon={<Timer className="text-emerald-600" size={20} />} 
                        label="Présence du Jour" 
                        value={`${Math.round((attendance.length / (employees.length || 1)) * 100)}%`} 
                        subLabel={`${attendance.length} pointages`}
                        color="emerald"
                    />
                    <StatCard 
                        icon={<Banknote className="text-amber-600" size={20} />} 
                        label="Dernière Paie" 
                        value={formatCurrency(Number(latestPayroll.total_amount || 0))} 
                        subLabel="Run mensuel"
                        color="amber"
                        link="/hr/payroll"
                    />
                    <StatCard 
                        icon={<Clock className="text-rose-600" size={20} />} 
                        label="Acomptes" 
                        value={pendingAdvances} 
                        subLabel="En attente"
                        color="rose"
                        link="/hr/advances"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Attendance Panel */}
                    <Panel title="Pointages Récents" icon={<Timer size={18} />} link="/hr/attendance">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left">
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Collaborateur</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Entrée</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {attendance.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="py-12 text-center text-slate-400 font-medium text-sm italic">
                                                Aucun pointage aujourd'hui
                                            </td>
                                        </tr>
                                    ) : (
                                        attendance.slice(0, 6).map((rec: any) => (
                                            <tr key={rec.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                            <UserCheck size={14} />
                                                        </div>
                                                        <span className="font-black text-slate-900 text-sm">{rec.employee_name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-center">
                                                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{rec.check_in || '--:--'}</span>
                                                </td>
                                                <td className="py-4 text-center">
                                                    <span className={clsx(
                                                        "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                        rec.status === 'LATE' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    )}>
                                                        {rec.status === 'LATE' ? 'Retard' : 'Présent'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Panel>

                    {/* Salary Advances Panel */}
                    <Panel title="Demandes d'Acomptes" icon={<Banknote size={18} />} link="/hr/advances">
                        <div className="space-y-4">
                            {advances.filter((a:any) => a.status === 'PENDING').length === 0 ? (
                                <div className="py-12 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100">
                                    <CheckCircle className="mx-auto text-emerald-200 mb-3" size={32} />
                                    <p className="text-slate-400 font-bold text-sm tracking-tight">Toutes les demandes sont traitées</p>
                                </div>
                            ) : (
                                advances.filter((a:any) => a.status === 'PENDING').slice(0, 3).map((adv: any) => (
                                    <div key={adv.id} className="group bg-white border border-slate-100 rounded-[28px] p-5 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100/50 transition-all">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                                    <Clock size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm tracking-tight">{adv.employee_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{adv.request_date}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={clsx("text-lg font-black text-slate-900 tracking-tighter", displayFont.className)}>{formatCurrency(Number(adv.amount))}</p>
                                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">En Attente</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(adv.id)}
                                                disabled={actionLoading === adv.id}
                                                className="flex-1 bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                            >
                                                {actionLoading === adv.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                Approuver
                                            </button>
                                            <button
                                                onClick={() => handleReject(adv.id)}
                                                disabled={actionLoading === adv.id}
                                                className="flex-1 bg-white text-rose-600 border border-slate-100 py-3 rounded-xl hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                            >
                                                {actionLoading === adv.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                                Rejeter
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Panel>
                </div>
            </div>
        </DashboardLayout>
    );
}

function StatCard({ icon, label, value, subLabel, color, link }: any) {
    const CardContent = (
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100/50 transition-all group relative overflow-hidden">
            <div className={clsx("absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity", 
                color === 'indigo' ? 'bg-indigo-600' : 
                color === 'emerald' ? 'bg-emerald-600' : 
                color === 'amber' ? 'bg-amber-600' : 'bg-rose-600'
            )}></div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className={clsx("p-3 rounded-2xl", 
                    color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 
                    color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
                    color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                )}>{icon}</div>
                {link && <ArrowUpRight size={16} className="text-slate-300 group-hover:text-slate-900 transition-colors" />}
            </div>
            
            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <h3 className={clsx("text-2xl font-black text-slate-900 tracking-tighter", displayFont.className)}>{value}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{subLabel}</p>
            </div>
        </div>
    );

    return link ? <Link href={link}>{CardContent}</Link> : CardContent;
}

function Panel({ title, icon, children, link }: any) {
    return (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                        {icon}
                    </div>
                    <h3 className={clsx("text-xl font-black text-slate-900 tracking-tight", displayFont.className)}>{title}</h3>
                </div>
                {link && (
                    <Link href={link} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 hover:gap-2 transition-all">
                        Tout voir
                        <ChevronRight size={14} />
                    </Link>
                )}
            </div>
            {children}
        </div>
    );
}
