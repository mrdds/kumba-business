'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building2,
    Briefcase,
    CreditCard,
    Check,
    X,
    ChevronRight,
    ChevronLeft,
    Globe,
    Coins,
    ShieldCheck,
    Loader2,
    CheckCircle2,
    Smartphone,
    Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createCompany, updateSubscription, updateProfile } from '../../services/api';

export default function OnboardingPage() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1: Company Info
    const [companyData, setCompanyData] = useState({
        name: '',
        sector: 'Technology',
        country: 'CI',
        currency: 'XOF',
        tax_rate: 18
    });

    // Step 2: Role Info
    const [roleData, setRoleData] = useState({
        jobTitle: '',
    });

    // Step 3: Subscription
    const [plan, setPlan] = useState('FREE');

    // Step 4: Payment variables
    const [paymentPhone, setPaymentPhone] = useState('');

    useEffect(() => {
        // Only redirect if user already has a company AND they are on the first step of onboarding
        // This prevents interrupting the onboarding flow once it's started (step > 1)
        if (user?.company_id && step === 1) {
            router.push('/dashboard');
        }
    }, [user, router, step]);

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const submitCompany = async () => {
        setLoading(true);
        setError('');
        try {
            await createCompany({
                name: companyData.name,
                sector: companyData.sector,
                country: companyData.country,
                currency: companyData.currency,
                tax_rate: companyData.tax_rate
            });
            await refreshUser();
            handleNext();
        } catch (err) {
            console.error(err);
            setError("Error creating company");
        } finally {
            setLoading(false);
        }
    };

    const submitRole = async () => {
        setLoading(true);
        setError('');
        try {
            await updateProfile({
                job_title: roleData.jobTitle
            });
            await refreshUser();
            handleNext();
        } catch (err) {
            console.error(err);
            setError("Error updating profile");
        } finally {
            setLoading(false);
        }
    };

    const submitPlan = async (selectedPlan) => {
        setPlan(selectedPlan);
        if (selectedPlan === 'FREE') {
            setLoading(true);
            try {
                await updateSubscription('FREE');
                setStep(5); // Success step
                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);
            } catch (err) {
                console.error(err);
                setError("Error updating subscription");
            } finally {
                setLoading(false);
            }
        } else {
            // PRO plan requires payment
            setStep(4);
        }
    };

    const processKumbaPay = async () => {
        setLoading(true);
        setError('');
        try {
            // Simulate processing with KumbaPay
            await new Promise(resolve => setTimeout(resolve, 2500));
            await updateSubscription('PRO');
            setStep(5); // Success
            setTimeout(() => {
                router.push('/dashboard');
            }, 3000);
        } catch (err) {
            console.error(err);
            setError("Échec du paiement avec KumbaPay. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, title: 'Entreprise', icon: Building2 },
        { id: 2, title: 'Rôle', icon: Briefcase },
        { id: 3, title: 'Abonnement', icon: CreditCard },
        { id: 4, title: 'Paiement', icon: Smartphone },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-900">
            {/* Background Blob */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-3xl opacity-40 -z-10 translate-x-1/2 -translate-y-1/2"></div>
            <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-3xl opacity-40 -z-10 -translate-x-1/2 translate-y-1/2"></div>

            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl mb-6 border border-slate-100">
                        <span className="text-2xl font-bold bg-gradient-to-br from-indigo-600 to-blue-600 bg-clip-text text-transparent">K</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Bienvenue sur Kumba Business</h1>
                    <p className="text-slate-500">Configurons votre espace de travail en quelques secondes.</p>
                </div>

                {/* Progress Bar */}
                {step <= 4 && (
                    <div className="flex items-center justify-between mb-12 relative px-4">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2"></div>
                        <div
                            className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -z-10 -translate-y-1/2 transition-all duration-500"
                            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                        ></div>
                        {steps.map((s) => (
                            <div key={s.id} className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-200 text-slate-400'
                                    }`}>
                                    {step > s.id ? <Check size={20} /> : <s.icon size={20} />}
                                </div>
                                <span className={`text-xs font-bold mt-2 ${step >= s.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    {s.title}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Content Cards */}
                <div className="bg-white border border-slate-200/60 rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden backdrop-blur-sm bg-white/80">

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Company Info */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nom de l&apos;entreprise</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Ex: Kumba Tech SARL"
                                            className="w-full pl-12 pr-4 h-14 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium"
                                            value={companyData.name}
                                            onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Secteur d&apos;activité</label>
                                    <select
                                        className="w-full px-4 h-14 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium appearance-none"
                                        value={companyData.sector}
                                        onChange={(e) => setCompanyData({ ...companyData, sector: e.target.value })}
                                    >
                                        <option>Technology</option>
                                        <option>Retail</option>
                                        <option>Construction</option>
                                        <option>Services</option>
                                        <option>Agriculture</option>
                                        <option>Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Devise Centrale</label>
                                    <div className="relative">
                                        <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                                        <select
                                            className="w-full pl-12 pr-4 h-14 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium appearance-none"
                                            value={companyData.currency}
                                            onChange={(e) => setCompanyData({ ...companyData, currency: e.target.value })}
                                        >
                                            <option value="XOF">XOF (FCFA)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={submitCompany}
                                disabled={!companyData.name || loading}
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                    <>Continuer <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Role Selection */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                                <ShieldCheck size={40} />
                            </div>
                            <h3 className="text-xl font-bold">Votre Profil Administrateur</h3>
                            <p className="text-slate-500">
                                En tant que créateur, vous avez les droits de <strong>Super Admin</strong>.
                                Précisez votre titre pour personnaliser vos documents.
                            </p>

                            <div className="text-left mt-8">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Votre fonction / poste</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Directeur Général, Co-fondateur..."
                                    className="w-full px-4 h-14 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium"
                                    value={roleData.jobTitle}
                                    onChange={(e) => setRoleData({ ...roleData, jobTitle: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={handleBack}
                                    className="flex-1 h-14 border border-slate-200 hover:bg-slate-50 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <ChevronLeft className="w-5 h-5" /> Retour
                                </button>
                                <button
                                    onClick={submitRole}
                                    disabled={loading}
                                    className="flex-[2] h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group"
                                >
                                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                        <>Suivant <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Subscription Plans */}
                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Free Plan */}
                                <div
                                    onClick={() => submitPlan('FREE')}
                                    className={`relative p-6 rounded-3xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${plan === 'FREE' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 bg-slate-50 text-slate-900'
                                        }`}
                                >
                                    <div className="mb-4">
                                        <h4 className="font-bold text-lg">Gratuit</h4>
                                        <p className={`text-sm ${plan === 'FREE' ? 'text-slate-400' : 'text-slate-500'}`}>Idéal pour démarrer</p>
                                    </div>
                                    <div className="text-2xl font-bold mb-6">0€ <span className="text-sm font-normal opacity-60">/mois</span></div>
                                    <ul className="space-y-3 mb-8">
                                        <li className="flex items-center gap-2 text-sm text-slate-700"><Check size={16} className="text-green-500" /> 1 Utilisateur</li>
                                        <li className="flex items-center gap-2 text-sm text-slate-700"><Check size={16} className="text-green-500" /> Gestion Factures & Devis</li>
                                        <li className="flex items-center gap-2 text-sm text-slate-700"><Check size={16} className="text-green-500" /> CRM (Clients)</li>
                                        <li className="flex items-center gap-2 text-sm text-slate-500"><X size={16} className="text-red-400" /> Pas d&apos;accès App Mobile Klock</li>
                                    </ul>
                                    <button className={`w-full py-3 rounded-xl font-bold text-sm transition-transform hover:scale-105 ${plan === 'FREE' ? 'bg-white text-slate-900 border border-slate-200' : 'bg-slate-200 text-slate-700'
                                        }`}>Sélectionner Gratuit</button>
                                </div>

                                {/* Pro Plan */}
                                <div
                                    onClick={() => submitPlan('PRO')}
                                    className={`relative p-6 rounded-3xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${plan === 'PRO' ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'border-indigo-100 bg-indigo-50 text-slate-900'
                                        }`}
                                >
                                    <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Populaire</div>
                                    <div className="mb-4">
                                        <h4 className="font-bold text-lg">Professionnel</h4>
                                        <p className={`text-sm ${plan === 'PRO' ? 'text-indigo-200' : 'text-slate-500'}`}>Tout pour votre PME</p>
                                    </div>
                                    <div className="text-2xl font-bold mb-6">49€ <span className="text-sm font-normal opacity-60">/mois</span></div>
                                    <ul className="space-y-3 mb-8">
                                        <li className="flex items-center gap-2 text-sm"><Check size={16} className={plan === 'PRO' ? 'text-indigo-300' : 'text-indigo-600'} /> Utilisateurs Illimités</li>
                                        <li className="flex items-center gap-2 text-sm"><Check size={16} className={plan === 'PRO' ? 'text-indigo-300' : 'text-indigo-600'} /> OurSpace (Chat E2EE & Vidéo)</li>
                                        <li className="flex items-center gap-2 text-sm"><Check size={16} className={plan === 'PRO' ? 'text-indigo-300' : 'text-indigo-600'} /> Mobile Klock (Pointage)</li>
                                        <li className="flex items-center gap-2 text-sm"><Check size={16} className={plan === 'PRO' ? 'text-indigo-300' : 'text-indigo-600'} /> Bons de Commande, Devis, Factures</li>
                                        <li className="flex items-center gap-2 text-sm"><Check size={16} className={plan === 'PRO' ? 'text-indigo-300' : 'text-indigo-600'} /> RH & Bulletins de Salaire</li>
                                        <li className="flex items-center gap-2 text-sm opacity-90"><Check size={16} className={plan === 'PRO' ? 'text-indigo-300' : 'text-indigo-600'} /> ... et bien d&apos;autres avantages</li>
                                    </ul>
                                    <button className={`w-full flex justify-center items-center gap-2 py-3 rounded-xl font-bold text-sm transition-transform hover:scale-105 shadow-md ${plan === 'PRO' ? 'bg-white text-indigo-600 hover:bg-slate-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        }`}>
                                        <CreditCard size={18} /> Payer avec KumbaPay
                                    </button>
                                </div>
                            </div>

                            <button onClick={handleBack} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors mx-auto block flex items-center gap-1">
                                <ChevronLeft size={16} /> Modifier les informations précédentes
                            </button>
                        </div>
                    )}

                    {/* Step 4: KumbaPay Checkout */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-w-sm mx-auto">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-slate-300">
                                    <span className="text-xl font-bold bg-gradient-to-br from-green-400 to-emerald-600 bg-clip-text text-transparent">Pay</span>
                                </div>
                                <h3 className="text-2xl font-bold">Paiement Sécurisé</h3>
                                <p className="text-slate-500 mt-2">Veuillez autoriser le paiement de <strong>49€/mois</strong> via votre compte KumbaPay.</p>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Numéro de téléphone KumbaPay</label>
                                <div className="relative mb-6">
                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="tel"
                                        placeholder="Ex: +225 01 02 03 04 05"
                                        className="w-full pl-12 pr-4 h-14 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all font-medium text-lg"
                                        value={paymentPhone}
                                        onChange={(e) => setPaymentPhone(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={processKumbaPay}
                                    disabled={!paymentPhone || loading}
                                    className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold shadow-lg shadow-slate-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <><Loader2 className="animate-spin w-5 h-5" /> Validation en cours...</>
                                    ) : (
                                        <><Lock className="w-4 h-4" /> Payer 49,00 €</>
                                    )}
                                </button>
                            </div>

                            <button onClick={() => setStep(3)} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors mx-auto block flex items-center gap-1 mt-4">
                                <ChevronLeft size={16} /> Retour aux abonnements
                            </button>
                        </div>
                    )}

                    {/* Step 5: Success View */}
                    {step === 5 && (
                        <div className="text-center py-10 animate-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-green-500 animate-bounce">
                                <CheckCircle2 size={56} />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Félicitations !</h2>
                            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                                Votre espace de travail <strong>{companyData.name}</strong> est prêt.
                                Nous préparons vos accès...
                            </p>
                            <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold">
                                <Loader2 className="animate-spin w-5 h-5" /> Redirection vers le tableau de bord
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Info */}
                <div className="mt-8 flex items-center justify-center gap-6 text-slate-400 text-xs font-medium">
                    <span className="flex items-center gap-1"><ShieldCheck size={14} /> Données Sécurisées</span>
                    <span className="flex items-center gap-1"><Globe size={14} /> Standard OHADA</span>
                    <span>Support: support@kumba.io</span>
                </div>
            </div>
        </div>
    );
}
