'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
    useEffect(() => {
        // [SSO] Redirect to Centralized Registration
        const currentUrl = window.location.origin + '/dashboard';
        const ssoRegisterUrl = `https://kumba-auth.trocplus.ci/register?redirect_url=${encodeURIComponent(currentUrl)}&app=business`;

        // Short delay to show the branding/loader
        const timer = setTimeout(() => {
            window.location.href = ssoRegisterUrl;
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-kumba-dark flex flex-col items-center justify-center p-4">
            <div className="text-center space-y-6">
                <div className="flex items-center space-x-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-2xl">K</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-white">Redirection vers Kumba Auth</h1>
                    <p className="text-slate-400 animate-pulse">Préparation de votre compte Kumba ID...</p>
                </div>

                <div className="flex justify-center">
                    <Loader2 className="w-8 h-8 text-kumba-k animate-spin" />
                </div>
            </div>
        </div>
    );
}
