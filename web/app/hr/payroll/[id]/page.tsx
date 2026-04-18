'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../../../dashboard-layout';
import { getPayroll, payPayroll, getAccounts, submitPayrollApproval } from '../../../../services/api'; // Added submitPayrollApproval
import {
    ArrowLeft, DollarSign, Calendar,
    Loader2, Send
} from 'lucide-react'; // Added Send
import ConfirmationModal from '../../../../components/ConfirmationModal';
import { useNotification } from '@/context/NotificationContext'; // Added useNotification
import ApprovalStatus from '@/components/ApprovalStatus'; // Added ApprovalStatus
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';

export default function PayrollDetail() {
    const { user } = useAuth();
    const params = useParams();
    const id = parseInt(params.id as string);
    const { showToast } = useNotification();

    const [payroll, setPayroll] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Confirmation Modal State
    const [showSubmitModal, setShowSubmitModal] = useState(false); // Changed to Submit Modal

    // Payment Modal State
    const [showPayModal, setShowPayModal] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [accountsLoading, setAccountsLoading] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetchPayroll();
    }, [id]);

    const fetchPayroll = async () => {
        try {
            const data = await getPayroll(id);
            setPayroll(data);
        } catch (error) {
            console.error("Failed to fetch payroll", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setActionLoading(true);
        try {
            const result = await submitPayrollApproval(id);
            // Optimistic update or refresh
            if (result && result.status) {
                setPayroll({ ...payroll, status: result.status });
            } else {
                await fetchPayroll();
            }
            showToast('Payroll submitted for approval', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to submit payroll', 'error');
        } finally {
            setActionLoading(false);
            setShowSubmitModal(false);
        }
    };

    const openPayModal = async () => {
        setShowPayModal(true);
        setAccountsLoading(true);
        try {
            // Fetch Bank and Cash accounts
            const bankAccounts = await getAccounts('BANK');
            const cashAccounts = await getAccounts('CASH');
            setAccounts([...bankAccounts, ...cashAccounts]);
            if (bankAccounts.length > 0) setSelectedAccount(bankAccounts[0].id.toString());
        } catch (error) {
            console.error("Failed to fetch accounts", error);
        } finally {
            setAccountsLoading(false);
        }
    };

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await payPayroll(id, parseInt(selectedAccount));
            setShowPayModal(false);
            await fetchPayroll();
            showToast('Payroll marked as paid and payment recorded!', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to record payment', 'error');
        } finally {
            setActionLoading(false);
        }
    };



    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
            </DashboardLayout>
        );
    }

    if (!payroll) return <DashboardLayout>My Payroll not found</DashboardLayout>;

    return (
        <DashboardLayout>
            <ConfirmationModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onConfirm={handleSubmit}
                title="Submit for Approval"
                message="Are you sure you want to submit this payroll for approval?"
                confirmText="Submit"
                isLoading={actionLoading}
            />

            <div className="mb-8">
                <Link href="/hr/payroll" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
                    <ArrowLeft size={20} />
                    Back to Payrolls
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900">Payroll Run</h1>
                            <ApprovalStatus status={payroll.status} />
                        </div>
                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                            <Calendar size={16} />
                            Period: {payroll.period_start} to {payroll.period_end}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {payroll.status === 'DRAFT' && (
                            <button
                                onClick={() => setShowSubmitModal(true)}
                                disabled={actionLoading}
                                className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                Submit for Approval
                            </button>
                        )}

                        {payroll.status === 'APPROVED' && (
                            <button
                                onClick={openPayModal}
                                disabled={actionLoading}
                                className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <DollarSign size={20} />}
                                Record Payment
                            </button>
                        )}

                        {payroll.journal_entry && (
                            <div className="px-4 py-2 bg-gray-100 rounded-xl text-xs text-gray-600">
                                <div>Accrual Entry: #{payroll.journal_entry.id || 'N/A'}</div>
                                {payroll.payment_entry && <div>Payment Entry: #{payroll.payment_entry.id || 'N/A'}</div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-medium">Total Gross Salary</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(payroll.payslips.reduce((acc: number, p: any) => acc + p.basic_salary + p.bonus, 0), user?.company?.currency)}
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-medium">Total Taxes</p>
                    <h3 className="text-2xl font-bold text-red-600 mt-1">
                        {formatCurrency(payroll.payslips.reduce((acc: number, p: any) => acc + p.tax_amount, 0), user?.company?.currency)}
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-medium">Total Social charges</p>
                    <h3 className="text-2xl font-bold text-orange-600 mt-1">
                        {formatCurrency(payroll.payslips.reduce((acc: number, p: any) => acc + p.social_security_employee + p.social_security_employer, 0), user?.company?.currency)}
                    </h3>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-100">
                    <p className="text-blue-600 text-sm font-medium">Net Payable</p>
                    <h3 className="text-2xl font-bold text-blue-900 mt-1">
                        {formatCurrency(payroll.total_amount, user?.company?.currency)}
                    </h3>
                </div>
            </div>

            {/* Payslips Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Payslips</h3>
                    <span className="text-sm text-gray-500">{payroll.payslips.length} Employees</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Employee</th>
                                <th className="px-6 py-3 text-right">Basic Salary</th>
                                <th className="px-6 py-3 text-right">Bonus</th>
                                <th className="px-6 py-3 text-right">Taxes</th>
                                <th className="px-6 py-3 text-right">Social (Emp)</th>
                                <th className="px-6 py-3 text-right">Net Salary</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {payroll.payslips.map((slip: any) => (
                                <tr key={slip.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3">
                                                {slip.employee_name.charAt(0)}
                                            </div>
                                            <div className="font-medium text-gray-900">{slip.employee_name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                                        {formatCurrency(slip.basic_salary, user?.company?.currency)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                                        {formatCurrency(slip.bonus, user?.company?.currency)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-500">
                                        {formatCurrency(slip.tax_amount, user?.company?.currency)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-orange-500">
                                        {formatCurrency(slip.social_security_employee, user?.company?.currency)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-gray-900">
                                        {formatCurrency(slip.net_salary, user?.company?.currency)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Ready
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {showPayModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Record Payment</h3>
                            <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">×</span>
                            </button>
                        </div>

                        <form onSubmit={handlePay}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Account</label>
                                {accountsLoading ? (
                                    <div className="text-center py-4"><Loader2 className="animate-spin inline" /> Loading accounts...</div>
                                ) : (
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={selectedAccount}
                                        onChange={(e) => setSelectedAccount(e.target.value)}
                                        required
                                    >
                                        <option value="">Select an account</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} ({acc.code}) - Bal: {formatCurrency(acc.balance, user?.company?.currency)}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                    Select the bank or cash account from which salaries will be paid.
                                </p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl mb-6 flex justify-between items-center">
                                <span className="text-gray-600 font-medium">Total to Pay</span>
                                <span className="text-xl font-bold text-gray-900">{formatCurrency(payroll.total_amount, user?.company?.currency)}</span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPayModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedAccount || actionLoading}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50 flex justify-center items-center"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" /> : 'Confirm Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </DashboardLayout>
    );
}
