'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface JournalLine {
    id: number;
    account_id: number;
    account_code: string;
    account_name: string;
    debit: number;
    credit: number;
    description: string;
}

interface JournalEntry {
    id: number;
    date: string;
    reference: string;
    description: string;
    status: string;
    entry_type: string;
    total_debit: number;
    total_credit: number;
    is_balanced: boolean;
    lines: JournalLine[];
    created_at: string;
    posted_at: string | null;
}

export default function JournalEntries() {
    const router = useRouter();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchEntries();
    }, [statusFilter]);

    const fetchEntries = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const statusParam = statusFilter !== 'all' ? `?status=${statusFilter}` : '';

            const res = await fetch(
                `http://localhost:8000/api/accounting/journal-entries${statusParam}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (!res.ok) throw new Error('Failed to fetch journal entries');

            const data = await res.json();
            setEntries(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching journal entries:', error);
            setLoading(false);
        }
    };

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
                            <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
                            <p className="mt-1 text-sm text-gray-600">View all accounting entries (Écritures Comptables)</p>
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
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            All ({entries.length})
                        </button>
                        <button
                            onClick={() => setStatusFilter('POSTED')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === 'POSTED' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Posted ({entries.filter(e => e.status === 'POSTED').length})
                        </button>
                        <button
                            onClick={() => setStatusFilter('DRAFT')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === 'DRAFT' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Draft ({entries.filter(e => e.status === 'DRAFT').length})
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Entries List */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Entries ({entries.length})</h2>
                        </div>
                        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                            {entries.map((entry) => (
                                <div
                                    key={entry.id}
                                    onClick={() => setSelectedEntry(entry)}
                                    className={`p-4 cursor-pointer transition ${selectedEntry?.id === entry.id
                                            ? 'bg-blue-50 border-l-4 border-blue-600'
                                            : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-mono font-bold text-sm text-blue-600">
                                                {entry.reference}
                                            </span>
                                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${entry.status === 'POSTED'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {entry.status}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500">{entry.date}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2">{entry.description}</p>
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>{entry.entry_type}</span>
                                        <span>
                                            {entry.is_balanced ? '✅' : '⚠️'} Bal: ${parseFloat(entry.total_debit.toString()).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Entry Details */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-semibold">Entry Details</h2>
                        </div>
                        {selectedEntry ? (
                            <div className="p-6">
                                {/* Header Info */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900">{selectedEntry.reference}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{selectedEntry.description}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${selectedEntry.status === 'POSTED'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {selectedEntry.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Date:</span>
                                            <span className="ml-2 font-medium">{selectedEntry.date}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Type:</span>
                                            <span className="ml-2 font-medium">{selectedEntry.entry_type}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Lines */}
                                <div className="mb-6">
                                    <h4 className="font-semibold mb-3">Lines:</h4>
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Account</th>
                                                <th className="px-3 py-2 text-right">Debit</th>
                                                <th className="px-3 py-2 text-right">Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {selectedEntry.lines.map((line) => (
                                                <tr key={line.id} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2">
                                                        <div className="font-mono font-bold text-xs text-blue-600">
                                                            {line.account_code}
                                                        </div>
                                                        <div className="text-xs text-gray-600">{line.account_name}</div>
                                                        {line.description && (
                                                            <div className="text-xs text-gray-500 italic">{line.description}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-medium">
                                                        {parseFloat(line.debit.toString()) > 0
                                                            ? `$${parseFloat(line.debit.toString()).toLocaleString()}`
                                                            : '-'}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-medium">
                                                        {parseFloat(line.credit.toString()) > 0
                                                            ? `$${parseFloat(line.credit.toString()).toLocaleString()}`
                                                            : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-100 font-bold">
                                            <tr>
                                                <td className="px-3 py-2">TOTALS</td>
                                                <td className="px-3 py-2 text-right">
                                                    ${parseFloat(selectedEntry.total_debit.toString()).toLocaleString()}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    ${parseFloat(selectedEntry.total_credit.toString()).toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Balance Check */}
                                <div className={`p-4 rounded-lg ${selectedEntry.is_balanced
                                        ? 'bg-green-50 border border-green-200'
                                        : 'bg-red-50 border border-red-200'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold">
                                            {selectedEntry.is_balanced ? '✅ Balanced' : '⚠️ Unbalanced'}
                                        </span>
                                        <span className="text-sm">
                                            Debit = Credit: {selectedEntry.is_balanced ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-gray-500">
                                <div className="text-4xl mb-4">📝</div>
                                <p>Select an entry to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
