'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../dashboard-layout';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { getBudgets } from '../../services/api';
import { PieChart, Plus, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function BudgetDashboard() {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [budgets, setBudgets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBudgets = async () => {
            try {
                const data = await getBudgets();
                setBudgets(data);
            } catch (error) {
                console.error("Failed to fetch budgets", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBudgets();
    }, []);

    const getProgressBarColor = (percentage: number) => {
        if (percentage >= 100) return 'bg-red-600';
        if (percentage >= 80) return 'bg-yellow-500';
        return 'bg-green-600';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-lg font-bold text-gray-900">{t('budgets.title')}</h1>
                    <p className="text-gray-500">{t('budgets.subtitle')}</p>
                </div>
                <Link href="/budgets/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                    <Plus size={20} />
                    {t('budgets.add_btn')}
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : budgets.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <PieChart size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">{t('budgets.no_record_title')}</h3>
                    <p className="text-gray-500 mb-4">{t('budgets.no_record_desc')}</p>
                    <Link href="/budgets/create" className="text-blue-600 font-bold hover:underline">
                        {t('budgets.first_budget')}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {budgets.map((budget) => (
                        <div key={budget.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{budget.category}</h3>
                                    <p className="text-sm text-gray-500">
                                        {formatDate(budget.period_start)} - {formatDate(budget.period_end)}
                                    </p>
                                </div>
                                <div className={`p-2 rounded-full ${budget.percentage >= 100 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {budget.percentage >= 100 ? <AlertTriangle size={20} /> : <TrendingUp size={20} />}
                                </div>
                            </div>

                            <div className="mb-2 flex justify-between items-end">
                                <div>
                                    <span className="text-lg font-bold text-gray-900">{formatCurrency(budget.spent, user?.company?.currency)}</span>
                                    <span className="text-gray-500 text-sm ml-2">{t('budgets.spent')}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-medium text-gray-600">{t('budgets.of')} {formatCurrency(budget.amount_limit, user?.company?.currency)}</span>
                                </div>
                            </div>

                            <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(budget.percentage)}`}
                                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                                ></div>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                {budget.remaining > 0 ? (
                                    <span className="text-green-600 flex items-center gap-1 font-medium">
                                        <CheckCircle size={14} />
                                        {formatCurrency(budget.remaining, user?.company?.currency)} {t('budgets.remaining')}
                                    </span>
                                ) : (
                                    <span className="text-red-600 flex items-center gap-1 font-medium">
                                        <AlertTriangle size={14} />
                                        {t('budgets.over_budget')} {formatCurrency(Math.abs(budget.remaining), user?.company?.currency)}
                                    </span>
                                )}
                                <span className="text-gray-500">{budget.percentage.toFixed(1)}% {t('budgets.used')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
