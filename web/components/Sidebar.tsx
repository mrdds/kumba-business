'use client';
import { LogOut, X, Timer, Box, LayoutDashboard, FileText, ShoppingCart, Users, Receipt, CreditCard, Settings, BarChart3, Briefcase, FileCheck, FileSignature, MessageSquare, MapPin, Megaphone, Wallet, HandCoins, PieChart, TrendingUp, Activity, Calendar, History, Construction, BookOpen, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { usePreferences, Language, Currency } from '../context/PreferencesContext';
import { useTranslation } from 'react-i18next';
import { useRef, useEffect, useState } from 'react';
import api from '../services/api';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const { language, setLanguage, currency, setCurrency } = usePreferences();
    const { t } = useTranslation();
    const activeRef = useRef < HTMLAnchorElement > (null);

    const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
    const [visitedFeatures, setVisitedFeatures] = useState < string[] > ([]);

    useEffect(() => {
        const stored = localStorage.getItem('kumba_visited_features');
        if (stored) {
            try {
                setVisitedFeatures(JSON.parse(stored));
            } catch (e) {
                setVisitedFeatures([]);
            }
        }
    }, []);

    const markAsVisited = (href: string) => {
        if (!visitedFeatures.includes(href)) {
            const newVisited = [...visitedFeatures, href];
            setVisitedFeatures(newVisited);
            localStorage.setItem('kumba_visited_features', JSON.stringify(newVisited));
        }
    };

    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [pathname]);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await api.get('/approvals/count');
                setPendingApprovalsCount(res.data.count);
            } catch (err) {
                console.error("Error fetching approvals count", err);
            }
        };

        if (user) {
            fetchCounts();
            const interval = setInterval(fetchCounts, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const linkGroups = [
        {
            title: 'Pilotage',
            items: [
                { name: t('sidebar.dashboard'), href: '/dashboard', icon: LayoutDashboard },
                { name: t('sidebar.cockpit', { defaultValue: 'Cockpit ERP' }), href: '/finance/cockpit', icon: Activity, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
                { name: 'OurSpace', href: '/ourspace', customIcon: '/icon.png', isNew: true },
            ]
        },
        {
            title: 'Finance & Trésorerie',
            items: [
                { name: t('sidebar.incomes'), href: '/finance/incomes', icon: TrendingUp, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
                { name: t('sidebar.expenses'), href: '/finance/expenses', icon: Wallet, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
                { name: t('sidebar.transactions'), href: '/transactions', icon: CreditCard, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
                { name: t('sidebar.debts'), href: '/debts', icon: HandCoins, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
            ]
        },
        {
            title: 'Achats & Dépenses',
            items: [
                { name: t('sidebar.purchases'), href: '/purchases', icon: ShoppingCart, allowedGroups: ['PROJECT_MANAGER', 'FINANCE', 'GENERAL_MANAGER'] },
                { name: t('sidebar.bills'), href: '/bills', icon: Receipt, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
                { name: t('sidebar.requests'), href: '/finance/requests', icon: HandCoins, allowedGroups: ['PROJECT_MANAGER', 'FINANCE', 'GENERAL_MANAGER'] },
                { name: t('sidebar.approvals'), href: '/approvals', icon: FileCheck, allowedGroups: ['PROJECT_MANAGER', 'OPERATOR_MANAGER', 'GENERAL_MANAGER', 'FINANCE'] },
            ]
        },
        {
            title: 'Ventes & Clients',
            items: [
                { name: t('sidebar.customers'), href: '/crm/customers', icon: Users, allowedGroups: ['PROJECT_MANAGER', 'OPERATOR_MANAGER', 'FINANCE', 'GENERAL_MANAGER'] },
                { name: t('sidebar.quotes'), href: '/quotes', icon: FileSignature, allowedGroups: ['PROJECT_MANAGER', 'GENERAL_MANAGER'] },
                { name: t('sidebar.invoices'), href: '/invoices', icon: FileText, allowedGroups: ['PROJECT_MANAGER', 'FINANCE', 'GENERAL_MANAGER'] },
            ]
        },
        {
            title: 'Comptabilité',
            items: [
                { name: 'Cockpit Comptable', href: '/accounting', icon: BookOpen, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
                { name: 'Rapprochement', href: '/accounting/reconciliation', icon: ArrowRightLeft, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
                { name: t('sidebar.budgets'), href: '/finance/budgets', icon: BarChart3, allowedGroups: ['PROJECT_MANAGER', 'FINANCE', 'GENERAL_MANAGER'] },
                { name: t('sidebar.reports'), href: '/reports', icon: PieChart, allowedGroups: ['PROJECT_MANAGER', 'FINANCE', 'GENERAL_MANAGER'] },
            ]
        },
        {
            title: 'RH & Paie',
            items: [
                { name: t('sidebar.hr'), href: '/hr/employees', icon: Briefcase, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
                { name: 'Pointage', href: '/hr/attendance', icon: Timer, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
                { name: 'Contrats', href: '/hr/contracts', icon: FileCheck, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
                { name: 'Payroll', href: '/hr/payroll', icon: FileSignature, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
                { name: 'Advances', href: '/hr/advances', icon: HandCoins, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
                { name: 'Congés', href: '/hr/leaves', icon: Calendar, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
                { name: t('sidebar.worksites'), href: '/hr/work-sites', icon: MapPin, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
                { name: t('sidebar.infocenter'), href: '/hr/info-center', icon: Megaphone, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
            ]
        },
        {
            title: 'Logistique',
            items: [
                { name: 'Inventaire', href: '/inventory', icon: Box, allowedGroups: ['PROJECT_MANAGER', 'FINANCE', 'GENERAL_MANAGER'] },
                { name: 'Projets', href: '/projects', icon: Construction, allowedGroups: ['PROJECT_MANAGER', 'FINANCE', 'GENERAL_MANAGER'] },
                { name: 'Flux Stocks', href: '/inventory/movements', icon: History, allowedGroups: ['PROJECT_MANAGER', 'FINANCE', 'GENERAL_MANAGER'] },
            ]
        },
        {
            title: 'Système',
            items: [
                { name: t('sidebar.documents'), href: '/documents', icon: FileCheck, allowedGroups: ['PROJECT_MANAGER', 'GENERAL_MANAGER'] },
                { name: t('sidebar.settings'), href: '/settings', icon: Settings },
            ]
        }
    ];

    const userGroups = user?.groups || [];
    const userRole = user?.role;

    const filteredGroups = linkGroups.map(group => {
        const filteredItems = group.items.filter(link => {
            if (!link.allowedGroups) return true;
            if (userRole === 'SUPER_ADMIN' || user?.email === 'sano.daouda96@gmail.com') return true;
            return link.allowedGroups.some(g =>
                userGroups.includes(g) ||
                userRole === g ||
                (userRole === 'ADMIN' && (g === 'PROJECT_MANAGER' || g === 'FINANCE'))
            );
        });
        return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0);

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={clsx(
                    "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar Container */}
            <div className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-xl md:shadow-none transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <img src="/icon.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-sm" />
                        <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            OurSpace
                        </span>
                    </div>
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-4">
                    {filteredGroups.map((group, idx) => (
                        <div key={idx} className="space-y-2">
                            <h3 className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                {group.title}
                            </h3>
                            <div className="grid grid-cols-2 gap-2 content-start">
                                {group.items.map((link) => {
                                    const Icon = link.icon;
                                    const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            ref={isActive ? activeRef : null}
                                            onClick={() => {
                                                onClose();
                                                if (link.isNew) markAsVisited(link.href);
                                            }}
                                            className={clsx(
                                                "flex flex-col items-center justify-center gap-2 px-2 py-4 rounded-xl font-medium transition-all duration-200 text-center text-[11px]",
                                                isActive
                                                    ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100"
                                                    : "text-slate-600 hover:bg-slate-50 border border-transparent"
                                            )}
                                        >
                                            <div className="relative">
                                                {link.customIcon ? (
                                                    <img
                                                        src={link.customIcon}
                                                        alt={link.name}
                                                        className={clsx(
                                                            "w-6 h-6 rounded-lg transition-all duration-300",
                                                            isActive ? "filter-none scale-110" : "grayscale opacity-50"
                                                        )}
                                                    />
                                                ) : (
                                                    <Icon size={24} className={isActive ? "text-indigo-600" : "text-slate-400"} />
                                                )}
                                                {link.href === '/approvals' && pendingApprovalsCount > 0 && (
                                                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm animate-pulse">
                                                        {pendingApprovalsCount}
                                                    </span>
                                                )}
                                                {link.isNew && !visitedFeatures.includes(link.href) && (
                                                    <span className="absolute -top-3 -right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm uppercase tracking-tighter">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                            <span className="leading-tight">{link.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer / User Profile */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-4">
                    {/* Preferences Controls */}
                    <div className="flex items-center gap-2">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2"
                        >
                            <option value="fr">🇫🇷 FR</option>
                            <option value="en">🇬🇧 EN</option>
                        </select>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as Currency)}
                            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2"
                        >
                            <option value="XOF">F CFA</option>
                            <option value="EUR">Euro (€)</option>
                            <option value="USD">USD ($)</option>
                            <option value="CNY">Yen (¥)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
                            {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-semibold text-slate-900 truncate">
                                {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : (user?.username || 'Utilisateur')}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{user?.company?.name || 'Kumba ID'}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        {t('sidebar.logout')}
                    </button>
                </div>
            </div>
        </>
    );
}
