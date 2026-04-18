'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReportLine {
    account_code: string;
    account_name: string;
    amount: number;
}

interface IncomeStatement {
    from_date: string;
    to_date: string;
    revenue_lines: ReportLine[];
    total_revenue: number;
    expense_lines: ReportLine[];
    total_expenses: number;
    net_profit: number;
}

interface BalanceSheet {
    as_of_date: string;
    asset_lines: ReportLine[];
    total_assets: number;
    liability_lines: ReportLine[];
    total_liabilities: number;
    equity_lines: ReportLine[];
    total_equity: number;
    is_balanced: boolean;
}

export default function FinancialReports() {
    const router = useRouter();
    const [activeReport, setActiveReport] = useState < 'income' | 'balance' > ('income');
    const [incomeStatement, setIncomeStatement] = useState < IncomeStatement | null > (null);
    const [balanceSheet, setBalanceSheet] = useState < BalanceSheet | null > (null);
    const [loading, setLoading] = useState(false);

    // Date filters
    const today = new Date().toISOString().split('T')[0];
    const yearStart = `${new Date().getFullYear()}-01-01`;
    const [fromDate, setFromDate] = useState(yearStart);
    const [toDate, setToDate] = useState(today);

    const fetchIncomeStatement = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(
                `http://localhost:8000/api/reports/income-statement?from_date=${fromDate}&to_date=${toDate}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (!res.ok) throw new Error('Failed to fetch income statement');

            const data = await res.json();
            setIncomeStatement(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBalanceSheet = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(
                `http://localhost:8000/api/reports/balance-sheet?as_of_date=${toDate}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (!res.ok) throw new Error('Failed to fetch balance sheet');

            const data = await res.json();
            setBalanceSheet(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = () => {
        if (activeReport === 'income') {
            fetchIncomeStatement();
        } else {
            fetchBalanceSheet();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
                            <p className="mt-1 text-sm text-gray-600">Generate and view your financial statements</p>
                        </div>
                        <button
                            onClick={() => router.push('/accounting')}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            ← Back
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Report Type Selector */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => setActiveReport('income')}
                            className={`px-6 py-3 rounded-lg font-semibold transition ${activeReport === 'income'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            📊 Income Statement
                        </button>
                        <button
                            onClick={() => setActiveReport('balance')}
                            className={`px-6 py-3 rounded-lg font-semibold transition ${activeReport === 'balance'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            📋 Balance Sheet
                        </button>
                    </div>

                    {/* Date Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {activeReport === 'income' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {activeReport === 'income' ? 'To Date' : 'As Of Date'}
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleGenerateReport}
                                disabled={loading}
                                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
                            >
                                {loading ? 'Generating...' : '🔄 Generate Report'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Report Display */}
                {loading && (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <div className="text-xl text-gray-600">Generating report...</div>
                    </div>
                )}

                {!loading && activeReport === 'income' && incomeStatement && (
                    <IncomeStatementView data={incomeStatement} />
                )}

                {!loading && activeReport === 'balance' && balanceSheet && (
                    <BalanceSheetView data={balanceSheet} />
                )}

                {!loading && !incomeStatement && !balanceSheet && (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <div className="text-4xl mb-4">📊</div>
                        <div className="text-xl text-gray-600 mb-2">No report generated yet</div>
                        <div className="text-sm text-gray-500">Select dates and click "Generate Report"</div>
                    </div>
                )}
            </div>
        </div>
    );
}

function IncomeStatementView({ data }: { data: IncomeStatement }) {
    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-4">
                <h2 className="text-2xl font-bold">Income Statement (Compte de Résultat)</h2>
                <p className="text-sm opacity-90">Period: {data.from_date} to {data.to_date}</p>
            </div>

            <div className="p-6">
                {/* Revenue Section */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
                        REVENUE (Produits)
                    </h3>
                    {data.revenue_lines.map((line, idx) => (
                        <div key={idx} className="flex justify-between py-2 text-sm">
                            <span className="text-gray-700">
                                {line.account_code} - {line.account_name}
                            </span>
                            <span className="font-medium">
                                ${parseFloat(line.amount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    ))}
                    <div className="flex justify-between py-3 mt-2 border-t-2 border-gray-300 font-bold text-green-700">
                        <span>Total Revenue</span>
                        <span>${parseFloat(data.total_revenue.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* Expenses Section */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
                        EXPENSES (Charges)
                    </h3>
                    {data.expense_lines.map((line, idx) => (
                        <div key={idx} className="flex justify-between py-2 text-sm">
                            <span className="text-gray-700">
                                {line.account_code} - {line.account_name}
                            </span>
                            <span className="font-medium">
                                ${parseFloat(line.amount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    ))}
                    <div className="flex justify-between py-3 mt-2 border-t-2 border-gray-300 font-bold text-red-700">
                        <span>Total Expenses</span>
                        <span>${parseFloat(data.total_expenses.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* Net Profit */}
                <div className={`flex justify-between py-4 px-6 rounded-lg text-xl font-bold ${parseFloat(data.net_profit.toString()) >= 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    <span>NET PROFIT / LOSS</span>
                    <span>
                        ${parseFloat(data.net_profit.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
        </div>
    );
}

function BalanceSheetView({ data }: { data: BalanceSheet }) {
    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-purple-600 text-white px-6 py-4">
                <h2 className="text-2xl font-bold">Balance Sheet (Bilan)</h2>
                <p className="text-sm opacity-90">As of: {data.as_of_date}</p>
                {data.is_balanced && (
                    <p className="text-sm mt-1">✅ Balanced (Assets = Liabilities + Equity)</p>
                )}
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Assets */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-blue-200 pb-2">
                        ASSETS (Actifs)
                    </h3>
                    {data.asset_lines.map((line, idx) => (
                        <div key={idx} className="flex justify-between py-2 text-sm">
                            <span className="text-gray-700">{line.account_code} - {line.account_name}</span>
                            <span className="font-medium">
                                ${parseFloat(line.amount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    ))}
                    <div className="flex justify-between py-3 mt-2 border-t-2 border-blue-300 font-bold text-blue-700">
                        <span>Total Assets</span>
                        <span>${parseFloat(data.total_assets.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* Liabilities & Equity */}
                <div>
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-red-200 pb-2">
                            LIABILITIES (Passifs)
                        </h3>
                        {data.liability_lines.map((line, idx) => (
                            <div key={idx} className="flex justify-between py-2 text-sm">
                                <span className="text-gray-700">{line.account_code} - {line.account_name}</span>
                                <span className="font-medium">
                                    ${parseFloat(line.amount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                        <div className="flex justify-between py-3 mt-2 border-t-2 border-red-300 font-bold text-red-700">
                            <span>Total Liabilities</span>
                            <span>${parseFloat(data.total_liabilities.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-purple-200 pb-2">
                            EQUITY (Capitaux Propres)
                        </h3>
                        {data.equity_lines.map((line, idx) => (
                            <div key={idx} className="flex justify-between py-2 text-sm">
                                <span className="text-gray-700">{line.account_code} - {line.account_name}</span>
                                <span className="font-medium">
                                    ${parseFloat(line.amount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                        <div className="flex justify-between py-3 mt-2 border-t-2 border-purple-300 font-bold text-purple-700">
                            <span>Total Equity</span>
                            <span>${parseFloat(data.total_equity.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
