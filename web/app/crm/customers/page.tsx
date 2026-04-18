'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '../../dashboard-layout';
import { getCustomers } from '../../../services/api';
import { Plus, Search, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const data = await getCustomers();
                setCustomers(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                <Link href="/crm/customers/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                    <Plus size={20} />
                    Add Customer
                </Link>
            </div>

            {/* Search Bar (Visual only for now) */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search customers..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customers.map((customer) => (
                    <Link href={`/crm/customers/${customer.id}`} key={customer.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                {customer.name[0]}
                            </div>
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{customer.tax_id || 'N/A'}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2">{customer.name}</h3>

                        <div className="space-y-2 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <Mail size={16} />
                                <span>{customer.email || 'No email'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={16} />
                                <span>{customer.phone || 'No phone'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={16} />
                                <span className="truncate">{customer.address || 'No address'}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 text-center text-blue-600 font-medium text-sm">
                            View Details
                        </div>
                    </Link>
                ))}
            </div>

            {customers.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No customers yet</h3>
                    <p className="text-gray-500 mb-4">Add your first customer to get started.</p>
                    <Link href="/crm/customers/create" className="text-blue-600 font-medium hover:underline">
                        Add Customer
                    </Link>
                </div>
            )}
        </DashboardLayout>
    );
}
