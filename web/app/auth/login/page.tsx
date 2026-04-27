'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

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
            // Gestion détaillée des erreurs pour retour utilisateur
            if (err?.response) {
                const status = err.response.status;
                const data = err.response.data;
                let message = t('auth.login.errors.unknown');
                if (status === 401) {
                    message = t('auth.login.errors.invalid_credentials');
                } else if (status === 400) {
                    message = data.detail || data.message || t('auth.login.errors.bad_request');
                } else if (status === 500) {
                    message = t('auth.login.errors.server_error');
                } else if (data && (data.detail || data.message)) {
                    message = data.detail || data.message;
                } else if (data) {
                    message = t('auth.login.errors.unknown') + ': ' + JSON.stringify(data);
                } else {
                    message = t('auth.login.errors.no_data');
                }
                setError(message);
                console.error('Erreur login:', status, data, err);
            } else if (err?.message) {
                setError(t('auth.login.errors.network_error') + err.message);
                console.error('Erreur login:', err);
            } else {
                setError(t('auth.login.errors.unknown'));
                console.error('Erreur login:', err);
            }
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
                        <img src="/icon.png" alt="OurSpace" className="w-12 h-12 rounded-xl shadow-lg border border-white/50" />
                        <span className="text-xl font-extrabold">
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">OurSpace</span>
                        </span>
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900 mb-2">{t('auth.login.welcome')}</h1>
                    <p className="text-slate-600">{t('auth.login.subtitle')}</p>
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
                                {t('auth.login.email')}
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
                                {t('auth.login.password')}
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
                                <span className="ml-2 text-slate-700">{t('auth.login.remember_me')}</span>
                            </label>
                            <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-700 font-semibold">
                                {t('auth.login.forgot_password')}
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
                                    {t('auth.login.signing_in')}
                                </>
                            ) : (
                                t('auth.login.submit')
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-slate-500">{t('auth.login.separator')}</span>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <p className="text-center text-slate-600">
                        {t('auth.login.no_account')}{' '}
                        <Link href="http://localhost:3001/register?redirect_url=http://localhost:3000/dashboard&app=business" className="text-blue-600 hover:text-blue-700 font-bold">
                            {t('auth.login.register_link')}
                        </Link>
                    </p>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
                        ← {t('auth.login.back_to_home')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
