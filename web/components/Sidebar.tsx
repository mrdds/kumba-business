'use client';
import { LogOut, X, LayoutDashboard, FileText, ShoppingCart, Users, Receipt, CreditCard, Settings, BarChart3, Briefcase, FileCheck, FileSignature, MessageSquare, MapPin, Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const links = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Approvals', href: '/approvals', icon: FileCheck, allowedGroups: ['PROJECT_MANAGER', 'OPERATOR_MANAGER', 'GENERAL_MANAGER', 'FINANCE'] },
        { name: 'Invoices', href: '/invoices', icon: FileText, allowedGroups: ['PROJECT_MANAGER', 'FINANCE', 'GENERAL_MANAGER'] },
        { name: 'Purchases', href: '/purchases', icon: ShoppingCart, allowedGroups: ['PROJECT_MANAGER', 'FINANCE', 'GENERAL_MANAGER'] },
        { name: 'Bills', href: '/bills', icon: Receipt, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
        { name: 'Quotes', href: '/quotes', icon: FileSignature, allowedGroups: ['PROJECT_MANAGER', 'GENERAL_MANAGER'] },
        { name: 'Customers', href: '/crm/customers', icon: Users, allowedGroups: ['PROJECT_MANAGER', 'OPERATOR_MANAGER', 'FINANCE', 'GENERAL_MANAGER'] },
        { name: 'HR & Payroll', href: '/hr/employees', icon: Briefcase, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
        { name: 'Work Sites', href: '/hr/work-sites', icon: MapPin, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
        { name: 'Info Center', href: '/hr/info-center', icon: Megaphone, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
        { name: 'Transactions', href: '/transactions', icon: CreditCard, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },

        { name: 'Reports', href: '/reports', icon: BarChart3, allowedGroups: ['PROJECT_MANAGER', 'FINANCE', 'GENERAL_MANAGER'] },
        { name: 'Debts', href: '/debts', icon: CreditCard, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
        { name: 'Settings', href: '/settings', icon: Settings, allowedGroups: ['FINANCE', 'GENERAL_MANAGER'] },
    ];

    const filteredLinks = links.filter(link => {
        if (!link.allowedGroups) return true;
        if (user?.role === 'SUPER_ADMIN') return true;
        return link.allowedGroups.some(g => user?.groups?.includes(g));
    });

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

                    <span className="text-2xl font-extrabold">
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Kumba</span>
                        <span className="text-slate-900 ml-1">Business</span>
                    </span>
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {filteredLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname.startsWith(link.href);
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={onClose} // Close on mobile click
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <Icon size={20} className={isActive ? "text-indigo-600" : "text-slate-400"} />
                                {link.name}
                            </Link>
                        );
                    })}

                    {/* Kumba Connect Link (External App) */}
                    <a
                        href={`http://localhost:3002/?token=${typeof window !== 'undefined' ? localStorage.getItem('access_token') : ''}&refresh=${typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 mt-4 border-t border-slate-100 pt-4"
                    >
                        <MessageSquare size={20} className="text-blue-500" />
                        <span>Ourspace </span>
                        <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded ml-auto">NEW</span>
                    </a>

                </nav>

                {/* Footer / User Profile */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
                            {user?.first_name?.[0]}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-semibold text-slate-900 truncate">{user?.first_name}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.company_name}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
}
