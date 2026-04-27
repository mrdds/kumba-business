'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../dashboard-layout';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { getEmployees } from '../../../services/api';
import { Users, Plus, Search, ChevronRight, LayoutGrid, List, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function EmployeeList() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { formatCurrency } = usePreferences();
    const [employees, setEmployees] = useState < any[] > ([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState < 'table' | 'grid' > ('table');
    const [filterDept, setFilterDept] = useState('all');

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await getEmployees();
                setEmployees(data);
            } catch (error) {
                console.error("Failed to fetch employees", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    const departments = ['all', ...new Set(employees.map(e => e.department).filter(Boolean))];

    const filteredEmployees = employees.filter(emp => {
        const matchSearch = `${emp.first_name} ${emp.last_name} ${emp.position} ${emp.department || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchDept = filterDept === 'all' || emp.department === filterDept;
        return matchSearch && matchDept;
    });

    const groupedEmployees = filteredEmployees.reduce((acc: any, emp) => {
        const dept = emp.department || 'Sans Département';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(emp);
        return acc;
    }, {});

    const sortedDepts = Object.keys(groupedEmployees).sort();

    const activeCount = employees.filter(e => e.status === 'ACTIVE').length;
    const deptCount = [...new Set(employees.map(e => e.department).filter(Boolean))].length;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className={clsx("text-3xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            {t('hr.employees.title')}
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                            {t('hr.employees.subtitle')}
                        </p>
                    </div>
                    <Link href="/hr/employees/create" className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 font-black text-sm uppercase tracking-widest">
                        <Plus size={18} />
                        {t('hr.employees.add_btn')}
                    </Link>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Effectif</p>
                        <p className={clsx("text-2xl font-black text-slate-900 tracking-tighter", displayFont.className)}>{employees.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Actifs</p>
                        <p className={clsx("text-2xl font-black text-emerald-600 tracking-tighter", displayFont.className)}>{activeCount}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Départements</p>
                        <p className={clsx("text-2xl font-black text-slate-900 tracking-tighter", displayFont.className)}>{deptCount}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Masse Salariale</p>
                        <p className={clsx("text-lg font-black text-slate-900 tracking-tighter", displayFont.className)}>
                            {formatCurrency(employees.reduce((acc, e) => acc + Number(e.base_salary || 0), 0), user?.company?.currency)}
                        </p>
                    </div>
                </div>

                {/* Toolbar: Search + Filters + View Toggle */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all outline-none text-sm font-bold text-slate-700"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={filterDept}
                            onChange={e => setFilterDept(e.target.value)}
                            className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                            {departments.map(d => (
                                <option key={d} value={d}>{d === 'all' ? 'Tous les départements' : d}</option>
                            ))}
                        </select>
                        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <button onClick={() => setViewMode('table')} className={clsx("p-3 transition-colors", viewMode === 'table' ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600")}>
                                <List size={16} />
                            </button>
                            <button onClick={() => setViewMode('grid')} className={clsx("p-3 transition-colors", viewMode === 'grid' ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600")}>
                                <LayoutGrid size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center p-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-16 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users size={28} className="text-slate-300" />
                        </div>
                        <h3 className={clsx("text-lg font-black text-slate-900 mb-1", displayFont.className)}>
                            {searchTerm ? 'Aucun résultat' : t('hr.employees.no_record_title')}
                        </h3>
                        <p className="text-slate-500 text-sm font-medium mb-4">
                            {searchTerm ? `Aucun collaborateur ne correspond à "${searchTerm}"` : t('hr.employees.no_record_desc')}
                        </p>
                        {!searchTerm && (
                            <Link href="/hr/employees/create" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
                                {t('hr.employees.add_btn')}
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-12">
                        {sortedDepts.map((dept) => (
                            <div key={dept} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <p style={{ fontSize: "10px" }} className={clsx("font-black text-slate-800 uppercase tracking-widest", displayFont.className)}>
                                        {dept}
                                    </p>
                                    <div className="h-px flex-grow bg-slate-100"></div>
                                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                        {groupedEmployees[dept].length} Collaborateur{groupedEmployees[dept].length > 1 ? 's' : ''}
                                    </span>
                                </div>

                                {viewMode === 'table' ? (
                                    /* ─── TABLE VIEW ─── */
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-100 bg-slate-50/30">
                                                        <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Collaborateur</th>
                                                        <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Contact</th>
                                                        <th className="text-right px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Salaire / mois</th>
                                                        <th className="text-center px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                                                        <th className="w-10"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {groupedEmployees[dept].map((emp: any) => (
                                                        <tr key={emp.id} className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/hr/employees/${emp.id}`}>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-10 w-10 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center shrink-0 border border-slate-100">
                                                                        {emp.photo_url ? (
                                                                            <img src={emp.photo_url} alt="" className="h-full w-full object-cover" />
                                                                        ) : (
                                                                            <span className="text-indigo-600 font-black text-sm">{emp.first_name?.[0]}{emp.last_name?.[0]}</span>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className={clsx("font-black text-slate-900 text-sm tracking-tight", displayFont.className)}>{emp.first_name} {emp.last_name}</p>
                                                                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{emp.position}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 hidden lg:table-cell">
                                                                <div className="space-y-0.5">
                                                                    <p className="text-xs font-medium text-slate-500 truncate max-w-[200px]">{emp.email || '—'}</p>
                                                                    <p className="text-[11px] font-medium text-slate-400">{emp.phone || ''}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-right">
                                                                <span className={clsx("text-sm font-black text-slate-900 tabular-nums", displayFont.className)}>
                                                                    {Number(emp.base_salary) > 0 ? formatCurrency(emp.base_salary, user?.company?.currency) : '—'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <span className={clsx(
                                                                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border inline-block",
                                                                    emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                        emp.status === 'SUSPENDED' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                            'bg-rose-50 text-rose-700 border-rose-100'
                                                                )}>
                                                                    {emp.status === 'ACTIVE' ? 'Actif' : emp.status}
                                                                </span>
                                                            </td>
                                                            <td className="pr-4">
                                                                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    /* ─── GRID VIEW ─── */
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {groupedEmployees[dept].map((emp: any) => (
                                            <Link key={emp.id} href={`/hr/employees/${emp.id}`}>
                                                <div className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-r" />
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="h-11 w-11 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center shrink-0 border border-slate-100">
                                                            {emp.photo_url ? (
                                                                <img src={emp.photo_url} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <span className="text-indigo-600 font-black text-sm">{emp.first_name?.[0]}{emp.last_name?.[0]}</span>
                                                            )}
                                                        </div>
                                                        <div className="overflow-hidden flex-grow">
                                                            <h3 className={clsx("font-black text-slate-900 text-sm tracking-tight truncate", displayFont.className)}>{emp.first_name} {emp.last_name}</h3>
                                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest truncate">{emp.position}</p>
                                                        </div>
                                                        <span className={clsx(
                                                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border shrink-0",
                                                            emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                                                        )}>
                                                            {emp.status === 'ACTIVE' ? 'Actif' : emp.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Salaire</p>
                                                            <p className={clsx("text-sm font-black text-slate-900 tracking-tighter", displayFont.className)}>
                                                                {Number(emp.base_salary) > 0 ? <>{formatCurrency(emp.base_salary, user?.company?.currency)} <span className="text-[10px] font-bold text-slate-400">/ mois</span></> : <span className="text-slate-300">—</span>}
                                                            </p>
                                                        </div>
                                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
