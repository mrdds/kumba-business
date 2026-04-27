'use client';

/**
 * CommandPalette — ⌘K universal search and action hub.
 * Provides: page navigation, quick actions, and entity search.
 *
 * Mount once in DashboardLayout. Triggered by ⌘K or Ctrl+K.
 */
import { useState, useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard, FileText, Receipt, ShoppingCart, Users,
    DollarSign, BarChart3, Settings, Plus, Search, ArrowRight,
    Briefcase, CreditCard, Building2, CheckSquare, Zap
} from 'lucide-react';

interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
}

// ── Navigation items ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard', group: 'Navigation' },
    { icon: FileText, label: 'Factures', path: '/invoices', group: 'Navigation' },
    { icon: Receipt, label: 'Devis', path: '/quotes', group: 'Navigation' },
    { icon: Receipt, label: 'Factures fournisseurs', path: '/bills', group: 'Navigation' },
    { icon: ShoppingCart, label: 'Bons de commande', path: '/purchases', group: 'Navigation' },
    { icon: Users, label: 'Employés', path: '/hr/employees', group: 'Navigation' },
    { icon: DollarSign, label: 'Bulletins de paie', path: '/hr/payroll', group: 'Navigation' },
    { icon: CreditCard, label: 'Dettes & Créances', path: '/debts', group: 'Navigation' },
    { icon: Building2, label: 'Clients', path: '/crm/customers', group: 'Navigation' },
    { icon: Briefcase, label: 'Fournisseurs', path: '/crm/suppliers', group: 'Navigation' },
    { icon: CheckSquare, label: 'Approbations', path: '/approvals', group: 'Navigation' },
    { icon: BarChart3, label: 'Comptabilité', path: '/accounting', group: 'Navigation' },
    { icon: BarChart3, label: 'Rapports', path: '/accounting/reports', group: 'Navigation' },
    { icon: Settings, label: 'Paramètres', path: '/settings', group: 'Navigation' },
];

// ── Quick actions ──────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
    { icon: Plus, label: 'Nouvelle facture', path: '/invoices/create', shortcut: '⌘N', group: 'Actions rapides' },
    { icon: Plus, label: 'Nouveau devis', path: '/quotes/create', group: 'Actions rapides' },
    { icon: Plus, label: 'Nouveau bon de commande', path: '/purchases/create', group: 'Actions rapides' },
    { icon: Plus, label: 'Ajouter un employé', path: '/hr/employees/create', shortcut: '⌘⇧E', group: 'Actions rapides' },
    { icon: Plus, label: 'Nouvelle facture fournisseur', path: '/bills/create', shortcut: '⌘⇧N', group: 'Actions rapides' },
    { icon: Plus, label: 'Nouveau client', path: '/crm/customers/create', group: 'Actions rapides' },
];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');

    // Reset search on close
    useEffect(() => {
        if (!open) setSearch('');
    }, [open]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const navigate = useCallback((path: string) => {
        router.push(path);
        onClose();
    }, [router, onClose]);

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl z-50 px-4">
                <Command
                    className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                    shouldFilter={true}
                >
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
                        <Search size={18} className="text-gray-400 shrink-0" />
                        <Command.Input
                            autoFocus
                            value={search}
                            onValueChange={setSearch}
                            placeholder="Rechercher une page, action, client..."
                            className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 text-sm font-medium outline-none"
                        />
                        <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-gray-400 border border-gray-200 rounded-md px-1.5 py-0.5">
                            ESC
                        </kbd>
                    </div>

                    {/* Results */}
                    <Command.List className="max-h-[380px] overflow-y-auto p-2">
                        <Command.Empty className="py-10 text-center text-sm text-gray-400">
                            Aucun résultat pour &ldquo;{search}&rdquo;
                        </Command.Empty>

                        {/* Quick Actions */}
                        <Command.Group heading="Actions rapides" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:text-blue-600 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                            {QUICK_ACTIONS.map((item) => (
                                <Command.Item
                                    key={item.path}
                                    value={item.label}
                                    onSelect={() => navigate(item.path)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                                        data-[selected]:bg-blue-600 data-[selected]:text-white
                                        text-gray-700 transition-colors group"
                                >
                                    <div className="h-8 w-8 rounded-lg bg-blue-100 group-data-[selected]:bg-white/20 flex items-center justify-center text-blue-600 group-data-[selected]:text-white shrink-0">
                                        <item.icon size={16} />
                                    </div>
                                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                                    {item.shortcut && (
                                        <kbd className="text-[10px] text-gray-400 group-data-[selected]:text-blue-100 border border-gray-200 group-data-[selected]:border-white/30 rounded px-1.5 py-0.5">
                                            {item.shortcut}
                                        </kbd>
                                    )}
                                    <ArrowRight size={14} className="opacity-0 group-data-[selected]:opacity-100" />
                                </Command.Item>
                            ))}
                        </Command.Group>

                        <div className="h-px bg-gray-100 my-1" />

                        {/* Navigation */}
                        <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                            {NAV_ITEMS.map((item) => (
                                <Command.Item
                                    key={item.path}
                                    value={item.label}
                                    onSelect={() => navigate(item.path)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer
                                        data-[selected]:bg-gray-100
                                        text-gray-600 transition-colors group"
                                >
                                    <item.icon size={16} className="text-gray-400 shrink-0" />
                                    <span className="flex-1 text-sm">{item.label}</span>
                                    <ArrowRight size={14} className="opacity-0 group-data-[selected]:opacity-100 text-gray-400" />
                                </Command.Item>
                            ))}
                        </Command.Group>
                    </Command.List>

                    {/* Footer */}
                    <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <Zap size={11} />
                            <span>OurSpace</span>
                        </div>
                        <div className="ml-auto flex items-center gap-3 text-[10px] text-gray-400">
                            <span className="flex items-center gap-1"><kbd className="border border-gray-200 rounded px-1">↑↓</kbd> naviguer</span>
                            <span className="flex items-center gap-1"><kbd className="border border-gray-200 rounded px-1">↵</kbd> ouvrir</span>
                            <span className="flex items-center gap-1"><kbd className="border border-gray-200 rounded px-1">ESC</kbd> fermer</span>
                        </div>
                    </div>
                </Command>
            </div>
        </>
    );
}
