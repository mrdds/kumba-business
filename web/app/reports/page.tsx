'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '../dashboard-layout';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { getPnLReport, getExportUrl } from '../../services/api';
import { Loader2, Download, TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ReportsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<any[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [totals, setTotals] = useState({ income: 0, expenses: 0, profit: 0 });

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                const data = await getPnLReport(year);
                setReport(data);

                // Calculate totals
                const inc = data.reduce((acc: number, item: any) => acc + item.income, 0);
                const exp = data.reduce((acc: number, item: any) => acc + item.expenses, 0);
                setTotals({ income: inc, expenses: exp, profit: inc - exp });
            } catch (error) {
                console.error("Failed to fetch report", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [year]);

    const maxVal = Math.max(
        ...report.map((item) => Math.max(item.income, item.expenses)),
        1
    );

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-lg font-bold text-gray-900">{t('reports.title')}</h1>
                    <p className="text-gray-500">{t('reports.subtitle')}</p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="p-2 border border-gray-300 rounded-lg bg-white"
                    >
                        <option value={2026}>2026</option>
                        <option value={2025}>2025</option>
                        <option value={2024}>2024</option>
                    </select>
                    <a
                        href={getExportUrl('pnl', year)}
                        className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors font-medium"
                    >
                        <FileText size={18} /> {t('reports.export_pnl')}
                    </a>
                    <a
                        href={getExportUrl('accountant', year)}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors font-medium"
                    >
                        <Download size={18} /> {t('reports.export_accountant')}
                    </a>
                </div>
            </div>

            {/* Totals Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                            <TrendingUp size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{t('reports.income')}</p>
                            <h3 className="text-lg font-bold text-gray-900">{formatCurrency(totals.income, user?.company?.currency)}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 rounded-lg">
                            <TrendingDown size={24} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{t('reports.expenses')}</p>
                            <h3 className="text-lg font-bold text-gray-900">{formatCurrency(totals.expenses, user?.company?.currency)}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <DollarSign size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{t('reports.profit')}</p>
                            <h3 className={`text-lg font-bold ${totals.profit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                {formatCurrency(totals.profit, user?.company?.currency)}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6">{t('reports.chart_title')}</h3>

                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="h-64 flex items-end justify-between gap-2">
                        {report.map((item) => (
                            <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full h-full flex items-end justify-center gap-1">
                                    {/* Income Bar */}
                                    <div
                                        className="w-3 bg-green-500 rounded-t-sm transition-all duration-500 hover:bg-green-600 relative"
                                        style={{ height: `${(item.income / maxVal) * 100}%` }}
                                        title={`${t('reports.table.income')}: ${formatCurrency(item.income, user?.company?.currency)}`}
                                    ></div>
                                    {/* Expense Bar */}
                                    <div
                                        className="w-3 bg-red-500 rounded-t-sm transition-all duration-500 hover:bg-red-600 relative"
                                        style={{ height: `${(item.expenses / maxVal) * 100}%` }}
                                        title={`${t('reports.table.expenses')}: ${formatCurrency(item.expenses, user?.company?.currency)}`}
                                    ></div>
                                </div>
                                <span className="text-xs text-gray-500 font-medium">{item.month}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">{t('reports.detailed_breakdown')}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('reports.table.month')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('reports.table.income')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('reports.table.expenses')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('reports.table.profit_loss')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {report.map((item) => (
                                <tr key={item.month} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.month}</td>
                                    <td className="px-6 py-4 text-sm text-green-600 font-medium">+{formatCurrency(item.income, user?.company?.currency)}</td>
                                    <td className="px-6 py-4 text-sm text-red-600 font-medium">-{formatCurrency(item.expenses, user?.company?.currency)}</td>
                                    <td className={`px-6 py-4 text-sm font-medium ${item.profit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                        {formatCurrency(item.profit, user?.company?.currency)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
