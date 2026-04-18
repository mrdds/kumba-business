import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Loader2, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // [Onboarding] Redirect if user has no company
        if (!isLoading && user && !user.company_id && pathname !== '/onboarding') {
            router.push('/onboarding');
        }
    }, [user, isLoading, router, pathname]);

    if (isLoading) {
        return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;
    }

    if (!user) {
        return null; // Will redirect in AuthContext
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sidebar with Mobile State */}
            <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

            {/* Main Content Area */}
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
                            Kumba
                        </h1>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {user?.first_name?.[0]}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
