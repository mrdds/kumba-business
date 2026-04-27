'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../app/dashboard-layout';
import { getPurchases } from '../../services/api';
import { Plus, Receipt, Search, Paperclip, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { useAuth } from '@/context/AuthContext';
import ApprovalStatus from '@/components/ApprovalStatus';
import { useTranslation } from 'react-i18next';

interface Bill {
    id: number;
    created_at?: string;
    date?: string;
    vendor_id: number;
    vendor_name: string;
    vendor_invoice_number?: string;
    project_name: string;
    total_amount: number;
    status: string;
    document_type: string;
    attachment?: string;
}

export default function BillsPage() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        let isMounted = true;
        const fetchBills = async () => {
            try {
                const data = await getPurchases();
                const vendorBills = data.filter((p: Bill) => p.document_type === 'BILL');
                if (isMounted) setBills(vendorBills);
            } catch (error) {
                console.error(t('errors.fetch_failed'), error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchBills();
        return () => { isMounted = false; };
    }, [t]);

    const filteredBills = bills.filter(bill =>
        bill.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.vendor_invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.project_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-lg font-bold text-gray-900">{t('bills.title')}</h1>
                    <p className="text-gray-500">{t('bills.subtitle')}</p>
                </div>
                <Link href="/bills/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                    <Plus size={20} />
                    {t('bills.record_bill')}
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            className="w-full bg-gray-50 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={t('bills.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredBills.length === 0 ? (
                    <div className="text-center py-12">
                        <Receipt size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">{t('bills.no_records.title')}</h3>
                        <p className="text-gray-500 mb-4">{t('bills.no_records.subtitle')}</p>
                        <Link href="/bills/create" className="text-blue-600 font-bold hover:underline">
                            {t('bills.record_bill')}
                        </Link>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('bills.table.input_date')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('bills.table.vendor')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('bills.table.invoice_no')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('bills.table.project_desc')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('bills.table.amount')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('bills.table.status')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{t('bills.table.att')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">{t('bills.table.action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredBills.map((bill) => (
                                <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {(bill.created_at || bill.date) ? new Date(bill.created_at || bill.date as string).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <Link href={`/crm/suppliers/${bill.vendor_id}`} className="hover:text-blue-600 hover:underline">
                                            {bill.vendor_name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{bill.vendor_invoice_number || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{bill.project_name}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(bill.total_amount, user?.company?.currency)}</td>
                                    <td className="px-6 py-4">
                                        <ApprovalStatus status={bill.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        {bill.attachment && (
                                            <a href={bill.attachment} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                                <Paperclip size={18} />
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/bills/${bill.id}`} className="text-gray-400 hover:text-blue-600">
                                            <ArrowRight size={18} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </DashboardLayout>
    );
}
