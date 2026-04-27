'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../dashboard-layout';
import { getCustomers } from '../../../services/api';
import { 
    Plus, Search, Mail, Phone, MapPin, 
    User, MoreHorizontal, Filter, ArrowUpRight, 
    TrendingUp, ShieldCheck, Star, Users, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function CustomersPage() {
    const { t } = useTranslation();
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const data = await getCustomers();
                setCustomers(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-1">
                        <h1 className={clsx("text-4xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            Gestion Clients (CRM)
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-[3px]">
                            Annuaire & Relation Partenaires
                        </p>
                    </div>
                    <Link href="/crm/customers/create" className="bg-slate-900 text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all active:scale-95">
                        <Plus size={18} />
                        Nouveau Client
                    </Link>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <SummaryStat label="Clients Actifs" value={customers.length} icon={<Users />} color="slate" />
                    <SummaryStat label="Nouveaux (30j)" value="+4" icon={<Star />} color="amber" />
                    <SummaryStat label="Valeur Vie Moy." value="1.2M" icon={<TrendingUp />} color="emerald" />
                    <SummaryStat label="Fiabilité" value="98%" icon={<ShieldCheck />} color="indigo" />
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, email, téléphone ou secteur..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        />
                    </div>
                    <button className="px-6 py-4 bg-slate-50 text-slate-400 rounded-[20px] flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                        <Filter size={16} />
                        Paramètres
                    </button>
                </div>

                {/* Customers Grid */}
                {loading ? (
                    <div className="py-32 flex justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filtered.map((customer) => (
                            <CustomerCard key={customer.id} customer={customer} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-[64px] p-32 text-center border-2 border-dashed border-slate-100">
                        <Sparkles size={64} className="mx-auto text-slate-200 mb-8" />
                        <h3 className={clsx("text-2xl font-black text-slate-900 mb-2", displayFont.className)}>Aucun Client Trouvé</h3>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-10">Commencez à bâtir votre annuaire partenaire</p>
                        <Link href="/crm/customers/create" className="bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-[2px] shadow-2xl shadow-slate-900/20">
                            Ajouter le premier client
                        </Link>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function SummaryStat({ label, value, icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
            <div className={clsx("absolute -right-4 -top-4 w-20 h-20 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity", 
                color === 'indigo' ? 'bg-indigo-600' : color === 'amber' ? 'bg-amber-600' : color === 'emerald' ? 'bg-emerald-600' : 'bg-slate-600'
            )} />
            <div className="flex items-center gap-4">
                <div className={clsx("p-3 rounded-2xl", 
                    color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 
                    color === 'amber' ? 'bg-amber-50 text-amber-600' : 
                    color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
                )}>{icon}</div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className={clsx("text-2xl font-black text-slate-900", displayFont.className)}>{value}</p>
                </div>
            </div>
        </div>
    );
}

function CustomerCard({ customer }: { customer: any }) {
    return (
        <Link href={`/crm/customers/${customer.id}`} className="group bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-slate-200/40 transition-all flex flex-col relative overflow-hidden">
            <div className="absolute right-0 top-0 p-8">
                <button className="h-10 w-10 flex items-center justify-center bg-slate-50 text-slate-300 hover:text-slate-900 rounded-xl transition-all">
                    <MoreHorizontal size={18} />
                </button>
            </div>

            <div className="flex items-center gap-6 mb-8">
                <div className="h-20 w-20 rounded-[28px] bg-slate-900 text-white flex items-center justify-center font-black text-3xl shadow-2xl shadow-slate-900/10 group-hover:rotate-3 transition-transform">
                    {customer.name[0]}
                </div>
                <div className="min-w-0">
                    <h3 className={clsx("text-xl font-black text-slate-900 tracking-tight truncate", displayFont.className)}>{customer.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest">{customer.tax_id || 'N/A'}</span>
                        <span className="h-1 w-1 bg-slate-200 rounded-full" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Compte Actif</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4 flex-grow">
                <ContactInfo icon={<Mail size={16} />} text={customer.email || 'Email non spécifié'} />
                <ContactInfo icon={<Phone size={16} />} text={customer.phone || 'N° non spécifié'} />
                <ContactInfo icon={<MapPin size={16} />} text={customer.address || 'Adresse non spécifiée'} />
            </div>

            <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                            P{i}
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                    Explorer <ArrowUpRight size={14} />
                </div>
            </div>
        </Link>
    );
}

function ContactInfo({ icon, text }: any) {
    return (
        <div className="flex items-center gap-3 text-slate-500 group-hover:text-slate-900 transition-colors">
            <div className="text-slate-300">{icon}</div>
            <span className="text-sm font-medium truncate">{text}</span>
        </div>
    );
}
