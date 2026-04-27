import React, { useEffect, useState } from 'react';
import { X, Loader2, Calendar, FileText, ArrowRightLeft } from 'lucide-react';
import { getJournalEntry } from '@/services/api';
import { formatCurrency } from '@/utils/formatCurrency';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

interface TransactionDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: number;
}

export default function TransactionDetailsModal({
    isOpen,
    onClose,
    transactionId
}: TransactionDetailsModalProps) {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [entry, setEntry] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && transactionId) {
            setLoading(true);
            setError('');
            fetchEntry();
        } else {
            setEntry(null);
        }
    }, [isOpen, transactionId]);

    const fetchEntry = async () => {
        try {
            const data = await getJournalEntry(transactionId);
            setEntry(data);
        } catch (err) {
            console.error('Failed to fetch Journal Entry details', err);
            setError(t('transactions.modal.error'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <ArrowRightLeft className="text-blue-600" size={24} />
                            {t('transactions.modal.title')}
                        </h2>
                        {entry && <p className="text-gray-500 text-sm mt-1">{t('transactions.modal.ref')}: {entry.reference || 'N/A'}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500 hover:text-gray-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <Loader2 className="animate-spin mb-3" size={32} />
                            <p>{t('transactions.modal.loading')}</p>
                        </div>
                    ) : error ? (
                        <div className="text-center text-gray-500 py-12">
                            <p className="text-red-500 mb-2">{error}</p>
                            <button onClick={fetchEntry} className="text-blue-600 hover:underline">{t('transactions.modal.try_again')}</button>
                        </div>
                    ) : entry ? (
                        <div className="space-y-6">
                            {/* Meta Info */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">{t('transactions.table.date')}</p>
                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                        <Calendar size={14} /> {new Date(entry.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">{t('transactions.table.description')}</p>
                                    <p className="font-medium text-gray-900">{entry.description}</p>
                                </div>
                            </div>

                            {/* Lines Table */}
                            <div>
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <FileText size={18} /> {t('transactions.modal.accounting_entries')}
                                </h3>
                                <div className="border border-gray-100 rounded-xl overflow-hidden">
                                    <table className="w-full text-left bg-white">
                                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                                            <tr>
                                                <th className="p-3">{t('transactions.modal.table.account')}</th>
                                                <th className="p-3">{t('transactions.modal.table.description')}</th>
                                                <th className="p-3 text-right">{t('transactions.modal.table.debit')}</th>
                                                <th className="p-3 text-right">{t('transactions.modal.table.credit')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-sm">
                                            {entry.lines.map((line: any) => (
                                                <tr key={line.id} className="hover:bg-gray-50/50">
                                                    <td className="p-3 font-medium text-gray-900">
                                                        {line.account_code} - {line.account_name}
                                                    </td>
                                                    <td className="p-3 text-gray-500">{line.description}</td>
                                                    <td className="p-3 text-right font-medium text-gray-900">
                                                        {line.debit > 0 ? formatCurrency(line.debit, user?.company?.currency) : '-'}
                                                    </td>
                                                    <td className="p-3 text-right font-medium text-gray-900">
                                                        {line.credit > 0 ? formatCurrency(line.credit, user?.company?.currency) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td colSpan={2} className="p-3 text-right font-bold text-gray-900 uppercase text-xs">{t('transactions.modal.table.total')}</td>
                                                <td className="p-3 text-right font-bold text-gray-900">{formatCurrency(entry.total_debit, user?.company?.currency)}</td>
                                                <td className="p-3 text-right font-bold text-gray-900">{formatCurrency(entry.total_credit, user?.company?.currency)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-medium transition shadow-sm"
                    >
                        {t('transactions.modal.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}
