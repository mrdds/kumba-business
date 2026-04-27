'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getInvoice } from '../../../../services/api';
import { Loader2, Printer } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { useTranslation } from 'react-i18next';

export default function PrintInvoicePage() {
    const params = useParams();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params?.id) {
            getInvoice(Number(params.id))
                .then(setInvoice)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [params?.id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-gray-500" />
            </div>
        );
    }

    if (!invoice) return <div>{t('invoices.print_page.not_found')}</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8 print:p-0 print:bg-white">
            <div className="max-w-4xl mx-auto bg-white shadow-lg p-12 rounded-xl print:shadow-none print:max-w-none">
                {/* Print Controls - Hidden when printing */}
                <div className="flex justify-end mb-8 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold"
                    >
                        <Printer size={18} /> {t('invoices.print_page.print_btn')}
                    </button>
                </div>

                {/* Header */}
                <div className="flex justify-between items-start mb-12 border-b border-gray-100 pb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('invoices.print_page.invoice')}</h1>
                        <div className={`inline-block px-3 py-1 rounded text-sm font-bold ${invoice.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {invoice.status}
                        </div>
                    </div>
                    <div className="text-right text-gray-600">
                        <p className="font-bold text-gray-900 text-lg">Export Corp</p>
                        <p>123 Business Rd</p>
                        <p>Abidjan, CI</p>
                    </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-8 mb-12">
                    <div>
                        <p className="text-sm text-gray-500 uppercase font-bold mb-1">{t('invoices.print_page.bill_to')}</p>
                        <p className="font-bold text-gray-900 text-lg">{invoice.client_name}</p>
                        <p className="text-gray-600">{invoice.client_email}</p>
                    </div>
                    <div className="text-right">
                        <div className="mb-2">
                            <span className="text-gray-500 font-bold mr-4">{t('invoices.print_page.invoice_id')}</span>
                            <span className="font-bold">#{invoice.id}</span>
                        </div>
                        <div className="mb-2">
                            <span className="text-gray-500 font-bold mr-4">{t('invoices.print_page.date')}</span>
                            <span>{invoice.date}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 font-bold mr-4">{t('invoices.print_page.due_date')}</span>
                            <span>{invoice.due_date}</span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <table className="w-full mb-12">
                    <thead>
                        <tr className="border-b-2 border-gray-100">
                            <th className="text-left py-3 font-bold text-gray-600 uppercase text-sm">{t('invoices.create_page.description')}</th>
                            <th className="text-center py-3 font-bold text-gray-600 uppercase text-sm w-24">{t('invoices.create_page.qty')}</th>
                            <th className="text-right py-3 font-bold text-gray-600 uppercase text-sm w-32">{t('invoices.print_page.unit_price')}</th>
                            <th className="text-right py-3 font-bold text-gray-600 uppercase text-sm w-32">{t('invoices.table.amount')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {invoice.items.map((item: any, i: number) => (
                            <tr key={i}>
                                <td className="py-4 font-medium text-gray-900">{item.description}</td>
                                <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                                <td className="py-4 text-right text-gray-600">{formatCurrency(item.unit_price, user?.company?.currency)}</td>
                                <td className="py-4 text-right font-bold text-gray-900">{formatCurrency(item.amount, user?.company?.currency)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer total */}
                <div className="flex justify-end border-t border-gray-100 pt-8">
                    <div className="w-64">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-500">{t('invoices.print_page.subtotal')}</span>
                            <span className="font-bold">{formatCurrency(invoice.total_amount, user?.company?.currency)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xl font-bold text-blue-600 border-t border-gray-100 pt-4 mt-2">
                            <span>{t('invoices.print_page.total')}</span>
                            <span>{formatCurrency(invoice.total_amount, user?.company?.currency)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
