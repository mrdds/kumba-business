'use client';

import { useState, useEffect } from 'react';
import { getMyEmployeeProfile } from '../../services/api';
import EmployeeProfileView from '../../components/hr/EmployeeProfileView';
import DashboardLayout from '../dashboard-layout'; // Correct path

export default function MePage() {
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMyProfile();
    }, []);

    const fetchMyProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getMyEmployeeProfile();
            setEmployee(data);
        } catch (err: any) {
            console.error('Error fetching profile:', err);
            const message = err.response?.data?.detail || err.message || 'Erreur lors du chargement du profil';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            {error && !loading ? (
                <div className="max-w-2xl mx-auto mt-20 p-8 bg-white rounded-3xl border border-red-100 shadow-sm text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Erreur de Profil</h3>
                    <p className="text-gray-500 font-medium mb-6">{error}</p>
                    <button 
                        onClick={fetchMyProfile}
                        className="px-6 py-2 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all"
                    >
                        Réessayer
                    </button>
                </div>
            ) : (
                <EmployeeProfileView
                    employee={employee}
                    loading={loading}
                    refreshEmployee={fetchMyProfile}
                    showBackButton={false}
                />
            )}
        </DashboardLayout>
    );
}
