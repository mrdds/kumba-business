'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitToApproval, createHRRequest } from '@/services/finance.service';
import DashboardLayout from '@/app/dashboard-layout';
import { ArrowLeft, Wallet, Loader2, Info, Send, Save, Banknote, AlertCircle, Sparkles } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function RequestAdvancePage() {
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useNotification();

    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    const { mutate: handleSubmit, loading } = useApiMutation(async (submitImmediate: boolean) => {
        if (!amount || parseFloat(amount) <= 0) throw new Error('Veuillez saisir un montant valide');

        const requestData = {
            type: 'SALARY_ADVANCE',
            amount: parseFloat(amount),
            reason: reason,
            status: 'DRAFT',
            date: new Date().toISOString().split('T')[0]
        };

        const result = await createHRRequest(requestData);

        if (submitImmediate && result?.id) {
            await submitToApproval('hr_advance', result.id);
            showToast('Demande d\'acompte soumise avec succès', 'success');
        } else {
            showToast('Demande enregistrée en brouillon', 'success');
        }

        router.push('/hr/advances');
    });

    const maxAdvance = (user?.base_salary || 0) * 0.7;
    const isOverLimit = parseFloat(amount) > maxAdvance;

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto py-10 space-y-10">
                {/* Header */}
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => router.back()}
                        className="p-4 bg-white border border-slate-100 rounded-[24px] hover:bg-slate-50 transition-all shadow-sm group"
                    >
                        <ArrowLeft size={20} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                    </button>
                    <div>
                        <h1 className={clsx("text-3xl font-black text-slate-900 tracking-tight", displayFont.className)}>Demander un Acompte</h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Services financiers aux collaborateurs</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Main Form Card */}
                        <div className="bg-white rounded-[48px] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-8 md:p-12 space-y-12">
                                <div className="flex items-center gap-5">
                                    <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-[28px] flex items-center justify-center shadow-inner">
                                        <Wallet size={32} />
                                    </div>
                                    <div>
                                        <h2 className={clsx("text-2xl font-black text-slate-900 tracking-tight", displayFont.className)}>Montant de l'avance</h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Saisie en Francs CFA (XOF)</p>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[3px] ml-4">Valeur souhaitée</label>
                                        <div className="relative group">
                                            <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                                                <Banknote size={32} />
                                            </div>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className={clsx(
                                                    "w-full h-28 pl-24 pr-12 bg-slate-50/50 border-none rounded-[36px] outline-none transition-all font-black text-4xl text-slate-900 placeholder:text-slate-200 tracking-tighter",
                                                    isOverLimit ? "ring-4 ring-rose-500/10 text-rose-600" : "focus:ring-8 focus:ring-indigo-500/5"
                                                )}
                                                placeholder="0"
                                            />
                                        </div>
                                        
                                        <div className={clsx(
                                            "flex items-start gap-4 p-6 rounded-[32px] border transition-all",
                                            isOverLimit ? "bg-rose-50 border-rose-100" : "bg-indigo-50 border-indigo-100"
                                        )}>
                                            <div className={clsx("p-2 rounded-xl bg-white", isOverLimit ? "text-rose-500" : "text-indigo-600")}>
                                                {isOverLimit ? <AlertCircle size={18} /> : <Sparkles size={18} />}
                                            </div>
                                            <div>
                                                <p className={clsx("text-xs font-black uppercase tracking-tight", isOverLimit ? "text-rose-700" : "text-indigo-700")}>
                                                    Politique Entreprise : {isOverLimit ? 'Limite Dépassée' : 'Limite Autorisée'}
                                                </p>
                                                <p className={clsx("text-sm font-medium mt-1", isOverLimit ? "text-rose-600" : "text-indigo-600")}>
                                                    Vous pouvez demander jusqu'à 70% de votre salaire : <span className="font-bold">{formatCurrency(maxAdvance, user?.company?.currency)}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-6">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[3px] ml-4">Motif de la demande</label>
                                        <textarea
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            rows={5}
                                            className="w-full p-10 bg-slate-50/50 border-none rounded-[40px] focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all font-bold text-slate-600 placeholder:text-slate-300 text-lg leading-relaxed"
                                            placeholder="Précisez la raison de ce besoin exceptionnel..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Status/Process Card */}
                        <div className="bg-white rounded-[48px] shadow-sm border border-slate-100 p-10 sticky top-10 space-y-10">
                            <div>
                                <h3 className={clsx("text-xl font-black text-slate-900 tracking-tight flex items-center gap-3", displayFont.className)}>
                                    <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                                    Circuit d'Approbation
                                </h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Processus de validation</p>
                            </div>

                            <div className="space-y-8 relative">
                                <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-50" />
                                
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                                        <span className="text-[10px] font-black">1</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-slate-900 tracking-tight">Manager Direct</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Validation hiérarchique</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                        <span className="text-[10px] font-black">2</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-slate-400 tracking-tight">RH & Trésorerie</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Contrôle & Virement</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-10">
                                <button
                                    onClick={() => handleSubmit(true)}
                                    disabled={loading || isOverLimit}
                                    className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[2px] hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Soumettre</>}
                                </button>
                                <button
                                    onClick={() => handleSubmit(false)}
                                    disabled={loading}
                                    className="w-full py-5 bg-slate-50 text-slate-600 rounded-[24px] font-black text-[11px] uppercase tracking-[2px] hover:bg-slate-100 transition-all flex items-center justify-center gap-3"
                                >
                                    <Save size={18} className="opacity-40" /> Brouillon
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
