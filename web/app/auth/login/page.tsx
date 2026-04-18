'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();

    // ... (state definitions remain)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login({ username: email, password });
            // Redirect is handled in AuthContext login method
        } catch (err: any) {
            console.error(err);
            setError('Email ou mot de passe incorrect');
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
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Bon retour !</h1>
                    <p className="text-slate-600">Connectez-vous à votre compte</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start">
                                <AlertCircle className="text-red-500 flex-shrink-0 mr-3 mt-0.5" size={20} />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="vous@exemple.com"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 text-slate-900 placeholder-slate-400"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-12 pr-12 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 text-slate-900"
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

                        {/* Remember & Forgot */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                                <span className="ml-2 text-slate-700">Se souvenir de moi</span>
                            </label>
                            <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-700 font-semibold">
                                Mot de passe oublié ?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin mr-2" size={20} />
                                    Connexion...
                                </>
                            ) : (
                                'Se connecter'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-slate-500">ou</span>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <p className="text-center text-slate-600">
                        Pas encore de compte ?{' '}
                        <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-bold">
                            Créer un compte gratuit
                        </Link>
                    </p>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
                        ← Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}
