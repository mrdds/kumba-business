'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { getTransactions } from '../../services/api';
import DashboardLayout from '../../app/dashboard-layout';
import { Loader2, ArrowUpRight, ArrowDownRight, Search, Filter } from 'lucide-react';

import TransactionDetailsModal from '@/components/TransactionDetailsModal';

export default function TransactionsPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTxId, setSelectedTxId] = useState<number | null>(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const data = await getTransactions();
            setTransactions(data);
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(tx =>
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <TransactionDetailsModal
                isOpen={!!selectedTxId}
                onClose={() => setSelectedTxId(null)}
                transactionId={selectedTxId || 0}
            />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            className="bg-white pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Type</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Description</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Category</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTransactions.map((tx) => (
                                <tr
                                    key={tx.id}
                                    className="hover:bg-gray-50 transition cursor-pointer"
                                    onClick={() => setSelectedTxId(tx.id)}
                                >
                                    <td className="p-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {tx.type === 'IN' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-gray-900">{tx.description || '-'}</td>
                                    <td className="p-4">
                                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                                            {tx.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm">{new Date(tx.date).toLocaleDateString()}</td>
                                    <td className={`p-4 font-bold text-right ${tx.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.type === 'IN' ? '+' : '-'}{formatCurrency(parseFloat(tx.amount), user?.company?.currency)}
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400">
                                        No transactions found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </DashboardLayout>
    );
}
