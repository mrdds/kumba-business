'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';
import DashboardLayout from '../../../dashboard-layout';
import { createPayroll } from '../../../../services/api';
import { useNotification } from '@/context/NotificationContext';
import { ArrowLeft, Loader2, DollarSign, Calendar, TrendingUp, Users, Building, AlertCircle } from 'lucide-react';
import { usePreferences } from '@/context/PreferencesContext';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function CreatePayroll() {
    const router = useRouter();
    const { showToast } = useNotification();
    const { formatCurrency } = usePreferences();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        period_start: '',
        period_end: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createPayroll(formData);
            showToast('Paie validée et écritures comptables générées !', 'success');
            router.push('/hr/payroll');
        } catch (error) {
            console.error(error);
            showToast('Erreur lors du traitement de la paie', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const showSimulation = formData.period_start && formData.period_end;

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.back()} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className={clsx("text-2xl font-black text-slate-900", displayFont.className)}>Run de Paie (Validation Massive)</h1>
                        <p className="text-sm font-medium text-slate-500">Validation de la paie, calcul des charges CNPS et génération des écritures.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Calendar size={100} />
                            </div>
                            
                            <h2 className={clsx("text-sm font-bold text-slate-800 uppercase tracking-widest mb-6", displayFont.className)}>Période de Paie</h2>
                            
                            <div className="space-y-4 relative z-10">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Début de période</label>
                                    <input
                                        type="date"
                                        required
                                        name="period_start"
                                        value={formData.period_start}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm font-bold text-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Fin de période</label>
                                    <input
                                        type="date"
                                        required
                                        name="period_end"
                                        value={formData.period_end}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm font-bold text-slate-700"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !showSimulation}
                                className="w-full mt-8 bg-slate-900 text-white px-6 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading && <Loader2 size={18} className="animate-spin" />}
                                {loading ? 'Traitement en cours...' : 'Valider & Payer'}
                            </button>
                        </form>

                        <div className="bg-indigo-50 border border-indigo-100 rounded-[24px] p-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="text-indigo-600 mt-0.5 shrink-0" size={18} />
                                <div>
                                    <h3 className="font-bold text-indigo-900 text-sm">Automatisations ERP</h3>
                                    <ul className="text-xs text-indigo-700 mt-2 space-y-2 font-medium">
                                        <li>• Les acomptes versés sont automatiquement déduits.</li>
                                        <li>• OD de paie générée dans le journal des salaires.</li>
                                        <li>• Fiches de paie PDF envoyées par email chiffré.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Simulation Section */}
                    <div className="lg:col-span-2">
                        {showSimulation ? (
                            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
                                <h2 className={clsx("text-lg font-bold text-slate-800 mb-6", displayFont.className)}>Aperçu & Variations (vs Mois Précédent)</h2>
                                
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                                            <Users size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Effectif Traité</span>
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <span className="text-2xl font-black text-slate-900">14</span>
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
                                                <TrendingUp size={12} /> +2
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                                            <Building size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Charges CNPS/Impôts</span>
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <span className="text-2xl font-black text-slate-900">{formatCurrency(845000, 'XOF')}</span>
                                            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg flex items-center gap-1">
                                                <TrendingUp size={12} /> +12%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/10 mb-8 relative overflow-hidden">
                                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20" />
                                    <h3 className="text-sm font-medium text-slate-400 mb-1">Masse Salariale Nette (À Payer)</h3>
                                    <div className="flex items-end justify-between">
                                        <span className={clsx("text-4xl font-black tracking-tight", displayFont.className)}>
                                            {formatCurrency(3850000, 'XOF')}
                                        </span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-xs font-medium text-slate-400">
                                        <span>Avances déduites: {formatCurrency(150000, 'XOF')}</span>
                                        <span>Brut total: {formatCurrency(4845000, 'XOF')}</span>
                                    </div>
                                </div>

                                <div className="border border-amber-100 bg-amber-50 rounded-2xl p-4 flex items-start gap-3">
                                    <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-xs font-bold text-amber-900 mb-1">Impact Trésorerie</p>
                                        <p className="text-[10px] text-amber-700 font-medium">
                                            La validation de ce Run génèrera 14 ordres de virement pour un total de 3,850,000 FCFA. Assurez-vous que votre compte Ecobank Pro (Solde: 18.2M) est suffisamment approvisionné.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-center p-12">
                                <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center text-slate-300 mb-6">
                                    <Calendar size={32} />
                                </div>
                                <h3 className={clsx("text-xl font-bold text-slate-800 mb-2", displayFont.className)}>En attente de période</h3>
                                <p className="text-sm text-slate-500 font-medium max-w-sm">
                                    Sélectionnez les dates de début et de fin pour générer la simulation du Run de Paie.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
