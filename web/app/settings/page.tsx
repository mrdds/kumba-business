'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../dashboard-layout';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { getUserProfile, updateCompany, updateProfile } from '../../services/api';
import { Building, User, Save, Loader2, Plus, Trash2, Smartphone, MessageCircle } from 'lucide-react';

export default function Settings() {
    const { t } = useTranslation();
    const { refreshUser } = useAuth();
    const { showToast } = useNotification();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // State for Profile & Company
    const [profile, setProfile] = useState<Record<string, any> | null>(null);
    
    const isAdmin = profile?.role === 'SUPER_ADMIN' || profile?.role === 'ADMIN';

    const [companyForm, setCompanyForm] = useState({
        name: '',
        sector: '',
        country: '',
        currency: 'USD',
        tax_rate: 0,
        address: '',
        tax_id: '',
        registration_number: '',
        phone: '',
        email: '',
        website: ''
    });
    const [profileForm, setProfileForm] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        bio: '',
        job_title: '',
        avatar_url: '',
        phone_numbers: [] as any[],
        language: 'fr',
        timezone: 'Africa/Abidjan'
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
    const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const user = await getUserProfile();
            setProfile(user);

            // Pre-fill company form
            if (user.company) {
                setCompanyForm({
                    name: user.company.name || '',
                    sector: user.company.sector || '',
                    country: user.company.country || 'CI',
                    currency: user.company.currency || 'XOF',
                    tax_rate: user.company.tax_rate || 0,
                    address: user.company.address || '',
                    tax_id: user.company.tax_id || '',
                    registration_number: user.company.registration_number || '',
                    phone: user.company.phone || '',
                    email: user.company.email || '',
                    website: user.company.website || ''
                });
                if (user.company.logo) {
                    setCompanyLogoPreview(user.company.logo);
                }
            }

            // Pre-fill profile form
            setProfileForm({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                phone: user.phone || '',
                bio: user.bio || '',
                job_title: user.job_title || '',
                avatar_url: user.avatar_url || '',
                phone_numbers: user.phone_numbers || [],
                language: user.language || 'fr',
                timezone: user.timezone || 'Africa/Abidjan'
            });
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const val = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
        setCompanyForm({ ...companyForm, [e.target.name]: val });
    };

    const handleSaveCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            Object.keys(companyForm).forEach(key => {
                const value = (companyForm as any)[key];
                if (value !== null && value !== undefined) {
                    formData.append(key, value.toString());
                }
            });

            if (companyLogoFile) {
                formData.append('logo', companyLogoFile);
            }

            await updateCompany(formData);
            await refreshUser();
            showToast(t('settings.toast.company_success'), 'success');
            setCompanyLogoFile(null);
        } catch (error) {
            console.error("Failed to update company", error);
            showToast(t('settings.toast.company_error'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    };

    const handleAddPhoneNumber = () => {
        setProfileForm({
            ...profileForm,
            phone_numbers: [...profileForm.phone_numbers, { number: '', is_whatsapp: false }]
        });
    };

    const handleUpdatePhoneNumber = (index: number, field: string, value: any) => {
        const newNumbers = [...profileForm.phone_numbers];
        newNumbers[index] = { ...newNumbers[index], [field]: value };
        setProfileForm({ ...profileForm, phone_numbers: newNumbers });
    };

    const handleRemovePhoneNumber = (index: number) => {
        setProfileForm({
            ...profileForm,
            phone_numbers: profileForm.phone_numbers.filter((_, i) => i !== index)
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleCompanyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCompanyLogoFile(file);
            setCompanyLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('first_name', profileForm.first_name);
            formData.append('last_name', profileForm.last_name);
            formData.append('phone', profileForm.phone);
            formData.append('bio', profileForm.bio);
            formData.append('job_title', profileForm.job_title);
            formData.append('phone_numbers', JSON.stringify(profileForm.phone_numbers));
            formData.append('language', profileForm.language);
            formData.append('timezone', profileForm.timezone);

            if (selectedFile) {
                formData.append('avatar', selectedFile);
            }

            await updateProfile(formData);
            await refreshUser();
            showToast(t('settings.toast.profile_success'), 'success');
            setSelectedFile(null);
        } catch (error) {
            console.error("Failed to update profile", error);
            showToast(t('settings.toast.profile_error'), 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-lg font-bold text-gray-900">{t('settings.title')}</h1>
                <p className="text-gray-500">{t('settings.subtitle')}</p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar / Tabs */}
                <div className="w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('company')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-black transition-colors ${activeTab === 'company'
                                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                                    }`}
                            >
                                <Building size={18} />
                                {t('settings.tabs.company')}
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-black transition-colors ${activeTab === 'profile'
                                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                                }`}
                        >
                            <User size={18} />
                            {t('settings.tabs.profile')}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {activeTab === 'company' && isAdmin && (
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-gray-900">{t('settings.company.title')}</h2>
                                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">
                                    ID: {profile?.company?.kumba_id || '...'}
                                </div>
                            </div>
                            <form onSubmit={handleSaveCompany} className="space-y-6">
                                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                                    <div className="h-24 w-24 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 font-bold text-xl overflow-hidden border-2 border-white shadow-sm relative group">
                                        {companyLogoPreview ? (
                                            <img src={companyLogoPreview} alt="Company Logo" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <Building size={32} />
                                        )}
                                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Plus size={24} className="text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleCompanyLogoChange} />
                                        </label>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.company.logo')}</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCompanyLogoChange}
                                            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-gray-50 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all"
                                        />
                                        <p className="mt-2 text-[10px] text-gray-400 font-medium">{t('settings.company.logo_desc')}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.company.name')}</label>
                                        <input
                                            name="name"
                                            value={companyForm.name}
                                            onChange={handleCompanyChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.company.sector')}</label>
                                        <input
                                            name="sector"
                                            value={companyForm.sector}
                                            onChange={handleCompanyChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.company.address')}</label>
                                    <textarea
                                        name="address"
                                        rows={2}
                                        value={companyForm.address}
                                        onChange={(e) => handleCompanyChange(e as any)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.company.tax_id')}</label>
                                        <input
                                            name="tax_id"
                                            value={companyForm.tax_id}
                                            onChange={handleCompanyChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.company.reg_no')}</label>
                                        <input
                                            name="registration_number"
                                            value={companyForm.registration_number}
                                            onChange={handleCompanyChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.company.phone')}</label>
                                        <input
                                            name="phone"
                                            value={companyForm.phone}
                                            onChange={handleCompanyChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.company.email')}</label>
                                        <input
                                            name="email"
                                            type="email"
                                            value={companyForm.email}
                                            onChange={handleCompanyChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.company.website')}</label>
                                        <input
                                            name="website"
                                            value={companyForm.website}
                                            onChange={handleCompanyChange}
                                            placeholder="https://..."
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.company.currency')}</label>
                                        <select
                                            name="currency"
                                            value={companyForm.currency}
                                            onChange={handleCompanyChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-bold"
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="XOF">XOF (CFA)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.company.tax_rate')}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="tax_rate"
                                            value={companyForm.tax_rate}
                                            onChange={handleCompanyChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-50 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70"
                                    >
                                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                        {saving ? t('settings.company.saving') : t('settings.company.save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-black text-gray-900 mb-6">{t('settings.profile.title')}</h2>
                            
                            {/* Identity Card Section */}
                            <div className="bg-gray-50/50 rounded-2xl p-6 mb-8 border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kumba ID</p>
                                    <p className="font-mono text-sm text-gray-700 bg-white px-3 py-1 rounded-lg border border-gray-100 inline-block">@{profile?.kumba_id || profile?.username}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Principal</p>
                                    <p className="text-sm font-bold text-gray-700">{profile?.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rôle Système</p>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                                            {profile?.role}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type de Compte</p>
                                    <p className="text-sm font-bold text-gray-700 capitalize">{profile?.type}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Niveau de Vérification (KYC)</p>
                                    <div className="flex items-center gap-1.5">
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3].map((lvl) => (
                                                <div 
                                                    key={lvl} 
                                                    className={`h-1.5 w-4 rounded-full ${profile?.kyc_level >= lvl ? 'bg-green-500' : 'bg-gray-200'}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500">Niveau {profile?.kyc_level}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Matricule Interne</p>
                                    <p className="text-sm font-bold text-gray-700">{profile?.employee_id || '---'}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                                    <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl overflow-hidden border-2 border-white shadow-sm relative group">
                                        {previewUrl || profileForm.avatar_url ? (
                                            <img src={previewUrl || profileForm.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            profile?.first_name?.[0] || profile?.username?.[0]
                                        )}
                                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Plus size={24} className="text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.profile.photo')}</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-gray-50 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all"
                                        />
                                        <p className="mt-2 text-[10px] text-gray-400 font-medium">{t('settings.profile.photo_desc')}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.profile.first_name')}</label>
                                        <input
                                            name="first_name"
                                            value={profileForm.first_name}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.profile.last_name')}</label>
                                        <input
                                            name="last_name"
                                            value={profileForm.last_name}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.profile.job_title')}</label>
                                    <input
                                        name="job_title"
                                        value={profileForm.job_title}
                                        onChange={handleProfileChange}
                                        placeholder="CEO, Developer, etc."
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.profile.bio')}</label>
                                    <textarea
                                        name="bio"
                                        rows={3}
                                        value={profileForm.bio}
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.profile.language')}</label>
                                        <select
                                            name="language"
                                            value={profileForm.language}
                                            onChange={(e) => handleProfileChange(e as any)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-bold"
                                        >
                                            <option value="fr">Français (FR)</option>
                                            <option value="en">English (EN)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{t('settings.profile.timezone')}</label>
                                        <select
                                            name="timezone"
                                            value={profileForm.timezone}
                                            onChange={(e) => handleProfileChange(e as any)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-bold"
                                        >
                                            <option value="Africa/Abidjan">Africa/Abidjan (GMT+0)</option>
                                            <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                                            <option value="UTC">UTC (Universal Time)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="border-t border-gray-50 pt-6 mt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                                            <Smartphone size={16} className="text-gray-400" />
                                            {t('settings.profile.phone_numbers')}
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={handleAddPhoneNumber}
                                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-black uppercase tracking-wider"
                                        >
                                            <Plus size={14} /> {t('settings.profile.add_number')}
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">{t('settings.profile.primary_phone')}</label>
                                            <input
                                                name="phone"
                                                value={profileForm.phone}
                                                onChange={handleProfileChange}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                                            />
                                        </div>

                                        {profileForm.phone_numbers.map((num, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 group transition-all hover:border-blue-200">
                                                <input
                                                    value={num.number}
                                                    onChange={(e) => handleUpdatePhoneNumber(idx, 'number', e.target.value)}
                                                    placeholder="+225 ..."
                                                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-bold"
                                                />
                                                <label className="flex items-center gap-2 text-[10px] font-black text-gray-600 cursor-pointer select-none uppercase tracking-wider">
                                                    <input
                                                        type="checkbox"
                                                        checked={num.is_whatsapp}
                                                        onChange={(e) => handleUpdatePhoneNumber(idx, 'is_whatsapp', e.target.checked)}
                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    {num.is_whatsapp && <MessageCircle size={14} className="text-green-600 animate-pulse" />}
                                                    {t('settings.profile.whatsapp')}
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePhoneNumber(idx)}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">
                                        ID: <span className="font-mono text-gray-600">{profile?.kumba_id || '...'}</span>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70"
                                    >
                                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                        {saving ? t('settings.profile.saving') : t('settings.profile.save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
