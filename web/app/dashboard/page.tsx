'use client';
import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardSummary, getPendingApprovals } from '../../services/api';
import { usePreferences } from '../../context/PreferencesContext';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ArrowDownRight, FileText, Users, DollarSign } from 'lucide-react';
import DashboardLayout from '../dashboard-layout';
import { useApiQuery } from '@/hooks/useApiQuery';
import { Skeleton } from '@/components/ui/Skeleton';
import { SmartAlerts } from '@/components/ui/SmartAlerts';

export default function Dashboard() {
    const { user } = useAuth();
    const { formatCurrency } = usePreferences();
    const { t } = useTranslation();

    const isEmployee = user?.role === 'EMPLOYEE' || user?.role === 'STANDARD_USER';

    // ── Data fetching ──────────────────────────────────────────────────────
    const { data, loading } = useApiQuery(
        getDashboardSummary,
        [user?.id],
        { enabled: !!user && !isEmployee }
    );

    const { data: approvals } = useApiQuery(
        getPendingApprovals,
        [user?.id],
        { enabled: !!user && !isEmployee }
    );

    const pendingCount = useMemo(() =>
        Array.isArray(approvals) ? approvals.length : 0,
        [approvals]
    );

    const fmt = (amount: number) => formatCurrency(amount || 0, 'XOF');

    return (
        <DashboardLayout>
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-lg font-bold text-gray-900">{t('dashboard.title')}</h1>
            </header>

            {/* ── Smart Alerts ─────────────────────────────────────── */}
            {!isEmployee && (
                <SmartAlerts data={data} pendingApprovals={pendingCount} />
            )}

            {/* ── Stats Grid (Admin/Manager) ────────────────────────── */}
            {!isEmployee && (
                loading ? <Skeleton.DashboardStats /> : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Balance */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/20">
                            <p className="text-blue-100 text-sm font-medium">{t('dashboard.balance')}</p>
                            <h3 className="text-xl font-bold mt-2">{fmt(data?.balance)}</h3>
                        </div>

                        {/* Revenue */}
                        <StatCard
                            label={t('dashboard.income')}
                            value={fmt(data?.revenue)}
                            icon={<ArrowUpRight size={22} className="text-green-600" />}
                            iconBg="bg-green-50"
                        />

                        {/* Expenses */}
                        <StatCard
                            label={t('dashboard.expenses')}
                            value={fmt(data?.expenses)}
                            icon={<ArrowDownRight size={22} className="text-red-500" />}
                            iconBg="bg-red-50"
                        />

                        {/* Unpaid invoices */}
                        <StatCard
                            label={t('dashboard.unpaid')}
                            value={fmt(data?.unpaid_invoices_amount || 0)}
                            icon={<FileText size={22} className="text-orange-600" />}
                            iconBg="bg-orange-50"
                            sub={`${data?.unpaid_invoices_count || 0} ${t('dashboard.pending')}`}
                            subColor="text-red-500"
                        />

                        {/* Payroll */}
                        <StatCard
                            label={t('dashboard.payroll')}
                            value={fmt(data?.pending_salaries_amount || 0)}
                            icon={<Users size={22} className="text-purple-600" />}
                            iconBg="bg-purple-50"
                            sub={t('dashboard.monthly_proj')}
                        />
                    </div>
                )
            )}

            {/* ── Employee Banner ───────────────────────────────────── */}
            {isEmployee && (
                <div className="mb-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold mb-2">
                            {t('dashboard.welcome.msg', { name: user?.first_name })}
                        </h2>
                        <p className="text-indigo-100 max-w-xl">{t('dashboard.welcome.subtitle')}</p>
                    </div>
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
                </div>
            )}

            {/* ── Quick Actions ─────────────────────────────────────── */}
            <div className="mb-8">
                <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">{t('dashboard.quick_actions')}</h3>
                <div className="flex flex-wrap gap-3">
                    {isEmployee ? (
                        <>
                            <QuickAction href="/hr/advances/create" icon={<DollarSign size={20} />} color="emerald"
                                label={t('dashboard.actions.advance')} desc={t('dashboard.actions.advance_desc')} />
                            <QuickAction href="/me" icon={<Users size={20} />} color="blue"
                                label={t('dashboard.actions.profile')} desc={t('dashboard.actions.profile_desc')} />
                        </>
                    ) : (
                        <>
                            <QuickAction href="/invoices/create" icon={<FileText size={20} />} color="indigo"
                                label={t('dashboard.actions.new_invoice')} desc={t('dashboard.actions.new_invoice_desc')} />
                            <QuickAction href="/purchases/create" icon={<ShoppingCartIcon />} color="violet"
                                label={t('dashboard.actions.new_po')} desc={t('dashboard.actions.new_po_desc')} />
                        </>
                    )}
                </div>
            </div>

            {/* ── Recent Transactions ───────────────────────────────── */}
            {!isEmployee && (
                loading ? <Skeleton.TableList count={5} cols={3} /> : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">{t('dashboard.recent_transactions')}</h3>
                            <a href="/accounting" className="text-blue-600 text-sm font-semibold hover:underline">
                                {t('dashboard.view_all')}
                            </a>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {(data?.recent_transactions || []).map((tx: any) => (
                                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${tx.type === 'IN' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                            {tx.type === 'IN' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{tx.description || tx.category}</p>
                                            <p className="text-xs text-gray-400">{tx.date}</p>
                                        </div>
                                    </div>
                                    <span className={`font-bold text-sm ${tx.type === 'IN' ? 'text-green-600' : 'text-red-500'}`}>
                                        {tx.type === 'IN' ? '+' : '−'}{fmt(tx.amount)}
                                    </span>
                                </div>
                            ))}
                            {!data?.recent_transactions?.length && (
                                <div className="p-8 text-center text-gray-400 text-sm">{t('dashboard.no_transactions')}</div>
                            )}
                        </div>
                    </div>
                )
            )}
        </DashboardLayout>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────
function StatCard({ label, value, icon, iconBg, sub, subColor = 'text-gray-400' }: {
    label: string; value: string; icon: React.ReactNode; iconBg: string;
    sub?: string; subColor?: string;
}) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <p className="text-gray-500 text-sm font-medium">{label}</p>
                <div className={`p-2 rounded-xl ${iconBg}`}>{icon}</div>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{value || '—'}</h3>
            {sub && <p className={`text-xs mt-1 font-medium ${subColor}`}>{sub}</p>}
        </div>
    );
}

function QuickAction({ href, icon, color, label, desc }: {
    href: string; icon: React.ReactNode; color: string; label: string; desc: string;
}) {
    const colors: Record<string, string> = {
        emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600',
        blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600',
        violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600',
    };
    return (
        <a href={href} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className={`p-3 rounded-xl transition-colors group-hover:text-white ${colors[color]}`}>
                {icon}
            </div>
            <div>
                <p className="font-bold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
            </div>
        </a>
    );
}

function ShoppingCartIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
    );
}
