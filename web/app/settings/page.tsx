'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '../dashboard-layout';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { getUserProfile, updateCompany, updateProfile } from '../../services/api';
import { Building, User, Save, Loader2, Plus, Trash2, Smartphone, MessageCircle } from 'lucide-react';

export default function Settings() {
    const { refreshUser } = useAuth();
    const { showToast } = useNotification();
    const [activeTab, setActiveTab] = useState('company');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // State for Profile & Company
    const [profile, setProfile] = useState < Record < string, any> | null > (null);
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
        phone_numbers: [] as any[]
    });
    const [selectedFile, setSelectedFile] = useState < File | null > (null);
    const [previewUrl, setPreviewUrl] = useState < string | null > (null);
    const [companyLogoFile, setCompanyLogoFile] = useState < File | null > (null);
    const [companyLogoPreview, setCompanyLogoPreview] = useState < string | null > (null);

    useEffect(() => {
        const fetchData = async () => {
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
                    phone_numbers: user.phone_numbers || []
                });
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
            showToast('Company settings updated successfully!', 'success');
            setCompanyLogoFile(null);
        } catch (error) {
            console.error("Failed to update company", error);
            showToast('Failed to update company settings', 'error');
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

            if (selectedFile) {
                formData.append('avatar', selectedFile);
            }

            await updateProfile(formData);
            await refreshUser();
            showToast('Profile updated successfully!', 'success');
            setSelectedFile(null);
        } catch (error) {
            console.error("Failed to update profile", error);
            showToast('Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500">Manage your company and profile preferences.</p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar / Tabs */}
                <div className="w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => setActiveTab('company')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'company'
                                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                                }`}
                        >
                            <Building size={18} />
                            Company Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'profile'
                                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                                }`}
                        >
                            <User size={18} />
                            User Profile
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {activeTab === 'company' && (
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Company Information</h2>
                                <div className="text-xs text-gray-400 font-mono">
                                    ID: {profile?.company?.kumba_id || '...'}
                                </div>
                            </div>
                            <form onSubmit={handleSaveCompany} className="space-y-6">
                                <div className="flex items-center gap-6 mb-8 pb-8 border-b">
                                    <div className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 font-bold text-3xl overflow-hidden border-2 border-white shadow-sm relative group">
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCompanyLogoChange}
                                            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        <p className="mt-2 text-xs text-gray-400">Upload your company logo (JPG, PNG).</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                                        <input
                                            name="name"
                                            value={companyForm.name}
                                            onChange={handleCompanyChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                                        <input
                                            name="sector"
                                            value={companyForm.sector}
                                            onChange={handleCompanyChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                    <textarea
                                        name="address"
                                        rows={2}
                                        value={companyForm.address}
                                        onChange={(e) => handleCompanyChange(e as any)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Compte Contribuable (Tax ID)</label>
                                        <input
                                            name="tax_id"
                                            value={companyForm.tax_id}
                                            onChange={handleCompanyChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">N° Registre de Commerce (RCCM)</label>
                                        <input
                                            name="registration_number"
                                            value={companyForm.registration_number}
                                            onChange={handleCompanyChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                        <input
                                            name="phone"
                                            value={companyForm.phone}
                                            onChange={handleCompanyChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <input
                                            name="email"
                                            type="email"
                                            value={companyForm.email}
                                            onChange={handleCompanyChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                                        <input
                                            name="website"
                                            value={companyForm.website}
                                            onChange={handleCompanyChange}
                                            placeholder="https://..."
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                                        <select
                                            name="currency"
                                            value={companyForm.currency}
                                            onChange={handleCompanyChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="XOF">XOF (CFA)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="tax_rate"
                                            value={companyForm.tax_rate}
                                            onChange={handleCompanyChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        {saving && <Loader2 size={18} className="animate-spin" />}
                                        {saving ? 'Saving...' : 'Save Changes'}
                                        {!saving && <Save size={18} />}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">User Profile</h2>
                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div className="flex items-center gap-6 mb-8 pb-8 border-b">
                                    <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl overflow-hidden border-2 border-white shadow-sm relative group">
                                        {previewUrl || profileForm.avatar_url ? (
                                            <img src={previewUrl || profileForm.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            profile?.first_name?.[0] || profile?.username?.[0]
                                        )}
                                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Smartphone size={24} className="text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        <p className="mt-2 text-xs text-gray-400">Upload a new profile picture (JPG, PNG).</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                        <input
                                            name="first_name"
                                            value={profileForm.first_name}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                        <input
                                            name="last_name"
                                            value={profileForm.last_name}
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title (Poste)</label>
                                    <input
                                        name="job_title"
                                        value={profileForm.job_title}
                                        onChange={handleProfileChange}
                                        placeholder="Directeur Général, Développeur, etc."
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                                    <textarea
                                        name="bio"
                                        rows={3}
                                        value={profileForm.bio}
                                        onChange={handleProfileChange}
                                        placeholder="Tell us about yourself..."
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="border-t pt-6 mt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <Smartphone size={16} className="text-gray-400" />
                                            Phone Numbers
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={handleAddPhoneNumber}
                                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
                                        >
                                            <Plus size={14} /> Add Number
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Primary Number</label>
                                            <input
                                                name="phone"
                                                value={profileForm.phone}
                                                onChange={handleProfileChange}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {profileForm.phone_numbers.map((num, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100 group">
                                                <input
                                                    value={num.number}
                                                    onChange={(e) => handleUpdatePhoneNumber(idx, 'number', e.target.value)}
                                                    placeholder="+225 ..."
                                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                />
                                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={num.is_whatsapp}
                                                        onChange={(e) => handleUpdatePhoneNumber(idx, 'is_whatsapp', e.target.checked)}
                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    {num.is_whatsapp && <MessageCircle size={14} className="text-green-600" />}
                                                    WhatsApp
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePhoneNumber(idx)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t flex items-center justify-between">
                                    <div className="text-xs text-gray-400">
                                        Account (Kumba ID): <span className="font-mono text-gray-600">{profile?.kumba_id || 'En cours...'}</span>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-70"
                                    >
                                        {saving && <Loader2 size={18} className="animate-spin" />}
                                        {saving ? 'Saving...' : 'Update Profile'}
                                        {!saving && <Save size={18} />}
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
