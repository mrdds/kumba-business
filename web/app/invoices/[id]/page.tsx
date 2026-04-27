'use client';
import { useParams, useRouter } from 'next/navigation';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getInvoice } from '@/services/finance.service';
import DashboardLayout from '../../dashboard-layout';
import { ApprovalBanner } from '@/components/approvals/ApprovalBanner';
import TimelineModal from '@/components/approvals/TimelineModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
    Printer, ArrowLeft, Mail, Download, 
    History, MapPin, Calendar, Hash, User,
    QrCode, ExternalLink, ShieldCheck, Sparkles,
    FileText, Clock, BadgeCheck, MoreVertical
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { useTranslation } from 'react-i18next';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);

    const { data: invoice, loading, refetch } = useApiQuery(
        () => getInvoice(Number(params.id)),
        [params.id],
        { enabled: !!params.id }
    );

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center gap-4 mb-10">
                    <Skeleton.Box className="h-12 w-12 rounded-2xl" />
                    <Skeleton.Box className="h-10 w-64" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Skeleton.Box className="h-[800px] w-full rounded-[40px]" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton.Box className="h-64 w-full rounded-[32px]" />
                        <Skeleton.Box className="h-64 w-full rounded-[32px]" />
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!invoice) return <DashboardLayout>Invoice not found</DashboardLayout>;

    const approvalId = invoice.approval_id || 100 + Number(params.id);
    const currentStatus = (invoice.approval_status || invoice.status || 'draft').toLowerCase();
    const currentLevel = invoice.approval_level || 1;
    const rejectionReason = invoice.rejection_reason;

    return (
        <DashboardLayout>
            <TimelineModal 
                isOpen={isTimelineOpen} 
                onClose={() => setIsTimelineOpen(false)} 
                approvalId={approvalId} 
            />

            <div className="max-w-7xl mx-auto space-y-10 pb-20">
                
                {/* --- MASTERPIECE ACTIONS BAR --- */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => router.back()}
                            className="h-14 w-14 flex items-center justify-center bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-100 text-slate-400 hover:text-blue-600 transition-all shadow-sm group"
                        >
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className={clsx("text-3xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                                    Facture #{invoice.id}
                                </h1>
                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    v2.4
                                </span>
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                <User size={14} /> {invoice.client_name}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button 
                            onClick={() => setIsTimelineOpen(true)}
                            className="h-12 px-6 bg-white border-2 border-slate-100 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-100 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm"
                        >
                            <History size={18} /> Workflow
                        </button>
                        <a 
                            href={`/invoices/${invoice.id}/print`}
                            target="_blank"
                            className="h-12 px-6 bg-white border-2 border-slate-100 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-100 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm"
                        >
                            <Printer size={18} /> Imprimer
                        </a>
                        <button className="h-12 px-6 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-900/20">
                            <Download size={18} /> Télécharger
                        </button>
                        <button className="h-12 px-8 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-600/30">
                            <Mail size={18} /> Envoyer
                        </button>
                        <button className="h-12 w-12 flex items-center justify-center bg-white border-2 border-slate-100 rounded-xl text-slate-300 hover:text-slate-900 transition-all shadow-sm">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>

                {/* --- APPROVAL BANNER --- */}
                <div className="animate-in slide-in-from-top-4 duration-500">
                    <ApprovalBanner 
                        approvalId={approvalId}
                        status={currentStatus as any}
                        currentLevel={currentLevel}
                        rejectionReason={rejectionReason}
                        userRole={user?.role || 'MANAGER'}
                        onSuccess={refetch}
                        onRectify={() => router.push(`/invoices/${invoice.id}/edit`)}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    
                    {/* --- MAIN INVOICE DOCUMENT --- */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                            
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 rounded-full -mr-32 -mt-32 blur-3xl" />
                            
                            <div className="p-12 md:p-20 relative z-10">
                                
                                {/* Doc Header */}
                                <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-20">
                                    <div className="space-y-6">
                                        <div className="h-16 w-16 bg-blue-600 rounded-[24px] flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-blue-600/40">
                                            {user?.company?.name?.substring(0, 2).toUpperCase() || 'OS'}
                                        </div>
                                        <div>
                                            <h3 className={clsx("text-2xl font-black text-slate-900 tracking-tight mb-2", displayFont.className)}>
                                                {user?.company?.name || 'Export Corp SARL'}
                                            </h3>
                                            <p className="text-sm text-slate-500 font-bold leading-relaxed max-w-[240px]">
                                                {user?.company?.address || 'Cocody, Cite Arts, Abidjan'}<br />
                                                {user?.company?.phone || '+225 01 02 03 04 05'}<br />
                                                <span className="text-[10px] text-slate-300 uppercase tracking-widest mt-2 block">
                                                    RCCM: {user?.company?.rccm || 'CI-ABJ-03-2023-B13'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right space-y-6">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-300 block mb-3 italic">Facture à</span>
                                            <h3 className={clsx("text-2xl font-black text-slate-900", displayFont.className)}>{invoice.client_name}</h3>
                                            <p className="text-sm font-bold text-slate-500 mt-1">{invoice.client_email}</p>
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                            <BadgeCheck size={16} className="text-blue-500" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Vérifié</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Doc Meta Bar */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 mb-16">
                                    <DocMeta label="Date Facture" value={invoice.date} icon={<Calendar size={14} />} />
                                    <DocMeta label="Échéance" value={invoice.due_date || 'N/A'} icon={<Clock size={14} />} />
                                    <DocMeta label="Numéro" value={`FA-${invoice.id}`} icon={<Hash size={14} />} />
                                    <DocMeta label="Statut" value={invoice.status} icon={<ShieldCheck size={14} />} isStatus />
                                </div>

                                {/* Items Table */}
                                <div className="mb-20">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b-2 border-slate-100">
                                                <th className="text-left py-6 font-black text-[10px] uppercase tracking-[3px] text-slate-400">Description des Services</th>
                                                <th className="text-center py-6 font-black text-[10px] uppercase tracking-[3px] text-slate-400">Qté</th>
                                                <th className="text-right py-6 font-black text-[10px] uppercase tracking-[3px] text-slate-400">Prix Unit.</th>
                                                <th className="text-right py-6 font-black text-[10px] uppercase tracking-[3px] text-slate-400">Total H.T</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {invoice.items?.map((item: any, i: number) => (
                                                <tr key={i} className="group">
                                                    <td className="py-8 pr-10">
                                                        <p className="font-black text-slate-900 text-lg leading-snug group-hover:text-blue-600 transition-colors">{item.description}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Détails de la prestation incluse</p>
                                                    </td>
                                                    <td className="py-8 text-center">
                                                        <span className="inline-flex px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-black text-slate-600 border border-slate-100">
                                                            {item.quantity}
                                                        </span>
                                                    </td>
                                                    <td className="py-8 text-right font-bold text-slate-400 text-sm">
                                                        {formatCurrency(item.unit_price, user?.company?.currency)}
                                                    </td>
                                                    <td className="py-8 text-right">
                                                        <div className={clsx("text-xl font-black text-slate-900 tracking-tighter", displayFont.className)}>
                                                            {formatCurrency(item.amount, user?.company?.currency)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer Summary */}
                                <div className="flex flex-col md:flex-row justify-between items-end gap-12 pt-12 border-t-4 border-slate-50">
                                    <div className="flex-1 bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 w-full">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                                                <Sparkles size={16} />
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes & Instructions</h4>
                                        </div>
                                        <p className="text-xs text-slate-500 font-bold leading-relaxed italic">
                                            Veuillez mentionner le numéro de facture <span className="text-slate-900">#{invoice.id}</span> lors de votre virement bancaire.<br />
                                            Le paiement est attendu sous 30 jours à compter de la date d'émission.<br />
                                            Merci pour votre confiance renouvelée.
                                        </p>
                                    </div>
                                    
                                    <div className="w-full md:w-96 space-y-4">
                                        <div className="flex justify-between items-center text-sm px-4">
                                            <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Sous-total H.T</span>
                                            <span className="font-black text-slate-900">{formatCurrency(invoice.total_amount, user?.company?.currency)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm px-4">
                                            <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">TVA (18%)</span>
                                            <span className="font-black text-slate-900">{formatCurrency(invoice.total_amount * 0.18, user?.company?.currency)}</span>
                                        </div>
                                        <div className="p-8 bg-blue-600 rounded-[32px] text-white shadow-2xl shadow-blue-600/30 group hover:scale-[1.02] transition-transform">
                                            <div className="flex justify-between items-center">
                                                <span className="font-black text-[10px] uppercase tracking-[3px] opacity-80">TOTAL T.T.C</span>
                                                <div className={clsx("text-4xl font-black tracking-tighter", displayFont.className)}>
                                                    {formatCurrency(invoice.total_amount * 1.18, user?.company?.currency)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- SIDEBAR INFOS --- */}
                    <div className="space-y-8">
                        
                        {/* Normalization Card */}
                        {(currentStatus === 'approved' || currentStatus === 'sent' || currentStatus === 'paid') && (
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] shadow-2xl p-8 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-2 bg-white/10 rounded-xl">
                                            <QrCode size={24} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-[2px] text-blue-100">Facture Normalisée</h4>
                                            <p className="text-[10px] font-bold text-slate-400">Certification DGI / FNE</p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-3xl mb-8 mx-auto w-fit shadow-2xl shadow-black/40">
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=Invoice:${invoice.id}-DGI-Valid`} 
                                            alt="DGI QR Code"
                                            className="h-40 w-40 grayscale hover:grayscale-0 transition-all duration-700"
                                        />
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-2xl border border-white/5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Code DGI</span>
                                            <span className="text-xs font-black text-blue-400 tracking-widest">A01-230-FAV9</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-2xl border border-white/5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Statut</span>
                                            <span className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
                                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                                CERTIFIÉE
                                            </span>
                                        </div>
                                    </div>

                                    <button className="w-full py-4 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[3px] transition-all border border-white/10 flex items-center justify-center gap-2">
                                        Vérifier le timbre <ExternalLink size={14} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Payment Security */}
                        <div className="bg-blue-50 border border-blue-100 rounded-[40px] p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldCheck size={24} className="text-blue-600" />
                                <h4 className="font-black text-blue-900 text-sm tracking-tight">Paiement Sécurisé</h4>
                            </div>
                            <p className="text-xs text-blue-700/70 font-bold leading-relaxed mb-6">
                                Toutes vos transactions sont protégées par notre moteur de finance certifié. 
                                En cas de litige, contactez votre gestionnaire.
                            </p>
                            <button className="w-full py-3 bg-white text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all">
                                Contacter le Support
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function DocMeta({ label, value, icon, isStatus }: { label: string; value: string; icon: React.ReactNode; isStatus?: boolean }) {
    return (
        <div className="space-y-1.5">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                {icon} {label}
            </span>
            <div className={clsx("text-sm font-black tracking-tight", 
                isStatus ? "text-blue-600 uppercase" : "text-slate-900"
            )}>
                {value}
            </div>
        </div>
    );
}
}
