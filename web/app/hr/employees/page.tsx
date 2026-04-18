'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../dashboard-layout';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { getEmployees } from '../../../services/api';
import { Users, Plus, Phone, Mail, DollarSign } from 'lucide-react';

export default function EmployeeList() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState < any[] > ([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await getEmployees();
                setEmployees(data);
            } catch (error) {
                console.error("Failed to fetch employees", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
                    <p className="text-gray-500">Manage your team and payroll</p>
                </div>
                <Link href="/hr/employees/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                    <Plus size={20} />
                    Add Employee
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : employees.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No employees found</h3>
                    <p className="text-gray-500 mb-4">Start by adding your first employee.</p>
                    <Link href="/hr/employees/create" className="text-blue-600 font-bold hover:underline">
                        Add Employee
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map((emp) => (
                        <div key={emp.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-blue-50 flex items-center justify-center shrink-0">
                                        {emp.photo_url ? (
                                            <img src={emp.photo_url} alt={`${emp.first_name} ${emp.last_name}`} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-blue-600 font-black text-xl">
                                                {emp.first_name[0]}{emp.last_name[0]}
                                            </span>
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-gray-900 truncate leading-tight">{emp.first_name} {emp.last_name}</h3>
                                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mt-0.5">{emp.position}</p>
                                    </div>
                                </div>
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                    Active
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-gray-400" />
                                    {emp.email || 'N/A'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-400" />
                                    {emp.phone || 'N/A'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <DollarSign size={14} className="text-gray-400" />
                                    {formatCurrency(emp.base_salary, user?.company?.currency)} / year
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Link href={`/hr/employees/${emp.id}`} className="text-blue-600 font-medium text-sm hover:underline">
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
