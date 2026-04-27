'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../dashboard-layout';
import { createBudget } from '../../../services/api';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Loader2, PieChart } from 'lucide-react';
import Link from 'next/link';

export default function CreateBudget() {
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        category: '',
        amount_limit: '',
        period_start: '',
        period_end: ''
    });

    const categories = [
        'Marketing', 'Office Supplies', 'Travel', 'Software', 'Utilities', 'Rent', 'Salaries', 'Other'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createBudget({
                ...formData,
                amount_limit: parseFloat(formData.amount_limit) || 0
            });
            showToast('Budget created successfully!', 'success');
            router.push('/budgets');
        } catch (error) {
            console.error(error);
            showToast('Failed to create budget', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <DashboardLayout>
            <div className="max-w-xl mx-auto">
                <div className="mb-6">
                    <Link href="/budgets" className="flex items-center text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Budgets
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">Set New Budget</h1>
                    <p className="text-gray-500">Define spending limits for a category.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="space-y-6">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                            <div className="relative">
                                <select
                                    required
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Budget Limit *</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500">{user?.company?.currency || '$'}</span>
                                </div>
                                <input
                                    type="number"
                                    required
                                    name="amount_limit"
                                    value={formData.amount_limit}
                                    onChange={handleChange}
                                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="5000.00"
                                />
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
                    </div>

                    <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                        <Link href="/budgets" className="px-6 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            {loading ? 'Creating...' : 'Set Budget'}
                            {!loading && <PieChart size={18} />}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
