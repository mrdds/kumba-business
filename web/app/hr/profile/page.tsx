'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMyEmployeeProfile } from '../../../services/api';
import { Loader2 } from 'lucide-react';

export default function MyProfileRedirect() {
    const router = useRouter();

    useEffect(() => {
        const fetchAndRedirect = async () => {
            try {
                const profile = await getMyEmployeeProfile();
                if (profile && profile.id) {
                    router.replace(`/hr/employees/${profile.id}`);
                } else {
                    router.push('/dashboard');
                }
            } catch (error) {
                // Silently redirect to dashboard if profile not found
                console.warn('Profile not found, redirecting to dashboard');
                router.push('/dashboard');
            }
        };
        fetchAndRedirect();
    }, [router]);

    return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Redirecting to your profile...</p>
            </div>
        </div>
    );
}
