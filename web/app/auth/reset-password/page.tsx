'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Lien de réinitialisation invalide');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate passwords
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:8000/api/auth/password-reset/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    new_password: password
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Une erreur est survenue');
            }

            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/auth/login');
            }, 3000);
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || 'Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-30"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center space-x-2 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">K</span>
                        </div>
                        <span className="text-3xl font-extrabold">
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Kumba</span>
                            <span className="text-slate-900 ml-1">Business</span>
                        </span>
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Nouveau mot de passe</h1>
                    <p className="text-slate-600">Choisissez un mot de passe sécurisé</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start">
                                    <AlertCircle className="text-red-500 flex-shrink-0 mr-3 mt-0.5" size={20} />
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            )}

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Nouveau mot de passe
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        disabled={!token}
                                        className="w-full pl-12 pr-12 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 text-slate-900 disabled:bg-slate-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Confirmer le mot de passe
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        disabled={!token}
                                        className="w-full pl-12 pr-12 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 text-slate-900 disabled:bg-slate-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Password Requirements */}
                            <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4">
                                <p className="text-xs text-blue-800 font-semibold mb-2">Exigences du mot de passe :</p>
                                <ul className="text-xs text-blue-700 space-y-1">
                                    <li>• Au moins 8 caractères</li>
                                    <li>• Utilisez un mot de passe unique</li>
                                </ul>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !token}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="animate-spin mr-2" size={20} />
                                        Réinitialisation...
                                    </>
                                ) : (
                                    'Réinitialiser le mot de passe'
                                )}
                            </button>
                        </form>
                    ) : (
                        /* Success State */
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="text-green-600" size={32} />
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 mb-3">Mot de passe réinitialisé !</h2>

                            <p className="text-slate-600 mb-6">
                                Votre mot de passe a été modifié avec succès.
                            </p>

                            <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4 mb-6">
                                <p className="text-sm text-blue-800">
                                    Vous allez être redirigé vers la page de connexion dans quelques secondes...
                                </p>
                            </div>

                            <Link
                                href="/auth/login"
                                className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-200"
                            >
                                Se connecter maintenant
                            </Link>
                        </div>
                    )}
                </div>

                {/* Back to Login */}
                {!success && (
                    <div className="text-center mt-6">
                        <Link href="/auth/login" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
                            ← Retour à la connexion
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
