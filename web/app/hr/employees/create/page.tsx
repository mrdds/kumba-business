'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../dashboard-layout';
import api from '../../../../services/api'; // Use the default exported axios instance
import { useNotification } from '@/context/NotificationContext';
import { ArrowLeft, Loader2, Check, ChevronDown, Shield, Briefcase, Lock, Camera, Mail, User as UserIcon, DollarSign, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { JOB_TITLES } from '@/constants/JobTitles';

const ROLES = [
    { label: 'Super Admin', value: 'SUPER_ADMIN', description: 'Total access to all modules.' },
    { label: 'Admin', value: 'ADMIN', description: 'Manage users and modules.' },
    { label: 'Manager', value: 'MANAGER', description: 'Team and department management.' },
    { label: 'Project Manager', value: 'PROJECT_MANAGER', description: 'Manage projects, budgets, and POs.' },
    { label: 'Advanced', value: 'ADVANCED_USER', description: 'Create and modify data.' },
    { label: 'Standard', value: 'STANDARD_USER', description: 'Basic input and read access.' },
];


export default function CreateEmployee() {
    const router = useRouter();
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef < HTMLInputElement > (null);

    // UI State
    const [showRolePicker, setShowRolePicker] = useState(false);
    const [showTitlePicker, setShowTitlePicker] = useState(false);
    const [photoPreview, setPhotoPreview] = useState < string | null > (null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'STANDARD_USER',
        job_title: '',
        base_salary: '0',
        department: 'General',
        permissions: {} as Record<string, boolean>
    });

    const [avatar, setAvatar] = useState < File | null > (null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatar(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.first_name || !formData.last_name || !formData.email || !formData.job_title) {
            showToast('Please fill all required fields.', 'error');
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('first_name', formData.first_name);
            data.append('last_name', formData.last_name);
            data.append('email', formData.email);
            data.append('phone', formData.phone);
            data.append('role', formData.role);
            data.append('job_title', formData.job_title);
            data.append('base_salary', formData.base_salary);
            data.append('permissions', JSON.stringify(formData.permissions));

            if (avatar) {
                data.append('avatar', avatar);
            }

            // Call backend endpoint handled in create_employee (users/api.py)
            await api.post('/auth/employees', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            showToast('Employee created successfully with full profile!', 'success');
            router.push('/hr/employees');
        } catch (error: any) {
            console.error("Submission Error:", error);
            const backendMessage = error.response?.data?.message;
            const axiosMessage = error.message;

            showToast(backendMessage || axiosMessage || 'Failed to onboard employee', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div>
                        <Link href="/hr/employees" className="inline-flex items-center text-blue-600 font-semibold mb-6 hover:translate-x-[-4px] transition-transform">
                            <ArrowLeft size={18} className="mr-2" />
                            Back to Team List
                        </Link>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Employee Onboarding</h1>
                        <p className="text-lg text-gray-500 max-w-xl">
                            Register a new team member with their digital identity, professional role, and system permissions.
                        </p>
                    </div>

                    <div className="flex items-center bg-blue-50 px-6 py-4 rounded-2xl border border-blue-100 animate-pulse-subtle">
                        <div className="mr-4">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Status</p>
                            <p className="text-sm font-bold text-blue-900 whitespace-nowrap">Drafting Onboarding</p>
                        </div>
                        <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                            <Briefcase size={20} color="#FFF" />
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Avatar & Bio */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Avatar Card */}
                        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col items-center">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 self-start">Profile Photo</h3>
                            <TouchableOpacity
                                onClick={() => fileInputRef.current?.click()}
                                className="relative group cursor-pointer"
                            >
                                <div className="h-40 w-40 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border-4 border-white shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <Camera size={48} className="text-blue-300 group-hover:text-blue-500 transition-colors" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity flex-col">
                                        <Camera size={24} color="#FFF" />
                                        <span className="text-white text-[10px] font-bold uppercase mt-2">Change</span>
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-blue-600 h-10 w-10 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg">
                                    <Plus size={20} color="#FFF" />
                                </div>
                            </TouchableOpacity>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePhotoChange}
                                className="hidden"
                                accept="image/*"
                            />
                            <p className="mt-8 text-xs text-center text-gray-400 leading-relaxed px-4">
                                Use a professional headshot for best results in the Klock mobile app. Max 5MB.
                            </p>
                        </div>


                    </div>

                    {/* Middle Column: Identity & Professional */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Identity & Professional Details */}
                        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <UserIcon size={20} />
                                </div>
                                Personal & Professional Details
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">First Name *</label>
                                    <div className="relative">
                                        <input
                                            required
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-gray-900"
                                            placeholder="Ex: Sanogo"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Last Name *</label>
                                    <input
                                        required
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="w-full px-5 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-gray-900"
                                        placeholder="Ex: Daouda"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Professional Email *</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            required
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-5 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-gray-900"
                                            placeholder="sanogo@company.com"
                                        />
                                    </div>
                                </div>

                                <div className="relative">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Job Title *</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowTitlePicker(!showTitlePicker)}
                                        className="w-full px-5 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 text-left flex justify-between items-center group font-bold"
                                    >
                                        <span className={formData.job_title ? 'text-gray-900' : 'text-gray-400'}>
                                            {formData.job_title || "Select Title..."}
                                        </span>
                                        <ChevronDown size={18} className="text-gray-300 group-hover:text-gray-500" />
                                    </button>

                                    {showTitlePicker && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto ring-1 ring-black/5 p-2">
                                            {JOB_TITLES.map((category) => (
                                                <div key={category.category} className="mb-2">
                                                    <div className="px-4 py-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                                        {category.category}
                                                    </div>
                                                    {category.titles.map((title) => (
                                                        <button
                                                            key={title}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({ ...formData, job_title: title });
                                                                setShowTitlePicker(false);
                                                            }}
                                                            className={`w-full px-4 py-2.5 text-left rounded-lg text-sm transition-colors flex justify-between items-center ${formData.job_title === title ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                                                        >
                                                            <span>{title}</span>
                                                            {formData.job_title === title && <Check size={14} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Base Salary (Annual)</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500">
                                            <DollarSign size={18} />
                                        </div>
                                        <input
                                            type="number"
                                            name="base_salary"
                                            value={formData.base_salary}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-5 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-gray-900"
                                            placeholder="45000"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System & Role Section */}
                        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                    <Shield size={20} />
                                </div>
                                System Role & Security
                            </h2>

                            <div className="space-y-6">
                                {/* Role Selector */}
                                <div className="relative">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Access Level</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowRolePicker(!showRolePicker)}
                                        className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 text-left flex justify-between items-center group shadow-sm transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                                                <Lock size={20} />
                                            </div>
                                            <div>
                                                <span className="font-black text-gray-900 block leading-tight">{ROLES.find(r => r.value === formData.role)?.label}</span>
                                                <span className="text-xs text-gray-500 font-medium">{ROLES.find(r => r.value === formData.role)?.description}</span>
                                            </div>
                                        </div>
                                        <ChevronDown size={20} className="text-gray-300 group-hover:text-gray-500" />
                                    </button>

                                    {showRolePicker && (
                                        <div className="absolute top-full left-0 right-0 mt-3 animate-slide-up bg-white border border-gray-100 rounded-[1.5rem] shadow-2xl z-50 p-2 overflow-hidden ring-1 ring-black/5">
                                            {ROLES.map(role => (
                                                <button
                                                    key={role.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, role: role.value });
                                                        setShowRolePicker(false);
                                                    }}
                                                    className={`w-full px-4 py-4 text-left rounded-xl transition-all flex justify-between items-center mb-1 last:mb-0 ${formData.role === role.value ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1' : 'text-gray-900 hover:bg-gray-50'}`}
                                                >
                                                    <div>
                                                        <span className="font-bold block leading-none mb-1">{role.label}</span>
                                                        <span className={`text-[10px] uppercase font-black tracking-tight ${formData.role === role.value ? 'text-blue-100' : 'text-gray-400'}`}>{role.description}</span>
                                                    </div>
                                                    {formData.role === role.value && <div className="h-6 w-6 bg-white/20 rounded-full flex items-center justify-center"><Check size={14} /></div>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-10 flex items-center justify-between gap-6 p-6 bg-blue-50/50 rounded-2xl border border-dashed border-blue-200">
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-blue-900 mb-1">Security Authentication</h4>
                                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                                        Kumba Business will auto-generate a secure 12-character password.
                                        Welcome instructions and credentials will be sent to the employee&apos;s professional email.
                                    </p>
                                </div>
                                <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                                    <Mail size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Submit Actions */}
                        <div className="flex items-center justify-end gap-4 pb-12">
                            <Link href="/hr/employees" className="px-8 py-4 rounded-2xl font-black text-gray-500 hover:bg-gray-100 transition-all uppercase tracking-widest text-xs">
                                Discard
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-5 rounded-[1.5rem] font-bold hover:shadow-2xl hover:shadow-blue-600/30 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-70 disabled:active:scale-100 group shadow-xl shadow-blue-600/10"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={24} className="animate-spin" />
                                        <span className="uppercase tracking-widest text-sm">Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={24} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                                        <span className="uppercase tracking-widest text-sm font-black">Finalize Onboarding</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .animate-pulse-subtle {
                    animation: pulse-subtle 3s infinite ease-in-out;
                }
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out forwards;
                }
            `}</style>
        </DashboardLayout>
    );
}

// Simple Touchable wrapper for standard elements to stay consistent with mobile thinking
function TouchableOpacity({ children, onClick, className }: { children: React.ReactNode, onClick: () => void, className?: string }) {
    return (
        <div onClick={onClick} className={`${className} select-none`}>
            {children}
        </div>
    );
}

// Add simple CSS for custom toggle if needed, or rely on standard checkbox logic. 
// For this React implementation, I used a styled structure that looks like a toggle, but might need actual CSS.
// Let's replace the complex toggle HTML with a simple checkbox for reliability if no external CSS.
// Actually, I'll switch to a simple styled checkbox for robustness.
