'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { getEmployee } from '../../../../services/api';
import EmployeeProfileView from '../../../../components/hr/EmployeeProfileView';
import DashboardLayout from '../../../dashboard-layout';

export default function EmployeeDetail({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = parseInt(resolvedParams.id);

    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchEmployee = useCallback(async () => {
        try {
            const data = await getEmployee(id);
            setEmployee(data);
        } catch (err) {
            console.error('Error fetching employee:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchEmployee();
    }, [fetchEmployee]);

    return (
        <DashboardLayout>
            <EmployeeProfileView
                employee={employee}
                loading={loading}
                refreshEmployee={fetchEmployee}
                showBackButton={true}
            />
        </DashboardLayout>
    );
}

