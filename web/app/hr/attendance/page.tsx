'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../dashboard-layout';
import { getAttendance, getEmployees, getUserProfile } from '@/services/api';
import { 
    Clock, Calendar, UserCheck, UserX, AlertCircle, 
    Search, Filter, ArrowLeft, Download, MapPin,
    ChevronRight, Timer, Users, UserMinus
} from 'lucide-react';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';
import Link from 'next/link';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function AttendancePage() {
    const [attendance, setAttendance] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [companyInfo, setCompanyInfo] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [attData, empData, userData] = await Promise.all([
                getAttendance(),
                getEmployees(),
                getUserProfile()
            ]);
            setAttendance(attData);
            setEmployees(empData);
            if (userData?.company) setCompanyInfo(userData.company);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const groupedByDept = employees.reduce((acc: any, emp: any) => {
        const dept = emp.department || 'Général';
        if (!acc[dept]) acc[dept] = [];
        
        const record = attendance.find((a: any) => a.employee_id === emp.id);
        acc[dept].push({ ...emp, attendance: record });
        return acc;
    }, {});

    const sortedDepts = Object.keys(groupedByDept).sort();

    const stats = {
        total: employees.length,
        present: attendance.length,
        late: attendance.filter((a: any) => a.status === 'LATE').length,
        absent: employees.length - attendance.length
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <Link href="/hr" className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest mb-4">
                            <ArrowLeft size={14} /> Dashboard RH
                        </Link>
                        <h1 className={clsx("text-4xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            Registre de Présence
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Pointages en temps réel et historique
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-white border border-slate-100 p-2 rounded-2xl flex items-center gap-2 shadow-sm">
                            <Calendar size={18} className="text-slate-400 ml-2" />
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="border-none bg-transparent font-black text-xs uppercase tracking-widest outline-none text-slate-900 pr-4 py-2"
                            />
                        </div>
                        <button className="bg-slate-900 text-white px-6 py-4 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 font-black text-xs uppercase tracking-widest">
                            <Download size={16} />
                            Rapport
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatBox label="Total Effectif" value={stats.total} icon={<Users />} color="slate" />
                    <StatBox label="Présents" value={stats.present} icon={<UserCheck />} color="emerald" />
                    <StatBox label="En Retard" value={stats.late} icon={<Clock />} color="amber" />
                    <StatBox label="Absents" value={stats.absent} icon={<UserMinus />} color="rose" alert={stats.absent > 0} />
                </div>

                {/* Search & Filter */}
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
                </div>

                {/* Attendance Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {sortedDepts.map(dept => {
                            const filtered = groupedByDept[dept].filter((emp: any) => 
                                `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
                            );
                            
                            if (filtered.length === 0) return null;

                            return (
                                <div key={dept} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <p className={clsx("text-[10px] font-black text-slate-800 uppercase tracking-[3px]", displayFont.className)}>
                                            {dept}
                                        </p>
                                        <div className="h-px flex-grow bg-slate-100"></div>
                                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                            {filtered.length} Collaborateurs
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {filtered.map((emp: any) => (
                                            <AttendanceCard key={emp.id} emp={emp} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function StatBox({ label, value, icon, color, alert }: any) {
    return (
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={clsx("absolute -right-6 -top-6 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity", 
                color === 'emerald' ? 'bg-emerald-600' : color === 'amber' ? 'bg-amber-600' : color === 'rose' ? 'bg-rose-600' : 'bg-slate-600'
            )} />
            <div className="flex justify-between items-start mb-4">
                <div className={clsx("p-3 rounded-2xl", 
                    color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
                    color === 'amber' ? 'bg-amber-50 text-amber-600' : 
                    color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'
                )}>
                    {icon}
                </div>
                {alert && <div className="h-2 w-2 bg-rose-500 rounded-full animate-pulse" />}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <h3 className={clsx("text-2xl font-black text-slate-900 tracking-tight", displayFont.className)}>{value}</h3>
        </div>
    );
}

function AttendanceCard({ emp }: { emp: any }) {
    const isPresent = !!emp.attendance;
    const isLate = emp.attendance?.status === 'LATE';

    return (
        <div className="group bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-100/50 transition-all flex items-center gap-5">
            <div className="relative shrink-0">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                    {emp.avatar ? <img src={emp.avatar} className="h-full w-full object-cover rounded-2xl" /> : <Users size={24} />}
                </div>
                <div className={clsx(
                    "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white flex items-center justify-center",
                    isPresent ? (isLate ? "bg-amber-500" : "bg-emerald-500") : "bg-rose-500"
                )}>
                    {isPresent ? <CheckCircle className="text-white" size={8} /> : <UserX className="text-white" size={8} />}
                </div>
            </div>

            <div className="flex-grow min-w-0">
                <h3 className={clsx("text-base font-black text-slate-900 tracking-tight truncate", displayFont.className)}>
                    {emp.first_name} {emp.last_name}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.position || 'Collaborateur'}</span>
                    <span className="h-1 w-1 bg-slate-200 rounded-full" />
                    <span className={clsx(
                        "text-[10px] font-black uppercase tracking-widest",
                        isPresent ? (isLate ? "text-amber-600" : "text-emerald-600") : "text-rose-600"
                    )}>
                        {isPresent ? (isLate ? `Retard (${emp.attendance.check_in})` : `Présent (${emp.attendance.check_in})`) : "Absent"}
                    </span>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
                {emp.attendance?.work_site_name && (
                    <div className="flex items-center gap-1 text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                        <MapPin size={10} /> {emp.attendance.work_site_name}
                    </div>
                )}
                <button className="p-2.5 text-slate-300 hover:text-slate-900 transition-colors">
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}
