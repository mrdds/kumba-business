'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../app/dashboard-layout';
import { getPurchases } from '../../services/api'; // getPurchases returns all, might need filtering filtering in frontend or backend
import { Plus, Receipt, Search, Filter, Paperclip, Calendar, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { useAuth } from '@/context/AuthContext';
import ApprovalStatus from '@/components/ApprovalStatus';

export default function BillsPage() {
    const { user } = useAuth();
    const [bills, setBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchBills = async () => {
            try {
                // Fetch all and filter client-side for now, ideally backend should support type filter
                const data = await getPurchases();
                const vendorBills = data.filter((p: any) => p.document_type === 'BILL');
                setBills(vendorBills);
            } catch (error) {
                console.error("Failed to fetch bills", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBills();
    }, []);

    const filteredBills = bills.filter(bill =>
        bill.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.vendor_invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.project_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vendor Bills</h1>
                    <p className="text-gray-500">Manage invoices from subcontractors and suppliers</p>
                </div>
                <Link href="/bills/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                    <Plus size={20} />
                    Record Bill
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            className="w-full bg-gray-50 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search by vendor, invoice #, or project..."
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
                        <h3 className="text-lg font-medium text-gray-900">No bills recorded</h3>
                        <p className="text-gray-500 mb-4">Record your first vendor bill or subcontractor invoice.</p>
                        <Link href="/bills/create" className="text-blue-600 font-bold hover:underline">
                            Record Bill
                        </Link>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Input Date</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Vendor</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Invoice #</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Project / Description</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Att.</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredBills.map((bill) => (
                                <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(bill.created_at || bill.date).toLocaleDateString()}
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
