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
    parent_id: number | null;
    description: string | null;
}

export default function ChartOfAccounts() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAccounts();
    }, [filter]);

    const fetchAccounts = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const activeParam = filter === 'active' ? '&active_only=true' : '';
            const typeParam = filter !== 'all' && filter !== 'active' ? `&type=${filter}` : '';

            const res = await fetch(
                `http://localhost:8000/api/accounting/accounts?${activeParam}${typeParam}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (!res.ok) throw new Error('Failed to fetch accounts');

            const data = await res.json();
            setAccounts(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            setLoading(false);
        }
    };

    const filteredAccounts = accounts.filter(account =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.code.includes(searchTerm)
    );

    const accountTypes = [
        { value: 'all', label: 'All Accounts', count: accounts.length },
        { value: 'ASSET', label: 'Assets', count: accounts.filter(a => a.type === 'ASSET').length },
        { value: 'LIABILITY', label: 'Liabilities', count: accounts.filter(a => a.type === 'LIABILITY').length },
        { value: 'EQUITY', label: 'Equity', count: accounts.filter(a => a.type === 'EQUITY').length },
        { value: 'REVENUE', label: 'Revenue', count: accounts.filter(a => a.type === 'REVENUE').length },
        { value: 'EXPENSE', label: 'Expenses', count: accounts.filter(a => a.type === 'EXPENSE').length },
    ];

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
                            <p className="mt-1 text-sm text-gray-600">Manage your account structure (Plan Comptable)</p>
                        </div>
                        <button
                            onClick={() => router.push('/accounting')}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {accountTypes.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setFilter(type.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === type.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {type.label} ({type.count})
                            </button>
                        ))}
                    </div>

                    <input
                        type="text"
                        placeholder="Search by code or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Accounts Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Account Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Balance
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAccounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No accounts found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAccounts.map((account) => (
                                        <tr
                                            key={account.id}
                                            className="hover:bg-gray-50 cursor-pointer"
                                            onClick={() => router.push(`/accounting/ledger?account=${account.id}`)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-mono font-bold text-gray-900">
                                                    {account.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{account.name}</div>
                                                {account.description && (
                                                    <div className="text-xs text-gray-500">{account.description}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(account.type)}`}>
                                                    {account.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className={`text-sm font-bold ${parseFloat(account.balance.toString()) >= 0 ? 'text-gray-900' : 'text-red-600'
                                                    }`}>
                                                    ${parseFloat(account.balance.toString()).toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2 py-1 text-xs rounded-full ${account.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {account.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SummaryCard
                        title="Total Accounts"
                        value={accounts.length}
                        icon="📊"
                    />
                    <SummaryCard
                        title="Active Accounts"
                        value={accounts.filter(a => a.is_active).length}
                        icon="✅"
                    />
                    <SummaryCard
                        title="With Balances"
                        value={accounts.filter(a => Math.abs(parseFloat(a.balance.toString())) > 0).length}
                        icon="💰"
                    />
                </div>
            </div>
        </div>
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

function SummaryCard({ title, value, icon }: { title: string; value: number; icon: string }) {
    return (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <div className="text-3xl">{icon}</div>
            </div>
        </div>
    );
}
