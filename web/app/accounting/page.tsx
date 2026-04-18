'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Account {
    id: number;
    code: string;
    name: string;
    type: string;
    balance: number;
    is_active: boolean;
}

interface KPIs {
    totalAR: number;  // Accounts Receivable
    totalAP: number;  // Accounts Payable
    cashBalance: number;
    netProfit: number;
}

export default function AccountingDashboard() {
    const router = useRouter();
    const [accounts, setAccounts] = useState < Account[] > ([]);
    const [kpis, setKPIs] = useState < KPIs > ({
        totalAR: 0,
        totalAP: 0,
        cashBalance: 0,
        netProfit: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAccountingData();
    }, []);

    const fetchAccountingData = async () => {
        try {
            const token = localStorage.getItem('access_token');

            // Fetch all accounts
            const accountsRes = await fetch('http://localhost:8000/api/accounting/accounts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!accountsRes.ok) throw new Error('Failed to fetch accounts');

            const accountsData = await accountsRes.json();
            setAccounts(accountsData);

            // Calculate KPIs from accounts
            const ar = accountsData.find((a: Account) => a.code === '411');
            const ap = accountsData.find((a: Account) => a.code === '401');
            const cash = accountsData.find((a: Account) => a.code === '53');

            // Get Income Statement for net profit
            const today = new Date().toISOString().split('T')[0];
            const yearStart = `${new Date().getFullYear()}-01-01`;

            const pnlRes = await fetch(
                `http://localhost:8000/api/reports/income-statement?from_date=${yearStart}&to_date=${today}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const pnl = await pnlRes.json();

            setKPIs({
                totalAR: ar ? parseFloat(ar.balance.toString()) : 0,
                totalAP: ap ? parseFloat(ap.balance.toString()) : 0,
                cashBalance: cash ? parseFloat(cash.balance.toString()) : 0,
                netProfit: pnl ? parseFloat(pnl.net_profit.toString()) : 0
            });

            setLoading(false);
        } catch (error) {
            console.error('Error fetching accounting data:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl">Loading accounting data...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">Accounting Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-600">Comprehensive financial overview</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* KPIs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <KPICard
                        title="Accounts Receivable"
                        value={kpis.totalAR}
                        icon="💰"
                        color="blue"
                        subtitle="Money owed to us"
                    />
                    <KPICard
                        title="Accounts Payable"
                        value={kpis.totalAP}
                        icon="💳"
                        color="red"
                        subtitle="Money we owe"
                    />
                    <KPICard
                        title="Cash Balance"
                        value={kpis.cashBalance}
                        icon="🏦"
                        color="green"
                        subtitle="Available cash"
                    />
                    <KPICard
                        title="Net Profit (YTD)"
                        value={kpis.netProfit}
                        icon="📈"
                        color={kpis.netProfit >= 0 ? 'green' : 'red'}
                        subtitle="Year to date"
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <ActionCard
                        title="Chart of Accounts"
                        description="View and manage your account structure"
                        icon="📊"
                        onClick={() => router.push('/accounting/chart-of-accounts')}
                    />
                    <ActionCard
                        title="Journal Entries"
                        description="View all accounting entries"
                        icon="📝"
                        onClick={() => router.push('/accounting/journal-entries')}
                    />
                    <ActionCard
                        title="Financial Reports"
                        description="Generate Income Statement, Balance Sheet"
                        icon="📑"
                        onClick={() => router.push('/accounting/reports')}
                    />
                </div>

                {/* Recent Activity - Account Balances */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Key Account Balances</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {accounts
                                    .filter(acc => Math.abs(parseFloat(acc.balance.toString())) > 0)
                                    .slice(0, 10)
                                    .map((account) => (
                                        <tr key={account.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {account.code}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {account.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(account.type)}`}>
                                                    {account.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                                                ${parseFloat(account.balance.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                    <button
                        onClick={() => router.push('/accounting/chart-of-accounts')}
                        className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        View all accounts →
                    </button>
                </div>
            </div>
        </div>
    );
}

// Helper Components

interface KPICardProps {
    title: string;
    value: number;
    icon: string;
    color: string;
    subtitle: string;
}

function KPICard({ title, value, icon, color, subtitle }: KPICardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 border-blue-200',
        red: 'bg-red-50 border-red-200',
        green: 'bg-green-50 border-green-200',
        yellow: 'bg-yellow-50 border-yellow-200'
    };

    return (
        <div className={`${colorClasses[color as keyof typeof colorClasses] || 'bg-gray-50'} border-2 rounded-lg p-6`}>
            <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">{icon}</div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
            <p className="text-2xl font-bold text-gray-900">
                ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
    );
}

interface ActionCardProps {
    title: string;
    description: string;
    icon: string;
    onClick: () => void;
}

function ActionCard({ title, description, icon, onClick }: ActionCardProps) {
    return (
        <button
            onClick={onClick}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left border-2 border-transparent hover:border-blue-500"
        >
            <div className="text-3xl mb-3">{icon}</div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
        </button>
    );
}

function getTypeColor(type: string): string {
    const colors: Record<string, string> = {
        'ASSET': 'bg-blue-100 text-blue-800',
        'LIABILITY': 'bg-red-100 text-red-800',
        'EQUITY': 'bg-purple-100 text-purple-800',
        'REVENUE': 'bg-green-100 text-green-800',
        'EXPENSE': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
}
