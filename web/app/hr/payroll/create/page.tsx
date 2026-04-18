'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../dashboard-layout';
import { createPayroll } from '../../../../services/api';
import { useNotification } from '@/context/NotificationContext';
import { ArrowLeft, Loader2, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function CreatePayroll() {
    const router = useRouter();
    const { showToast } = useNotification();
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
            showToast('Payroll run initiated successfully!', 'success');
            router.push('/hr/payroll');
        } catch (error) {
            console.error(error);
            showToast('Failed to run payroll', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Calculate duration in days for preview
    const calculateDuration = () => {
        if (!formData.period_start || !formData.period_end) return 0;
        const start = new Date(formData.period_start);
        const end = new Date(formData.period_end);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1; // Inclusive
    };

    return (
        <DashboardLayout>
            <div className="max-w-xl mx-auto">
                <div className="mb-6">
                    <Link href="/hr/payroll" className="flex items-center text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                        <ArrowLeft size={20} className="mr-2" />
                        Back to History
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Run Payroll</h1>
                    <p className="text-gray-500">Select the period to process salaries for.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                            <Calendar className="text-blue-600 mt-1" size={20} />
                            <div>
                                <h3 className="font-semibold text-blue-900">How it works</h3>
                                <p className="text-sm text-blue-700 mt-1">
                                    Selecting a period will automatically calculate salaries for all active employees based on their annual base salary (pro-rated monthly).
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Period Start *</label>
                                <input
                                    type="date"
                                    required
                                    name="period_start"
                                    value={formData.period_start}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Period End *</label>
                                <input
                                    type="date"
                                    required
                                    name="period_end"
                                    value={formData.period_end}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {formData.period_start && formData.period_end && (
                            <div className="border-t pt-6 mt-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600">Pay Period Duration</span>
                                    <span className="font-bold">{calculateDuration()} Days</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Assumed Frequency</span>
                                    <span className="font-bold">Monthly</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                        <Link href="/hr/payroll" className="px-6 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-200"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            {loading ? 'Processing...' : 'Run Payroll'}
                            {!loading && <DollarSign size={18} />}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
