'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../../../dashboard-layout';
import { getPayroll, payPayroll, getAccounts, submitPayrollApproval } from '../../../../services/api';
import {
    ArrowLeft, DollarSign, Calendar,
    Loader2, Send, CheckCircle, Clock, Users, Banknote, Download, Eye, TrendingDown, ShieldCheck, AlertCircle, X
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import ApprovalStatus from '@/components/ApprovalStatus';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function PayrollDetail() {
    const { user } = useAuth();
    const { formatCurrency } = usePreferences();
    const params = useParams();
    const router = useRouter();
    const id = parseInt(params.id as string);
    const { showToast } = useNotification();

    const [payroll, setPayroll] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [accountsLoading, setAccountsLoading] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetchPayroll();
    }, [id]);

    const fetchPayroll = async () => {
        try {
            const data = await getPayroll(id);
            setPayroll(data);
        } catch (error) {
            console.error("Failed to fetch payroll", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setActionLoading(true);
        try {
            const result = await submitPayrollApproval(id);
            if (result && result.status) {
                setPayroll({ ...payroll, status: result.status });
            } else {
                await fetchPayroll();
            }
            showToast('Payroll soumis pour approbation', 'success');
        } catch (error) {
            console.error(error);
            showToast('Échec de la soumission', 'error');
        } finally {
            setActionLoading(false);
            setShowSubmitModal(false);
        }
    };

    const openPayModal = async () => {
        setShowPayModal(true);
        setAccountsLoading(true);
        try {
            const bankAccounts = await getAccounts('BANK');
            const cashAccounts = await getAccounts('CASH');
            setAccounts([...bankAccounts, ...cashAccounts]);
            if (bankAccounts.length > 0) setSelectedAccount(bankAccounts[0].id.toString());
        } catch (error) {
            console.error("Failed to fetch accounts", error);
        } finally {
            setAccountsLoading(false);
        }
    };

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await payPayroll(id, parseInt(selectedAccount));
            setShowPayModal(false);
            await fetchPayroll();
            showToast('Paie marquée comme payée !', 'success');
        } catch (error) {
            console.error(error);
            showToast('Échec du paiement', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="animate-spin text-slate-900" size={40} />
                </div>
            </DashboardLayout>
        );
    }

    if (!payroll) return <DashboardLayout>Paie introuvable</DashboardLayout>;

    const totalGross = payroll.payslips.reduce((acc: number, p: any) => acc + Number(p.basic_salary) + Number(p.bonus), 0);
    const totalTaxes = payroll.payslips.reduce((acc: number, p: any) => acc + Number(p.tax_amount), 0);
    const totalSocial = payroll.payslips.reduce((acc: number, p: any) => acc + Number(p.social_security_employee) + Number(p.social_security_employer), 0);

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Back Button */}
                <button onClick={() => router.back()} className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest">
                    <div className="p-2 bg-white border border-slate-100 rounded-xl group-hover:border-slate-200 transition-all">
                        <ArrowLeft size={16} />
                    </div>
                    Retour à la liste
                </button>

                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className={clsx("text-3xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                                Run de Paie #{payroll.id}
                            </h1>
                            <span className={clsx(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                payroll.status === 'PAID' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                payroll.status === 'APPROVED' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                "bg-amber-50 text-amber-700 border-amber-100"
                            )}>
                                {payroll.status === 'PAID' ? 'Payé' : payroll.status === 'APPROVED' ? 'Approuvé' : 'Brouillon'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} />
                            Période : {formatDate(payroll.period_start)} — {formatDate(payroll.period_end)}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {payroll.status === 'DRAFT' && (
                            <button
                                onClick={() => setShowSubmitModal(true)}
                                disabled={actionLoading}
                                className="bg-slate-900 text-white px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 font-black text-sm uppercase tracking-widest"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                Soumettre pour Approbation
                            </button>
                        )}

                        {payroll.status === 'APPROVED' && (
                            <button
                                onClick={openPayModal}
                                disabled={actionLoading}
                                className="bg-emerald-600 text-white px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20 font-black text-sm uppercase tracking-widest"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <DollarSign size={18} />}
                                Enregistrer le Paiement
                            </button>
                        )}

                        {payroll.journal_entry && (
                            <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-4">
                                <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Écritures Comptables</p>
                                    <div className="flex gap-3">
                                        <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">OD Paie: #{payroll.journal_entry.id}</span>
                                        {payroll.payment_entry && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Paiement: #{payroll.payment_entry.id}</span>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Summary Card */}
                <div className="bg-slate-900 rounded-[40px] p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600 rounded-full blur-[120px] opacity-20"></div>
                    
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">
                        <div className="lg:pr-8">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-4">Masse Salariale Nette</p>
                            <h2 className={clsx("text-4xl lg:text-5xl font-black text-white tracking-tighter", displayFont.className)}>
                                {formatCurrency(payroll.total_amount, user?.company?.currency)}
                            </h2>
                            <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                                <TrendingDown size={14} />
                                <span>Sortie Trésorerie</span>
                            </div>
                        </div>

                        <div className="md:pl-8 lg:px-8 pt-8 md:pt-0">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-4">Total Brut</p>
                            <h3 className={clsx("text-2xl font-black text-white tracking-tight", displayFont.className)}>
                                {formatCurrency(totalGross, user?.company?.currency)}
                            </h3>
                            <p className="mt-2 text-[10px] text-white/30 font-bold uppercase tracking-widest">Avant Charges & Retenues</p>
                        </div>

                        <div className="lg:px-8 pt-8 lg:pt-0">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-4">Retenues Fiscales</p>
                            <h3 className={clsx("text-2xl font-black text-rose-400 tracking-tight", displayFont.className)}>
                                {formatCurrency(totalTaxes, user?.company?.currency)}
                            </h3>
                            <p className="mt-2 text-[10px] text-white/30 font-bold uppercase tracking-widest">ITS / IGR / Contribution</p>
                        </div>

                        <div className="lg:pl-8 pt-8 lg:pt-0">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-4">Charges Sociales</p>
                            <h3 className={clsx("text-2xl font-black text-amber-400 tracking-tight", displayFont.className)}>
                                {formatCurrency(totalSocial, user?.company?.currency)}
                            </h3>
                            <p className="mt-2 text-[10px] text-white/30 font-bold uppercase tracking-widest">CNPS Part Sal. & Patr.</p>
                        </div>
                    </div>
                </div>

                {/* Payslips Table Card */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h3 className={clsx("text-xl font-black text-slate-900 tracking-tight", displayFont.className)}>Détails des Bulletins</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{payroll.payslips.length} Collaborateurs Traités</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button className="flex-1 md:flex-none px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                                <Download size={14} />
                                Tout Exporter (ZIP)
                            </button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Collaborateur</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Salaire Base</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Primes/Bonus</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Retenues</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net à Payer</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {payroll.payslips.map((slip: any) => (
                                    <tr key={slip.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                                    <span className="text-indigo-600 font-black text-sm">{slip.employee_name?.charAt(0)}</span>
                                                </div>
                                                <div>
                                                    <p className={clsx("font-black text-slate-900 text-sm tracking-tight", displayFont.className)}>{slip.employee_name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{slip.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 text-right font-bold text-slate-600 text-sm tabular-nums">
                                            {formatCurrency(slip.basic_salary, user?.company?.currency)}
                                        </td>
                                        <td className="px-4 py-5 text-right font-bold text-emerald-600 text-sm tabular-nums">
                                            {Number(slip.bonus) > 0 ? `+${formatCurrency(slip.bonus, user?.company?.currency)}` : '—'}
                                        </td>
                                        <td className="px-4 py-5 text-right font-bold text-rose-500 text-sm tabular-nums">
                                            {formatCurrency(Number(slip.tax_amount) + Number(slip.social_security_employee), user?.company?.currency)}
                                        </td>
                                        <td className="px-4 py-5 text-right">
                                            <span className={clsx("text-base font-black text-slate-900 tabular-nums", displayFont.className)}>
                                                {formatCurrency(slip.net_salary, user?.company?.currency)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-center items-center gap-2">
                                                <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                                                    <Eye size={16} />
                                                </button>
                                                <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-emerald-600 hover:border-emerald-100 transition-all">
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {/* Submit for Approval Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl border border-white/20 text-center">
                        <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className={clsx("text-2xl font-black text-slate-900 tracking-tight mb-2", displayFont.className)}>Soumettre pour Approbation</h3>
                        <p className="text-slate-500 text-sm font-medium mb-8">
                            Êtes-vous sûr de vouloir soumettre ce run de paie ? Une notification sera envoyée aux validateurs.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowSubmitModal(false)} className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all">
                                Annuler
                            </button>
                            <button onClick={handleSubmit} disabled={actionLoading} className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2">
                                {actionLoading && <Loader2 size={16} className="animate-spin" />}
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPayModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl border border-white/20">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className={clsx("text-2xl font-black text-slate-900 tracking-tight", displayFont.className)}>Enregistrer le Paiement</h3>
                            <button onClick={() => setShowPayModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handlePay} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[2px] ml-1">Compte de Trésorerie</label>
                                {accountsLoading ? (
                                    <div className="bg-slate-50 rounded-2xl p-6 text-center text-slate-400 font-bold text-sm">
                                        <Loader2 className="animate-spin inline mr-2" size={16} /> Chargement des comptes...
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <select
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 font-black text-sm appearance-none focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                                            value={selectedAccount}
                                            onChange={(e) => setSelectedAccount(e.target.value)}
                                            required
                                        >
                                            <option value="">Sélectionner un compte</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.name} — Solde: {formatCurrency(acc.balance, user?.company?.currency)}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <Calendar size={18} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100/50">
                                <div className="flex items-center gap-3 text-emerald-600 mb-2">
                                    <AlertCircle size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Impact Trésorerie</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-emerald-800">Total à décaisser</span>
                                    <span className={clsx("text-2xl font-black text-emerald-900 tracking-tighter", displayFont.className)}>
                                        {formatCurrency(payroll.total_amount, user?.company?.currency)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPayModal(false)}
                                    className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedAccount || actionLoading}
                                    className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20 flex justify-center items-center gap-2"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" size={18} /> : 'Confirmer le Règlement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
