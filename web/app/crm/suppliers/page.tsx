'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '../../dashboard-layout';
import { getSuppliers } from '../../../services/api';
import { Plus, Search, Mail, Phone, MapPin, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function SuppliersPage() {
    const { t } = useTranslation();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const data = await getSuppliers();
                setSuppliers(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchSuppliers();
    }, []);

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-lg font-bold text-gray-900">{t('crm.suppliers.title')}</h1>
                <Link href="/crm/suppliers/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                    <Plus size={20} />
                    {t('crm.suppliers.add_btn')}
                </Link>
            </div>

            {/* Search Bar (Visual only for now) */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder={t('crm.suppliers.search_placeholder')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.map((supplier) => (
                    <Link href={`/crm/suppliers/${supplier.id}`} key={supplier.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl">
                                {supplier.name[0]}
                            </div>
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{supplier.tax_id || 'N/A'}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2">{supplier.name}</h3>

                        <div className="space-y-2 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <Mail size={16} />
                                <span>{supplier.email || t('crm.suppliers.no_email')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={16} />
                                <span>{supplier.phone || t('crm.suppliers.no_phone')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={16} />
                                <span className="truncate">{supplier.address || t('crm.suppliers.no_address')}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 text-center text-purple-600 font-medium text-sm">
                            {t('crm.suppliers.view_dashboard')}
                        </div>
                    </Link>
                ))}
            </div>

            {suppliers.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{t('crm.suppliers.empty_title')}</h3>
                    <p className="text-gray-500 mb-4">{t('crm.suppliers.empty_desc')}</p>
                    <Link href="/crm/suppliers/create" className="text-blue-600 font-medium hover:underline">
                        {t('crm.suppliers.add_first')}
                    </Link>
                </div>
            )}
        </DashboardLayout>
    );
}
