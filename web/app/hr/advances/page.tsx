'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../dashboard-layout';
import { getHRRequests } from '@/services/api';
import { Plus, Wallet, FileText, Calendar, Search, Filter, ChevronRight, Eye } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/utils/formatCurrency';
import { useAuth } from '@/context/AuthContext';
import ApprovalStatus from '@/components/ApprovalStatus';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/Skeleton';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function HRAdvancesListPage() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getHRRequests();
            // Filter only advances if needed, or show all HR requests
            setRequests(data.filter((r: any) => r.type === 'SALARY_ADVANCE'));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className={clsx("text-3xl font-black text-slate-900 tracking-tight", displayFont.className)}>Mes Acomptes</h1>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Historique des demandes d'avance</p>
                </div>
                <Link href="/hr/advances/create" className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 font-black text-sm uppercase tracking-widest">
                    <Plus size={20} />
                    Nouvelle Demande
                </Link>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton.Box key={i} className="h-24 w-full rounded-[32px]" />)}
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-white rounded-[40px] p-20 text-center border border-gray-100 shadow-sm">
                    <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <Wallet className="text-gray-200" size={32} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Aucune demande d'acompte</h3>
                    <p className="text-gray-500 text-sm mt-2">Vos demandes apparaîtront ici pour le suivi de validation.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map((request) => (
                        <div key={request.id} className="group bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="flex-grow flex items-start gap-4">
                                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                                    <Wallet size={24} />
                                </div>
                                <div>
                                    <h3 className={clsx("font-black text-slate-900 text-lg tracking-tight flex items-center gap-2", displayFont.className)}>
                                        Acompte sur Salaire
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{request.id}</span>
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-tighter">
                                            <Calendar size={14} className="opacity-40" />
                                            {request.date}
                                        </div>
                                        <ApprovalStatus status={request.status || 'DRAFT'} />
                                    </div>
                                    {request.reason && (
                                        <p className="text-xs text-gray-500 font-medium mt-2 line-clamp-1 italic">
                                            "{request.reason}"
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-10 w-full md:w-auto">
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Montant Demandé</p>
                                    <p className={clsx("text-2xl font-black text-slate-900 tracking-tighter", displayFont.className)}>
                                        {formatCurrency(Number(request.amount || 0), user?.company?.currency)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                        <Eye size={20} />
                                    </button>
                                    <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-900 transition-colors ml-2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
