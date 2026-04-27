'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { getPurchases, deletePurchase } from '@/services/api';
import { Plus, Eye, Trash2, FileText, Calendar, User, Search, Filter, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/app/dashboard-layout';
import Link from 'next/link';
import ConfirmationModal from '@/components/ConfirmationModal';
import { formatCurrency } from '@/utils/formatCurrency';
import { useTranslation } from 'react-i18next';
import ApprovalStatus from '@/components/ApprovalStatus';
import { Skeleton } from '@/components/ui/Skeleton';

export default function PurchasesPage() {
    const { user } = useAuth();
    const { showToast } = useNotification();
    const { t } = useTranslation();
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, id: number | null }>({ isOpen: false, id: null });

    const fetchPurchases = async () => {
        try {
            const data = await getPurchases();
            const pos = data.filter((p: any) => p.document_type !== 'BILL');
            setPurchases(pos);
        } catch (error) {
            console.error('Failed to fetch purchases', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchPurchases();
        }
    }, [user]);

    const handleConfirmDelete = async () => {
        if (!confirmModal.id) return;
        const id = confirmModal.id;
        setDeletingId(id);
        try {
            await deletePurchase(id);
            setPurchases(prev => prev.filter(p => p.id !== id));
            showToast('Achat supprimé', 'success');
        } catch {
            showToast('Erreur lors de la suppression', 'error');
        } finally {
            setDeletingId(null);
            setConfirmModal({ isOpen: false, id: null });
        }
    };

    return (
        <DashboardLayout>
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null })}
                onConfirm={handleConfirmDelete}
                title="Supprimer la commande"
                message="Cette action est irréversible. Voulez-vous continuer ?"
                confirmText="Supprimer"
                isDanger={true}
                isLoading={deletingId === confirmModal.id}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">{t('purchases.title')}</h1>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Gestion des bons de commande</p>
                </div>
                <Link href="/purchases/create" className="bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-gray-900/10 font-black text-sm">
                    <Plus size={20} />
                    {t('purchases.create')}
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="flex items-center gap-2 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher par projet, fournisseur..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium"
                    />
                </div>
                <button className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors shadow-sm">
                    <Filter size={20} />
                </button>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => <Skeleton.Box key={i} className="h-24 w-full rounded-2xl" />)}
                </div>
            ) : purchases.length === 0 ? (
                <div className="bg-white rounded-[32px] p-20 text-center border border-gray-100 shadow-sm">
                    <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <FileText className="text-gray-200" size={32} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{t('purchases.no_records.title')}</h3>
                    <p className="text-gray-500 text-sm mt-2">{t('purchases.no_records.subtitle')}</p>
                </div>
            ) : (
                <div className="grid gap-4 mt-8">
                    {purchases.map((po) => (
                        <div key={po.id} className="group bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <Link href={`/purchases/${po.id}`} className="flex-grow flex items-start gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-lg tracking-tight flex items-center gap-2">
                                        {po.project_name}
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">#{po.id}</span>
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-tighter">
                                            <User size={14} className="opacity-40" />
                                            {po.vendor_name}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-tighter">
                                            <Calendar size={14} className="opacity-40" />
                                            {po.date}
                                        </div>
                                        <ApprovalStatus 
                                            status={po.approval_status || po.status || 'DRAFT'} 
                                            reason={po.rejection_reason}
                                        />
                                    </div>
                                </div>
                            </Link>

                            <div className="flex items-center justify-between md:justify-end gap-10 w-full md:w-auto">
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest mb-1">Montant Total</p>
                                    <p className="text-lg font-black text-gray-900 tracking-tighter">
                                        {formatCurrency(Number(po.total_amount || 0), user?.company?.currency)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link 
                                        href={`/purchases/${po.id}`}
                                        className="p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    >
                                        <Eye size={20} />
                                    </Link>
                                    <button
                                        onClick={(e) => { e.preventDefault(); setConfirmModal({ isOpen: true, id: po.id }); }}
                                        className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <Link href={`/purchases/${po.id}`} className="p-2 ml-2 text-gray-300 group-hover:text-gray-900 transition-colors">
                                        <ChevronRight size={20} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
