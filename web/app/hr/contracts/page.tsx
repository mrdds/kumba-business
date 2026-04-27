'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../dashboard-layout';
import { getEmployees } from '@/services/api';
import { 
    FileText, Search, Filter, Calendar, AlertCircle, 
    ChevronRight, User, Building2, Clock, CheckCircle,
    ArrowUpRight, Download, History, ShieldCheck
} from 'lucide-react';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';
import Link from 'next/link';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function ContractsPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getEmployees();
            setEmployees(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const calculateExpiry = (hireDate: string, durationMonths?: number) => {
        if (!hireDate || !durationMonths) return null;
        const date = new Date(hireDate);
        date.setMonth(date.getMonth() + durationMonths);
        return date;
    };

    const isExpiringSoon = (expiryDate: Date | null) => {
        if (!expiryDate) return false;
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        return expiryDate > today && expiryDate <= thirtyDaysFromNow;
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'ALL' || emp.contract_type === filterType;
        return matchesSearch && matchesType;
    });

    const stats = {
        total: employees.length,
        cdi: employees.filter(e => e.contract_type === 'CDI').length,
        cdd: employees.filter(e => e.contract_type === 'CDD').length,
        stage: employees.filter(e => e.contract_type === 'STAGE').length,
        expiring: employees.filter(e => {
            const expiry = calculateExpiry(e.hire_date, e.contract_duration);
            return isExpiringSoon(expiry);
        }).length
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className={clsx("text-4xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            Gestion des Contrats
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Suivi des engagements et échéances contractuelles
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-slate-50 text-slate-600 px-6 py-3.5 rounded-2xl flex items-center gap-2 hover:bg-slate-100 transition-all font-black text-xs uppercase tracking-widest border border-slate-100">
                            <Download size={16} />
                            Exporter
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatBox label="Contrats Actifs" value={stats.total} icon={<FileText />} color="indigo" />
                    <StatBox label="CDI (Indéterminé)" value={stats.cdi} icon={<ShieldCheck />} color="emerald" />
                    <StatBox label="CDD / Stages" value={stats.cdd + stats.stage} icon={<Clock />} color="amber" />
                    <StatBox label="Échéances 30j" value={stats.expiring} icon={<AlertCircle />} color="rose" alert={stats.expiring > 0} />
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Rechercher un collaborateur..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                        {['ALL', 'CDI', 'CDD', 'STAGE'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={clsx(
                                    "px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    filterType === type 
                                        ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20" 
                                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                )}
                            >
                                {type === 'ALL' ? 'Tous' : type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Contract List */}
                <div className="grid gap-4">
                    {filteredEmployees.length === 0 ? (
                        <div className="bg-slate-50 rounded-[40px] p-20 text-center border border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">Aucun contrat ne correspond à votre recherche</p>
                        </div>
                    ) : (
                        filteredEmployees.map((emp) => {
                            const expiryDate = calculateExpiry(emp.hire_date, emp.contract_duration);
                            const expiring = isExpiringSoon(expiryDate);
                            
                            return (
                                <div key={emp.id} className="group bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-100/50 transition-all flex flex-col lg:flex-row lg:items-center gap-8 relative overflow-hidden">
                                    <div className={clsx(
                                        "absolute left-0 top-0 bottom-0 w-1.5 transition-opacity",
                                        emp.contract_type === 'CDI' ? 'bg-emerald-500' : 
                                        emp.contract_type === 'CDD' ? 'bg-indigo-500' : 'bg-amber-500'
                                    )} />

                                    <div className="flex items-center gap-5 flex-1 min-w-0">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                                            {emp.avatar ? <img src={emp.avatar} className="h-full w-full object-cover rounded-2xl" /> : <User size={24} />}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className={clsx("text-lg font-black text-slate-900 tracking-tight truncate", displayFont.className)}>
                                                {emp.first_name} {emp.last_name}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                    <Building2 size={12} /> {emp.department || 'Non assigné'}
                                                </span>
                                                <span className="h-1 w-1 bg-slate-200 rounded-full" />
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{emp.position || emp.job_title}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-8 lg:gap-12">
                                        <div className="w-32">
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Type Contrat</p>
                                            <span className={clsx(
                                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                                emp.contract_type === 'CDI' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                emp.contract_type === 'CDD' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                                                "bg-amber-50 text-amber-700 border-amber-100"
                                            )}>
                                                {emp.contract_type}
                                            </span>
                                        </div>

                                        <div className="w-40">
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Date Embauche</p>
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                <Calendar size={14} className="text-slate-300" />
                                                {new Date(emp.hire_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </div>

                                        <div className="w-48">
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Échéance</p>
                                            {emp.contract_type === 'CDI' ? (
                                                <span className="text-xs font-bold text-slate-400 italic">Sans fin déterminée</span>
                                            ) : (
                                                <div className={clsx(
                                                    "flex items-center gap-2 text-sm font-bold",
                                                    expiring ? "text-rose-600" : "text-slate-700"
                                                )}>
                                                    <Clock size={14} className={expiring ? "text-rose-600" : "text-slate-300"} />
                                                    {expiryDate?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    {expiring && <div className="h-2 w-2 bg-rose-500 rounded-full animate-pulse" />}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Link href={`/hr/employees/${emp.id}`} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                                <History size={18} />
                                            </Link>
                                            <Link href={`/hr/employees/${emp.id}`} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 group-hover:translate-x-1">
                                                <ChevronRight size={18} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

function StatBox({ label, value, icon, color, alert }: any) {
    return (
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={clsx("absolute -right-6 -top-6 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity", 
                color === 'indigo' ? 'bg-indigo-600' : color === 'emerald' ? 'bg-emerald-600' : color === 'amber' ? 'bg-amber-600' : 'bg-rose-600'
            )} />
            <div className="flex justify-between items-start mb-4">
                <div className={clsx("p-3 rounded-2xl", 
                    color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 
                    color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
                    color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                )}>
                    {icon}
                </div>
                {alert && <div className="h-2.5 w-2.5 bg-rose-500 rounded-full animate-pulse" />}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <h3 className={clsx("text-2xl font-black text-slate-900 tracking-tight", displayFont.className)}>{value}</h3>
        </div>
    );
}
