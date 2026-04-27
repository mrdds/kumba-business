'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../app/dashboard-layout';
import { getSupplier, getSupplierFinancials, getPurchases } from '../../../../services/api';
import { ArrowLeft, User, Phone, Mail, MapPin, Receipt, Wallet, DollarSign, Calendar, Paperclip, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import ApprovalStatus from '@/components/ApprovalStatus';
import { useAuth } from '@/context/AuthContext';

export default function SupplierDetailsPage({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const router = useRouter();
    const id = parseInt(params.id);

    // State
    const [supplier, setSupplier] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [bills, setBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'bills' | 'payments'>('overview');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel fetch
                const [supplierData, statsData, allPurchases] = await Promise.all([
                    getSupplier(id),
                    getSupplierFinancials(id),
                    getPurchases() // Ideally filtered by backend
                ]);

                setSupplier(supplierData);
                setStats(statsData);

                // Filter bills for this supplier
                const supplierBills = allPurchases.filter((p: any) => p.vendor_id === id);
                setBills(supplierBills);

            } catch (error) {
                console.error("Failed to load supplier data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center p-20">Loading...</div>
            </DashboardLayout>
        );
    }

    if (!supplier) {
        return (
            <DashboardLayout>
                <div className="text-center p-20">Supplier not found</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/crm/customers" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        {/* Assuming '/crm/customers' effectively lists suppliers too based on Sidebar, or create '/crm/suppliers' list later? 
                           The sidebar points to /crm/customers but maybe distinct? 
                           Actually current Sidebar has 'Customers' only. 
                           I should probably verify where list of suppliers is. 
                           But user asked for supplier space.
                           */}
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-gray-900">{supplier.name}</h1>
                        <p className="text-gray-500">Supplier / Contractor Dashboard</p>
                    </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Billed</p>
                                <h3 className="text-lg font-bold text-gray-900 mt-1">
                                    {formatCurrency(stats?.total_billed || 0, user?.company?.currency)}
                                </h3>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <Receipt size={24} />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">{stats?.invoice_count} invoices recorded</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Paid</p>
                                <h3 className="text-lg font-bold text-gray-900 mt-1">
                                    {formatCurrency(stats?.total_paid || 0, user?.company?.currency)}
                                </h3>
                            </div>
                            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                <Wallet size={24} />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">Successfully transferred</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Balance Due</p>
                                <h3 className={`text-lg font-bold mt-1 ${stats?.balance_due > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                    {formatCurrency(stats?.balance_due || 0, user?.company?.currency)}
                                </h3>
                            </div>
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                                <DollarSign size={24} />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">Outstanding amount</p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Contact Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4">Contractor Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Contact Name</label>
                                    <div className="flex items-center gap-2 mt-1 text-gray-700">
                                        <User size={16} className="text-gray-400" />
                                        {supplier.name}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                                    <div className="flex items-center gap-2 mt-1 text-gray-700">
                                        <Mail size={16} className="text-gray-400" />
                                        {supplier.email || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Phone</label>
                                    <div className="flex items-center gap-2 mt-1 text-gray-700">
                                        <Phone size={16} className="text-gray-400" />
                                        {supplier.phone || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Address</label>
                                    <div className="flex items-start gap-2 mt-1 text-gray-700">
                                        <MapPin size={16} className="text-gray-400 mt-1" />
                                        <span>{supplier.address || 'N/A'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Tax ID</label>
                                    <p className="mt-1 text-gray-700">{supplier.tax_id || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Bills & Activity */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex border-b border-gray-100">
                                <button
                                    className={`px-6 py-4 font-medium text-sm transition-colors ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                                    onClick={() => setActiveTab('overview')}
                                >
                                    Recent Activity
                                </button>
                                <button
                                    className={`px-6 py-4 font-medium text-sm transition-colors ${activeTab === 'bills' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                                    onClick={() => setActiveTab('bills')}
                                >
                                    Invoices & Bills
                                </button>
                            </div>

                            <div className="p-0">
                                {activeTab === 'overview' && (
                                    <div className="divide-y divide-gray-100">
                                        {bills.length === 0 ? (
                                            <div className="p-8 text-center text-gray-500">No activity recorded yet.</div>
                                        ) : (
                                            bills.slice(0, 5).map(bill => (
                                                <div key={bill.id} className="p-4 hover:bg-gray-50 flex items-center justify-between group">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2 rounded-lg ${bill.document_type === 'BILL' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            {bill.document_type === 'BILL' ? <Receipt size={20} /> : <Wallet size={20} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{bill.project_name}</p>
                                                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                                                <Calendar size={14} />
                                                                {new Date(bill.created_at || bill.date).toLocaleDateString()}
                                                                {bill.vendor_invoice_number && <span>• Ref: {bill.vendor_invoice_number}</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-900">{formatCurrency(bill.total_amount, user?.company?.currency)}</p>
                                                        <ApprovalStatus status={bill.status} />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        {bills.length > 0 && (
                                            <div className="p-4 bg-gray-50 text-center">
                                                <button onClick={() => setActiveTab('bills')} className="text-blue-600 font-medium hover:underline text-sm">
                                                    View all history
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'bills' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                                                <tr>
                                                    <th className="p-4">Date</th>
                                                    <th className="p-4">Ref #</th>
                                                    <th className="p-4">Description</th>
                                                    <th className="p-4">Type</th>
                                                    <th className="p-4 text-right">Amount</th>
                                                    <th className="p-4 text-right">Paid</th>
                                                    <th className="p-4 text-right">Balance</th>
                                                    <th className="p-4">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 text-sm">
                                                {bills.map(bill => (
                                                    <tr key={bill.id} className="hover:bg-gray-50">
                                                        <td className="p-4">{new Date(bill.date).toLocaleDateString()}</td>
                                                        <td className="p-4 font-mono text-gray-600">{bill.vendor_invoice_number || '-'}</td>
                                                        <td className="p-4 font-medium text-gray-900">{bill.project_name}</td>
                                                        <td className="p-4">
                                                            <span className={`text-xs font-bold px-2 py-1 rounded ${bill.document_type === 'BILL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                {bill.document_type}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right font-medium">{formatCurrency(bill.total_amount, user?.company?.currency)}</td>
                                                        <td className="p-4 text-right text-green-600">{formatCurrency(bill.total_paid, user?.company?.currency)}</td>
                                                        <td className="p-4 text-right font-bold text-red-600">{formatCurrency(bill.balance_due, user?.company?.currency)}</td>
                                                        <td className="p-4"><ApprovalStatus status={bill.status} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
