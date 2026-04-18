'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../dashboard-layout';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { getPayrolls } from '../../../services/api';
import { FileText, Plus, Calendar, DollarSign, CheckCircle, Clock } from 'lucide-react';

export default function PayrollList() {
    const { user } = useAuth();
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayrolls = async () => {
            try {
                const data = await getPayrolls();
                setPayrolls(data);
            } catch (error) {
                console.error("Failed to fetch payrolls", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPayrolls();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payroll Runs</h1>
                    <p className="text-gray-500">History of salary payments</p>
                </div>
                <Link href="/hr/payroll/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                    <Plus size={20} />
                    Run Payroll
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : payrolls.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No payroll runs found</h3>
                    <p className="text-gray-500 mb-4">You haven't run any payrolls yet.</p>
                    <Link href="/hr/payroll/create" className="text-blue-600 font-bold hover:underline">
                        Run New Payroll
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {payrolls.map((run) => (
                        <Link href={`/hr/payroll/${run.id}`} key={run.id}>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition">
                                        <DollarSign size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition">
                                            Payroll Period: {formatDate(run.period_start)} - {formatDate(run.period_end)}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                Processed on {formatDate(run.created_at)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="flex -space-x-2">
                                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                                        {run.payslips?.length || 0} Employees
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Total Paid</p>
                                        <p className="text-xl font-bold text-gray-900">{formatCurrency(run.total_amount, user?.company?.currency)}</p>
                                    </div>

                                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${run.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                        run.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {run.status === 'PAID' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                        {run.status}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
