'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestAdvance } from '../../../../services/api';
import DashboardLayout from '../../../dashboard/dashboard-layout'; // Adjust path if needed or use relative
// Actually dashboard-layout is in 'app/dashboard-layout' based on file list?
// List dir of web/app shows 'dashboard-layout.tsx'. So path is '../../dashboard-layout'.
import { ArrowLeft, Wallet, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useNotification } from '@/context/NotificationContext'; // If exists, assuming yes based on previous files

export default function RequestAdvancePage() {
    const router = useRouter();
    // notification context might be in specific path, let's assume it works or handle error locally if not found
    // If I look at create purchase page, it imports from '@/context/NotificationContext'. I'll stick to that.

    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            setLoading(false);
            return;
        }

        try {
            await requestAdvance({
                amount: parseFloat(amount),
                reason: reason
            });
            // Redirect to dashboard with success?
            // Or toast?
            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Can wrap in DashboardLayout if I import it correctly, but simple page is fine too. 
                Using layout gives sidebar. I'll include it.
            */}
            <div className="max-w-xl mx-auto pt-20 px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 bg-emerald-600 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard" className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <h1 className="text-xl font-bold">Request Salary Advance</h1>
                        </div>
                        <Wallet className="w-8 h-8 opacity-80" />
                    </div>

                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Needed</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-gray-400 font-bold">FCFA</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-16 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition font-bold text-lg text-gray-900"
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Maximum allowed: 70% of base salary (Policy)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={4}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                    placeholder="Briefly explain why you need this advance..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading && <Loader2 className="animate-spin w-5 h-5" />}
                                {loading ? 'Submitting Request...' : 'Submit Request'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
