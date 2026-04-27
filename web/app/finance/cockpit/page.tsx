'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Camera,
  FileIcon,
  Building,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';
import DashboardLayout from '../../dashboard-layout';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getDashboardSummary, getBankAccounts } from '@/services/api';
import { usePreferences } from '@/context/PreferencesContext';
import { Skeleton } from '@/components/ui/Skeleton';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

const MetricCard = ({ title, amount, trend, trendValue, icon: Icon, isNegative = false, loading = false }: any) => (
  <div className="relative overflow-hidden p-6 rounded-[24px] bg-white border border-slate-100/60 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer">
    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
    <div className="relative z-10 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-slate-50 rounded-2xl text-slate-600 group-hover:scale-110 transition-transform duration-300">
          <Icon size={20} strokeWidth={2.5} />
        </div>
        {!loading && trendValue && (
          <div className={clsx(
            "flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full",
            trend === 'up' ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
          )}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</h3>
        {loading ? (
          <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg mt-1" />
        ) : (
          <p className={clsx("text-3xl font-extrabold tracking-tight", displayFont.className, isNegative ? "text-rose-600" : "text-slate-900")}>
            {amount}
          </p>
        )}
      </div>
    </div>
  </div>
);

export default function FinancialCockpit() {
  const [mounted, setMounted] = useState(false);
  const { formatCurrency } = usePreferences();
  
  const { data, loading } = useApiQuery(getDashboardSummary, []);
  const { data: bankAccounts, loading: banksLoading } = useApiQuery(getBankAccounts, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Derived metrics
  const fmt = (val: number) => formatCurrency(val || 0, data?.currency || 'XOF');
  
  // Mock calculations for advanced ERP KPIs using real basic data
  const runwayMonths = data?.expenses > 0 ? (data.balance / (data.expenses / 12)).toFixed(1) : '∞';
  const runwayTrend = parseFloat(runwayMonths) > 6 ? 'up' : 'down';
  const bfr = (data?.unpaid_invoices_amount || 0) + (data?.pending_salaries_amount || 0);

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-[#FBFDFE] text-slate-900 pb-20">
      {/* Header Section */}
      <div className="pt-12 pb-8 px-8 border-b border-slate-100 bg-white/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Temps réel • SYSCOHADA</span>
            </div>
            <h1 className={clsx("text-4xl font-black tracking-tight text-slate-900", displayFont.className)}>
              Cockpit Financier
            </h1>
          </div>
          <div className="flex gap-3">
            <a href="/accounting/reports" className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer block">
              Générer Pack Banquier
            </a>
            <a href="/accounting/journal-entries" className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 cursor-pointer block">
              Clôture Mensuelle
            </a>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 pt-10">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <MetricCard 
            title="Trésorerie Nette" 
            amount={fmt(data?.balance)} 
            trend={data?.balance > 0 ? "up" : "down"} 
            trendValue="" 
            icon={Wallet} 
            loading={loading}
          />
          <MetricCard 
            title="Besoin Fonds Roulement" 
            amount={fmt(bfr)} 
            trend={bfr > 0 ? "down" : "up"} 
            trendValue="" 
            icon={Activity} 
            loading={loading}
          />
          <MetricCard 
            title="CA (Revenus)" 
            amount={fmt(data?.revenue)} 
            trend="up" 
            trendValue="" 
            icon={Briefcase} 
            loading={loading}
          />
          <MetricCard 
            title="Runway (Piste Trésorerie)" 
            amount={`${runwayMonths} Mois`} 
            trend={runwayTrend} 
            trendValue="" 
            icon={TrendingUp} 
            loading={loading}
          />
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cash Flow Forecast Chart Placeholder */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-[32px] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <select className="bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600 rounded-lg px-3 py-1.5 outline-none cursor-pointer">
                  <option>Projection 6 Mois</option>
                  <option>Projection 12 Mois</option>
                </select>
              </div>

              <h2 className={clsx("text-xl font-bold text-slate-800 mb-8", displayFont.className)}>Prévisions de Trésorerie (IA)</h2>

              {/* Dynamic Chart Visual */}
              <div className="h-64 flex items-end justify-between gap-2 mt-4 relative">
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between border-b border-slate-100 pb-6 opacity-30">
                  <div className="w-full border-b border-slate-200 border-dashed" />
                  <div className="w-full border-b border-slate-200 border-dashed" />
                  <div className="w-full border-b border-slate-200 border-dashed" />
                  <div className="w-full border-b border-slate-200 border-dashed" />
                </div>

                {/* Bars */}
                {!loading && [...Array(6)].map((_, i) => {
                  const currentBal = data?.balance || 0;
                  const netMonthly = (data?.revenue || 0) - (data?.expenses || 0);
                  
                  // Calculate projected balances for 6 months (3 past, 1 current, 2 future)
                  let val = currentBal;
                  if (i === 0) val = currentBal - 2 * netMonthly;
                  else if (i === 1) val = currentBal - 1 * netMonthly;
                  else if (i === 2) val = currentBal; // Current month
                  else if (i === 3) val = currentBal + 1 * netMonthly;
                  else if (i === 4) val = currentBal + 2 * netMonthly;
                  else if (i === 5) val = currentBal + 3 * netMonthly;
                  
                  // Handle negative balances for visual height (min 10%)
                  val = Math.max(val, 0);

                  // Find max value to normalize heights
                  const maxVal = Math.max(
                    currentBal - 2 * netMonthly, 
                    currentBal + 3 * netMonthly,
                    currentBal * 1.5, // Ensure some headroom
                    1 // avoid div by 0
                  );
                  
                  const heightPct = Math.max(10, Math.min(100, (val / maxVal) * 100));
                  
                  const isFuture = i > 2;
                  
                  // Generate recent month names dynamically
                  const monthNames = [];
                  const d = new Date();
                  d.setMonth(d.getMonth() - 2); // Start from 2 months ago
                  for (let m = 0; m < 6; m++) {
                    monthNames.push(d.toLocaleString('fr-FR', { month: 'short' }));
                    d.setMonth(d.getMonth() + 1);
                  }

                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center group relative z-10" title={fmt(val)}>
                      {isFuture && (
                        <div className="absolute -top-8 text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          Prévu
                        </div>
                      )}
                      <div
                        className={clsx(
                          "w-full max-w-[48px] rounded-t-xl transition-all duration-500 cursor-pointer",
                          isFuture
                            ? "bg-gradient-to-t from-indigo-100 to-indigo-200 border-t-2 border-indigo-400 opacity-80"
                            : "bg-slate-800 hover:bg-slate-700"
                        )}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">
                        {monthNames[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invoices & Anomalies */}
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-rose-50/50 border border-rose-100/50 rounded-[24px] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                    <AlertCircle size={18} />
                  </div>
                  <h3 className={clsx("text-sm font-bold text-rose-900", displayFont.className)}>Alertes Trésorerie</h3>
                </div>
                <div className="space-y-3">
                  {loading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-10 bg-rose-100/30 rounded-xl" />
                      <div className="h-10 bg-rose-100/30 rounded-xl" />
                    </div>
                  ) : (
                    <>
                      {data?.unpaid_invoices_count > 0 && (
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-rose-100/30 flex justify-between items-center cursor-pointer hover:border-rose-300 transition-colors">
                          <div>
                            <p className="text-xs font-bold text-slate-700">Factures Impayées</p>
                            <p className="text-[10px] text-slate-500">{data.unpaid_invoices_count} factures ({fmt(data.unpaid_invoices_amount)})</p>
                          </div>
                          <ArrowUpRight size={14} className="text-slate-400" />
                        </div>
                      )}
                      {data?.pending_salaries_amount > 0 && data?.balance < data?.pending_salaries_amount && (
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-rose-100/30 flex justify-between items-center cursor-pointer hover:border-rose-300 transition-colors">
                          <div>
                            <p className="text-xs font-bold text-slate-700">Risque Salaires</p>
                            <p className="text-[10px] text-slate-500">Trésorerie insuf. pour {fmt(data.pending_salaries_amount)}</p>
                          </div>
                          <ArrowUpRight size={14} className="text-slate-400" />
                        </div>
                      )}
                      {(!data?.unpaid_invoices_count) && (!data?.pending_salaries_amount || data?.balance >= data?.pending_salaries_amount) && (
                        <div className="text-center py-4 text-xs text-slate-500">
                          Aucune alerte majeure détectée.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-100 shadow-sm rounded-[24px] p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className={clsx("text-sm font-bold text-slate-800", displayFont.className)}>Transactions Récentes</h3>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{data?.unpaid_invoices_count || 0} factures impayées</span>
                </div>
                <div className="space-y-4">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex justify-between items-center animate-pulse">
                          <div>
                            <div className="h-3 w-24 bg-slate-100 rounded mb-1" />
                            <div className="h-2 w-16 bg-slate-50 rounded" />
                          </div>
                          <div className="h-4 w-16 bg-slate-100 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    (data?.recent_transactions || []).slice(0, 3).map((tx: any) => (
                      <div key={tx.id} className="flex justify-between items-center group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            "p-2 rounded-xl transition-colors",
                            tx.type === 'IN' ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" : "bg-rose-50 text-rose-600 group-hover:bg-rose-100"
                          )}>
                            {tx.type === 'IN' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{tx.description || tx.category}</p>
                            <p className="text-[10px] text-slate-400">{tx.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={clsx(
                            "text-xs font-black",
                            tx.type === 'IN' ? "text-emerald-700" : "text-slate-900"
                          )}>
                            {tx.type === 'IN' ? '+' : '-'}{fmt(tx.amount)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {!loading && (!data?.recent_transactions || data.recent_transactions.length === 0) && (
                    <div className="text-center text-xs text-slate-400 py-4">Aucune transaction récente</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-slate-900 text-white rounded-[32px] p-8 shadow-2xl shadow-slate-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20" />
              <h3 className={clsx("text-lg font-bold mb-6 relative z-10", displayFont.className)}>Actions Rapides</h3>
              <div className="space-y-3 relative z-10">
                <a href="/purchases/create" className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors group cursor-pointer block">
                  <span className="text-sm font-semibold">Scanner Facture (OCR)</span>
                  <Camera size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                </a>
                <a href="/accounting/reconciliation" className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors group cursor-pointer block">
                  <span className="text-sm font-semibold">Rapprocher Banque</span>
                  <Building size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                </a>
                <a href="/accounting/reports" className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors group cursor-pointer block">
                  <span className="text-sm font-semibold">Générer TVA (CA3)</span>
                  <FileIcon size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                </a>
              </div>
            </div>

            {/* Solde Comptes */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-[32px] p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className={clsx("text-sm font-bold text-slate-800", displayFont.className)}>Comptes Connectés</h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">{(bankAccounts || []).length} comptes</span>
              </div>
              <div className="space-y-4">
                {banksLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                        <div className="flex-1">
                          <div className="h-3 w-20 bg-slate-100 rounded mb-1" />
                          <div className="h-2 w-24 bg-slate-50 rounded" />
                        </div>
                        <div className="h-3 w-16 bg-slate-100 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  (bankAccounts || []).map((account: any) => (
                    <div key={account.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                      <div className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        account.account_type === 'MOBILE_MONEY' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {account.account_type === 'MOBILE_MONEY' ? <CreditCard size={16} /> : <Building size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{account.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{account.bank_name || account.account_type} • {account.account_number || '***'}</p>
                      </div>
                      <p className="text-xs font-black text-slate-900">{fmt(account.current_balance)}</p>
                    </div>
                  ))
                )}
                {!banksLoading && (!bankAccounts || bankAccounts.length === 0) && (
                  <div className="text-center text-xs text-slate-400 py-4">Aucun compte bancaire configuré</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
    </DashboardLayout>
  );
}
