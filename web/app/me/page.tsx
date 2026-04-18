'use client';

import { useState, useEffect } from 'react';
import { getMyEmployeeProfile } from '../../services/api';
import EmployeeProfileView from '../../components/hr/EmployeeProfileView';
import DashboardLayout from '../dashboard-layout'; // Correct path

export default function MePage() {
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyProfile();
    }, []);

    const fetchMyProfile = async () => {
        try {
            const data = await getMyEmployeeProfile();
            setEmployee(data);
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <EmployeeProfileView
                employee={employee}
                loading={loading}
                refreshEmployee={fetchMyProfile}
                showBackButton={false}
            />
        </DashboardLayout>
    );
}
