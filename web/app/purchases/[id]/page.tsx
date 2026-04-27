'use client';
import { use, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getPurchase, submitToApproval } from '@/services/finance.service';
import {
    ArrowLeft, History, Printer, Mail,
    User, Calendar, Hash, Projector,
    MoreVertical, Download, Clock
} from 'lucide-react';
import DashboardLayout from '@/app/dashboard-layout';
import { ApprovalBanner } from '@/components/approvals/ApprovalBanner';
import TimelineModal from '@/components/approvals/TimelineModal';
import { useNotification } from '@/context/NotificationContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/Skeleton';

export default function PurchaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const { showToast } = useNotification();
    const { t } = useTranslation();
    const router = useRouter();

    const [po, setPo] = useState < any > (null);
    const [loading, setLoading] = useState(true);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);

    const fetchPO = useCallback(async () => {
        try {
            const data = await getPurchase(parseInt(id));
            if (data.document_type === 'BILL') {
                router.replace(`/bills/${id}`);
                return;
            }
            setPo(data);
        } catch (error) {
            console.error(error);
            showToast('Erreur lors du chargement', 'error');
            router.push('/purchases');
        } finally {
            setLoading(false);
        }
    }, [id, router, showToast]);

    useEffect(() => {
        if (user && id) fetchPO();
    }, [user, id, fetchPO]);

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center gap-4 mb-8">
                <Skeleton.Box className="h-10 w-10 rounded-xl" />
                <Skeleton.Box className="h-8 w-64" />
            </div>
            <Skeleton.Box className="h-24 w-full rounded-3xl mb-8" />
            <Skeleton.Page />
        </DashboardLayout>
    );

    if (!po) return null;

    const approvalId = po.approval_id || 200 + po.id;
    const currentStatus = (po.approval_status || 'draft').toLowerCase();
    const rejectionReason = po.rejection_reason;
    const currentLevel = po.approval_level || 1;

    return (
        <DashboardLayout>
            <TimelineModal
                isOpen={isTimelineOpen}
                onClose={() => setIsTimelineOpen(false)}
                approvalId={approvalId}
            />

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all shadow-sm">
                        <ArrowLeft size={20} className="text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            Bon de Commande #{po.id}
                        </h1>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Projet: <span className="text-blue-600">{po.project_name}</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsTimelineOpen(true)}
                        className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-600 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm flex items-center gap-2 font-bold text-xs uppercase tracking-widest"
                    >
                        <History size={18} /> Historique
                    </button>
                    <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-600 transition-all shadow-sm">
                        <Printer size={20} />
                    </button>
                    <button className="p-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-900/10 flex items-center gap-2">
                        <Mail size={18} /> Envoyer au Fournisseur
                    </button>
                </div>
            </div>

            {/* Approval Banner */}
            <ApprovalBanner
                approvalId={approvalId}
                status={currentStatus as any}
                currentLevel={currentLevel}
                rejectionReason={rejectionReason}
                userRole={user?.role || 'MANAGER'}
                onSuccess={fetchPO}
                onRectify={() => router.push(`/purchases/${id}/edit`)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Main PO Card */}
                    <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-10 md:p-14">
                        <div className="flex justify-between items-start mb-20">
                            <div className="space-y-6">
                                <div className="h-16 w-16 bg-gray-900 rounded-[24px] flex items-center justify-center text-white font-black text-lg">
                                    OS
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-gray-900 tracking-tight">OurSpace Business</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-loose mt-2">
                                        Bon de Commande Externe<br />
                                        Réf: PO-{po.id}/2026
                                    </p>
                                </div>
                            </div>
                            <div className="text-right space-y-4">
                                <span className="text-[10px] font-black uppercase tracking-[4px] text-gray-300">Fournisseur</span>
                                <h3 className="font-black text-lg text-gray-900 tracking-tighter">{po.vendor_name}</h3>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100 text-[10px] font-black uppercase tracking-tighter text-gray-500">
                                    <User size={12} /> Contact Commercial
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto mb-20">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 italic">
                                        <th className="text-left py-6 font-black text-[10px] uppercase tracking-[3px] text-gray-300">Désignation</th>
                                        <th className="text-center py-6 font-black text-[10px] uppercase tracking-[3px] text-gray-300">Qté</th>
                                        <th className="text-right py-6 font-black text-[10px] uppercase tracking-[3px] text-gray-300">Prix Unit.</th>
                                        <th className="text-right py-6 font-black text-[10px] uppercase tracking-[3px] text-gray-300">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {po.items?.map((item: any) => (
                                        <tr key={item.id} className="group">
                                            <td className="py-8 pr-10">
                                                <p className="font-black text-gray-900 text-xs leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.description}</p>
                                            </td>
                                            <td className="py-8 text-center">
                                                <span className="inline-block px-4 py-1.5 bg-gray-50 rounded-2xl text-sm font-black text-gray-900">
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="py-8 text-right font-bold text-gray-400 text-xs">
                                                {formatCurrency(item.unit_price, user?.company?.currency)}
                                            </td>
                                            <td className="py-8 text-right font-black text-gray-900 text-xs tracking-tighter">
                                                {formatCurrency(item.amount, user?.company?.currency)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Summary */}
                        <div className="flex flex-col md:flex-row justify-between items-end gap-12 pt-12 border-t border-gray-100">
                            <div className="flex-1 space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[3px] text-gray-300">Clauses & Notes</h4>
                                <div className="p-6 bg-gray-50 rounded-[24px] border border-gray-100 border-dashed italic text-xs text-gray-500 leading-relaxed">
                                    {po.notes || 'Aucune instruction spécifique pour cette commande.'}
                                </div>
                            </div>
                            <div className="w-full md:w-96 space-y-4">
                                <div className="flex justify-between items-center text-sm font-bold text-gray-400">
                                    <span>SOUS-TOTAL</span>
                                    <span className="text-gray-900">{formatCurrency(po.total_amount, user?.company?.currency)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold text-gray-400">
                                    <span>TVA (0% - Export)</span>
                                    <span className="text-gray-900">0 F CFA</span>
                                </div>
                                <div className="flex justify-between items-center pt-6 border-t-2 border-gray-900">
                                    <span className="text-xs font-black uppercase tracking-[4px] text-gray-900">Total Net</span>
                                    <span className="text-lg font-black text-gray-900 tracking-tighter">
                                        {formatCurrency(po.total_amount, user?.company?.currency)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 space-y-8 sticky top-8">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[3px] text-gray-300 mb-6">Informations</h4>
                            <div className="space-y-6">
                                <InfoRow icon={<Calendar size={18} />} label="Date Commande" value={po.date} />
                                <InfoRow icon={<Clock size={18} />} label="Livraison Attendue" value={po.expected_date || 'ASAP'} />
                                <InfoRow icon={<Hash size={18} />} label="ID Système" value={`#ORD-${po.id}`} />
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-50">
                            <h4 className="text-[10px] font-black uppercase tracking-[3px] text-gray-300 mb-6">Validateurs Requis</h4>
                            <div className="space-y-4">
                                <ValidatorRow
                                    role="Manager"
                                    status={
                                        currentStatus === 'rejected' && currentLevel === 1 ? 'rejected' :
                                            currentLevel > 1 ? 'approved' :
                                                currentLevel === 1 && currentStatus !== 'draft' ? 'pending' : 'waiting'
                                    }
                                />
                                <ValidatorRow
                                    role="Finance"
                                    status={
                                        currentStatus === 'rejected' && currentLevel === 2 ? 'rejected' :
                                            currentLevel > 2 ? 'approved' :
                                                currentLevel === 2 && currentStatus !== 'draft' ? 'pending' : 'waiting'
                                    }
                                />
                                <ValidatorRow
                                    role="Direction"
                                    status={
                                        currentStatus === 'rejected' && currentLevel === 3 ? 'rejected' :
                                            currentLevel > 3 ? 'approved' :
                                                currentLevel === 3 && currentStatus !== 'draft' ? 'pending' : 'waiting'
                                    }
                                />
                            </div>
                        </div>

                        <button className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-gray-900 hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                            <Download size={16} /> Télécharger le PDF
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 leading-none mb-1">{label}</p>
                <p className="text-sm font-black text-gray-900">{value}</p>
            </div>
        </div>
    );
}

function ValidatorRow({ role, status }: { role: string; status: 'approved' | 'pending' | 'waiting' | 'rejected' }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-900 uppercase tracking-tighter">{role}</span>
            <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${status === 'approved' ? 'bg-green-100 text-green-700' :
                status === 'rejected' ? 'bg-red-100 text-red-700' :
                    status === 'pending' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-400'
                }`}>
                {status === 'approved' ? 'Validé' : status === 'rejected' ? 'Rejeté' : status === 'pending' ? 'Encours' : 'Attente'}
            </div>
        </div>
    );
}
