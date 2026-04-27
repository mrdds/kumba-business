'use client';

/**
 * SmartAlerts — Intelligent dashboard alert system.
 * Analyses dashboard data and surfaces actionable insights.
 *
 * Beats QuickBooks: proactive, contextual, and actionable in 1 click.
 *
 * Usage:
 *   <SmartAlerts data={dashboardData} approvals={pendingApprovals} />
 */
import React, { useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, TrendingDown, Bell, CheckCircle, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';

interface DashboardData {
    balance?: number;
    expenses?: number;
    revenue?: number;
    unpaid_invoices_count?: number;
    unpaid_invoices_amount?: number;
    pending_salaries_amount?: number;
    recent_transactions?: any[];
}

interface Alert {
    id: string;
    severity: 'danger' | 'warning' | 'info' | 'success';
    icon: React.ElementType;
    title: string;
    description: string;
    action?: { label: string; href: string };
    dismissible?: boolean;
}

function buildAlerts(data: DashboardData | null, pendingApprovals: number): Alert[] {
    if (!data) return [];
    const alerts: Alert[] = [];

    // 🔴 Cash flow critique
    if (data.balance !== undefined && data.expenses && data.balance < data.expenses * 0.5) {
        alerts.push({
            id: 'low-cashflow',
            severity: 'danger',
            icon: TrendingDown,
            title: 'Trésorerie critique',
            description: `Votre solde (${data.balance.toLocaleString('fr-FR')} XOF) couvre moins de 2 semaines de charges. Agissez maintenant.`,
            action: { label: 'Voir la comptabilité', href: '/accounting' },
        });
    }

    // 🔴 Factures impayées > 15
    if ((data.unpaid_invoices_count || 0) > 15) {
        alerts.push({
            id: 'many-unpaid',
            severity: 'danger',
            icon: AlertTriangle,
            title: `${data.unpaid_invoices_count} factures impayées`,
            description: `Montant total en attente : ${(data.unpaid_invoices_amount || 0).toLocaleString('fr-FR')} XOF. Relancez vos clients.`,
            action: { label: 'Voir les factures', href: '/invoices?filter=unpaid' },
        });
    }

    // 🟠 Factures impayées modérées
    else if ((data.unpaid_invoices_count || 0) > 3) {
        alerts.push({
            id: 'unpaid-invoices',
            severity: 'warning',
            icon: Clock,
            title: `${data.unpaid_invoices_count} factures en attente de paiement`,
            description: `${(data.unpaid_invoices_amount || 0).toLocaleString('fr-FR')} XOF à encaisser.`,
            action: { label: 'Gérer', href: '/invoices' },
            dismissible: true,
        });
    }

    // 🟠 Approbations bloquées
    if (pendingApprovals > 2) {
        alerts.push({
            id: 'pending-approvals',
            severity: 'warning',
            icon: Clock,
            title: `${pendingApprovals} approbation${pendingApprovals > 1 ? 's' : ''} en attente`,
            description: 'Des documents nécessitent votre validation pour avancer.',
            action: { label: 'Valider maintenant', href: '/approvals' },
        });
    }

    // 🔵 Revenus en hausse
    if (data.revenue && data.expenses && data.revenue > data.expenses * 1.3) {
        alerts.push({
            id: 'good-margin',
            severity: 'success',
            icon: CheckCircle,
            title: 'Excellente marge ce mois-ci',
            description: `Vos revenus dépassent vos charges de ${Math.round((data.revenue / data.expenses - 1) * 100)}%. Continuez ainsi !`,
            dismissible: true,
        });
    }

    // 🔵 Info paie
    if ((data.pending_salaries_amount || 0) > 0) {
        alerts.push({
            id: 'pending-payroll',
            severity: 'info',
            icon: Bell,
            title: 'Paie en attente',
            description: `${(data.pending_salaries_amount || 0).toLocaleString('fr-FR')} XOF de salaires à verser ce mois.`,
            action: { label: 'Voir la paie', href: '/hr/payroll' },
            dismissible: true,
        });
    }

    return alerts;
}

const SEVERITY_STYLES = {
    danger:  'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info:    'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-green-50 border-green-200 text-green-900',
};

const ICON_STYLES = {
    danger:  'text-red-500',
    warning: 'text-amber-500',
    info:    'text-blue-500',
    success: 'text-green-500',
};

const ACTION_STYLES = {
    danger:  'text-red-700 hover:text-red-900',
    warning: 'text-amber-700 hover:text-amber-900',
    info:    'text-blue-700 hover:text-blue-900',
    success: 'text-green-700 hover:text-green-900',
};

interface SmartAlertsProps {
    data: DashboardData | null;
    pendingApprovals?: number;
    className?: string;
}

export function SmartAlerts({ data, pendingApprovals = 0, className = '' }: SmartAlertsProps) {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const alerts = useMemo(
        () => buildAlerts(data, pendingApprovals),
        [data, pendingApprovals]
    );

    const visible = alerts.filter(a => !dismissed.has(a.id));

    if (visible.length === 0) return null;

    return (
        <div className={`space-y-2 mb-6 ${className}`}>
            {visible.map((alert) => {
                const Icon = alert.icon;
                return (
                    <div
                        key={alert.id}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm transition-all ${SEVERITY_STYLES[alert.severity]}`}
                    >
                        <Icon size={16} className={`mt-0.5 shrink-0 ${ICON_STYLES[alert.severity]}`} />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold leading-snug">{alert.title}</p>
                            <p className="text-[13px] opacity-80 mt-0.5 leading-snug">{alert.description}</p>
                            {alert.action && (
                                <Link
                                    href={alert.action.href}
                                    className={`inline-flex items-center gap-1 text-xs font-bold mt-1.5 ${ACTION_STYLES[alert.severity]}`}
                                >
                                    {alert.action.label} <ArrowRight size={11} />
                                </Link>
                            )}
                        </div>
                        {alert.dismissible && (
                            <button
                                onClick={() => setDismissed(s => new Set([...s, alert.id]))}
                                className="p-0.5 rounded opacity-50 hover:opacity-100 transition-opacity shrink-0"
                                aria-label="Fermer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
