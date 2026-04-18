'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardSummary } from '../../services/api';
import { Loader2, DollarSign, ArrowUpRight, ArrowDownRight, FileText, Users } from 'lucide-react';
import DashboardLayout from '../dashboard-layout';

export default function Dashboard() {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const isEmployee = user?.role === 'EMPLOYEE' || user?.role === 'STANDARD_USER';

    useEffect(() => {
        if (!user) return;

        if (isEmployee) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const result = await getDashboardSummary();
                setData(result);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, isEmployee]);

    const formatCurrency = (amount: number) => {
        const currencyCode = data?.currency || 'USD';
        try {
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: currencyCode,
            }).format(amount);
        } catch (e) {
            return `${currencyCode} ${amount.toFixed(2)}`;
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            </header>

            {/* Stats Grid - Admin/Manager Only */}
            {!isEmployee && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-blue-100 font-medium">Total Balance</p>
                                <h3 className="text-3xl font-bold mt-1">{formatCurrency(data?.balance)}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 font-medium">Total Income</p>
                                <h3 className="text-3xl font-bold mt-1 text-gray-900">{formatCurrency(data?.revenue)}</h3>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg">
                                <ArrowUpRight size={24} className="text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 font-medium">Total Expenses</p>
                                <h3 className="text-3xl font-bold mt-1 text-gray-900">{formatCurrency(data?.expenses)}</h3>
                            </div>
                            <div className="p-2 bg-red-50 rounded-lg">
                                <ArrowDownRight size={24} className="text-red-600" />
                            </div>
                        </div>
                    </div>

                    {/* New KPIs */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 font-medium">Unpaid Invoices</p>
                                <h3 className="text-3xl font-bold mt-1 text-gray-900">{formatCurrency(data?.unpaid_invoices_amount || 0)}</h3>
                                <p className="text-xs text-red-500 mt-1">{data?.unpaid_invoices_count || 0} Pending</p>
                            </div>
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <FileText size={24} className="text-orange-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 font-medium">Estimated Payroll</p>
                                <h3 className="text-3xl font-bold mt-1 text-gray-900">{formatCurrency(data?.pending_salaries_amount || 0)}</h3>
                                <p className="text-xs text-gray-400 mt-1">Monthly projection</p>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Users size={24} className="text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Employee Welcome Banner */}
            {isEmployee && (
                <div className="mb-8 bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white shadow-lg overflow-hidden relative">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.first_name}!</h2>
                        <p className="text-indigo-100 max-w-xl">
                            Find your latest updates, manage your profile, and handle your requests from your personal dashboard.
                        </p>
                    </div>
                    {/* Decorative Circle */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>
                </div>
            )}


            {/* Quick Actions */}
            <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex gap-4">
                    {user?.role === 'STANDARD_USER' || user?.role === 'EMPLOYEE' ? (
                        <>
                            <a href="/hr/advances/create" className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                                <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Request Advance</p>
                                    <p className="text-xs text-gray-500">Salary advance</p>
                                </div>
                            </a>

                            <a href="/me" className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                                <div className="bg-blue-100 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">My Profile</p>
                                    <p className="text-xs text-gray-500">View details</p>
                                </div>
                            </a>
                        </>
                    ) : (
                        <>
                            <a href="/purchases/create" className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                                <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">New Purchase Order</p>
                                    <p className="text-xs text-gray-500">Create PO for vendor</p>
                                </div>
                            </a>

                            <a href="/invoices/create" className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                                <div className="bg-purple-100 p-3 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">New Invoice</p>
                                    <p className="text-xs text-gray-500">Bill a client</p>
                                </div>
                            </a>
                        </>
                    )}
                </div>
            </div>

            {/* Recent Transactions - Admin/Manager Only */}
            {!isEmployee && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Recent Transactions</h3>
                        <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {data?.recent_transactions.map((tx: any) => (
                            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${tx.type === 'IN' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {tx.type === 'IN' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{tx.description || tx.category}</p>
                                        <p className="text-sm text-gray-500">{tx.date}</p>
                                    </div>
                                </div>
                                <span className={`font-medium ${tx.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </span>
                            </div>
                        ))}
                        {data?.recent_transactions.length === 0 && (
                            <div className="p-8 text-center text-gray-500">No transactions yet</div>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout >
    );
}
