'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Loader, ArrowRight } from 'lucide-react';
import axios from 'axios';

function ActivationContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState < 'loading' | 'success' | 'error' > ('loading');
    const [message, setMessage] = useState('Activation en cours...');

    useEffect(() => {
        const uid = searchParams.get('uid');
        const token = searchParams.get('token');

        if (!uid || !token) {
            setStatus('error');
            setMessage('Lien d\'activation invalide ou incomplet.');
            return;
        }

        const activateAccount = async () => {
            try {
                // Adjust this URL to your backend API
                const response = await axios.get(`http://localhost:8000/api/auth/activate`, {
                    params: { uid, token }
                });
                setStatus('success');
                setMessage('Votre compte a été activé avec succès !');
            } catch (err: any) {
                console.error(err);
                setStatus('error');
                const errorMsg = err.response?.data?.message || 'Le lien d\'activation est invalide ou a expiré.';
                setMessage(errorMsg);
            }
        };

        activateAccount();
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center">
                <div className="mb-8 flex justify-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                        <span className="text-white font-bold text-3xl">K</span>
                    </div>
                </div>

                {status === 'loading' && (
                    <div className="space-y-4">
                        <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                        <h1 className="text-2xl font-bold text-slate-900">Activation en cours</h1>
                        <p className="text-slate-600">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="text-green-600 w-10 h-10" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Compte Activé !</h1>
                        <p className="text-slate-600">{message}</p>
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all hover:shadow-lg active:scale-[0.98]"
                        >
                            Se connecter <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="text-red-600 w-10 h-10" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Erreur d'activation</h1>
                        <p className="text-slate-600">{message}</p>
                        <div className="space-y-3">
                            <Link
                                href="/auth/login"
                                className="inline-flex items-center justify-center w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all"
                            >
                                Retour à la connexion
                            </Link>
                            <p className="text-sm text-slate-500">
                                Un problème ? Contactez votre administrateur.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ActivationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        }>
            <ActivationContent />
        </Suspense>
    );
}
