'use client';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Loader2, Menu, Search } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { useGlobalHotkeys } from '@/hooks/useHotkeys';
import { Toaster } from 'react-hot-toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const openPalette = useCallback(() => setPaletteOpen(true), []);
    const closePalette = useCallback(() => setPaletteOpen(false), []);

    // Global keyboard shortcuts
    useGlobalHotkeys({ onOpenPalette: openPalette });

    useEffect(() => {
        const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
        if (!isLoading && user && !user.company_id && isAdmin && pathname !== '/onboarding') {
            router.push('/onboarding');
        }
    }, [user, isLoading, router, pathname]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Toaster for notifications */}
            <Toaster position="top-right" />

            {/* Command Palette — mounted globally */}
            <CommandPalette open={paletteOpen} onClose={closePalette} />

            {/* Sidebar */}
            <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

            {/* Main Content */}
            <div className="md:ml-64 min-h-screen flex flex-col transition-all duration-300">

                {/* Mobile Header */}
                <header className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                            OurSpace
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* ⌘K trigger on mobile */}
                        <button
                            onClick={openPalette}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            aria-label="Recherche globale"
                        >
                            <Search size={20} />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                        </div>
                    </div>
                </header>

                {/* Desktop ⌘K hint bar */}
                <div className="hidden md:flex items-center px-8 pt-5 pb-0">
                    <button
                        onClick={openPalette}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 text-xs hover:border-blue-300 hover:text-gray-600 transition-all shadow-sm group"
                    >
                        <Search size={12} />
                        <span>Rechercher ou naviguer...</span>
                        <kbd className="ml-2 text-[10px] bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600">
                            ⌘K
                        </kbd>
                    </button>
                </div>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
