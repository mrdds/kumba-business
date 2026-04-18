import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { updateEmployee, updateEmployeeHR, changePassword, uploadEmployeePhoto, updateEmployeeStatus, getWorkSites } from '../../services/api';
import { ArrowLeft, Mail, Phone, Calendar, Briefcase, MapPin, DollarSign, User, Shield, Clock, CheckSquare, Camera, Lock, Save, Bell, Map } from 'lucide-react';

interface EmployeeProfileViewProps {
    employee: any;
    loading: boolean;
    refreshEmployee: () => void;
    showBackButton?: boolean;
}

export default function EmployeeProfileView({ employee, loading, refreshEmployee, showBackButton = true }: EmployeeProfileViewProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    const isMe = user?.email === employee?.email;
    const canManageRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role);
    // Only allow editing info if IT IS ME or I have proper rights
    const canEditInfo = isMe || canManageRoles;

    // Role Management
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedGroups, setSelectedGroups] = useState < string[] > ([]);
    const [savingRoles, setSavingRoles] = useState(false);

    // Settings States
    const [passwordData, setPasswordData] = useState({ old: '', new: '', confirm: '' });
    const [savingPassword, setSavingPassword] = useState(false);
    const [personalData, setPersonalData] = useState({ first_name: '', last_name: '', phone: '', address: '', work_site_id: '' as string | number });
    const [savingPersonal, setSavingPersonal] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef < HTMLInputElement > (null);
    const [workSites, setWorkSites] = useState < any[] > ([]);

    useEffect(() => {
        const fetchSites = async () => {
            try {
                const sites = await getWorkSites();
                setWorkSites(sites);
            } catch (e) {
                console.error("Failed to fetch work sites");
            }
        };
        fetchSites();
    }, []);

    useEffect(() => {
        if (employee) {
            setSelectedGroups(employee.groups || []);
            setPersonalData({
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                phone: employee.phone || '',
                address: employee.address || '',
                work_site_id: employee.work_site_id || ''
            });
        }
    }, [employee]);

    const handleSaveRoles = async () => {
        if (!employee) return;
        setSavingRoles(true);
        try {
            await updateEmployee(employee.id, { groups: selectedGroups });
            setShowRoleModal(false);
            refreshEmployee();
        } catch (e) {
            console.error(e);
            alert('Failed to update roles');
        } finally {
            setSavingRoles(false);
        }
    };

    const toggleGroup = (group: string) => {
        if (selectedGroups.includes(group)) {
            setSelectedGroups(selectedGroups.filter(g => g !== group));
        } else {
            setSelectedGroups([...selectedGroups, group]);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            alert("New passwords do not match");
            return;
        }
        setSavingPassword(true);
        try {
            await changePassword({
                old_password: passwordData.old,
                new_password: passwordData.new
            });
            alert("Password updated successfully");
            setPasswordData({ old: '', new: '', confirm: '' });
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || "Failed to update password");
        } finally {
            setSavingPassword(false);
        }
    };

    const handleSavePersonal = async () => {
        setSavingPersonal(true);
        try {
            const payload = {
                ...personalData,
                work_site_id: personalData.work_site_id ? Number(personalData.work_site_id) : null
            };
            await updateEmployeeHR(employee.id, payload);
            refreshEmployee();
            alert("Personal details updated");
        } catch (error) {
            console.error(error);
            alert("Failed to update personal details");
        } finally {
            setSavingPersonal(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadingPhoto(true);
            try {
                await uploadEmployeePhoto(employee.id, e.target.files[0]);
                refreshEmployee();
            } catch (error) {
                console.error(error);
                alert("Failed to upload photo");
            } finally {
                setUploadingPhoto(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="p-8 text-center max-w-2xl mx-auto mt-10 bg-white rounded-2xl shadow-sm border border-gray-100">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Employee Not Found</h3>
                <p className="text-gray-500 mb-6">We couldn&apos;t locate the employee details you requested.</p>
                {showBackButton && (
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                        Go Back
                    </button>
                )}
            </div>
        );
    }

    const initials = `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    {showBackButton && (
                        <button
                            onClick={() => router.back()}
                            className="flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Employees
                        </button>
                    )}
                    <h1 className="text-3xl font-bold text-gray-900">
                        {showBackButton ? 'Employee Profile' : 'My Profile'}
                    </h1>
                </div>
                <div className="flex gap-3">
                    {canEditInfo && (
                        <button
                            onClick={() => setActiveTab('settings')}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium shadow-sm"
                        >
                            Edit Profile
                        </button>
                    )}
                    {canManageRoles && (
                        <button
                            onClick={() => setShowRoleModal(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium shadow-md shadow-indigo-100 flex items-center gap-2"
                        >
                            <Shield className="w-4 h-4" />
                            Manage Roles
                        </button>
                    )}
                </div>
            </div>

            {/* Main Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                    {/* Cover Photo or Standard Gradient */}
                </div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="flex items-end group">
                            <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg relative">
                                {employee.photo_url ? (
                                    <img src={employee.photo_url} alt="Profile" className="w-full h-full rounded-xl object-cover" />
                                ) : (
                                    <div className="w-full h-full rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold tracking-wider">
                                        {initials}
                                    </div>
                                )}
                                {/* Mobile/Quick Camera Icon */}
                                {activeTab === 'settings' && isMe && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-[-10px] right-[-10px] bg-white p-1.5 rounded-full shadow-md text-gray-600 hover:text-indigo-600 border border-gray-100"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                />
                            </div>
                            <div className="ml-6 pb-1">
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                    {employee.first_name} {employee.last_name}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 font-medium">{employee.position}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                    {employee.groups?.map((g: string) => (
                                        <span key={g} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                            {g.replace('_', ' ')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-100 mb-8">
                        <nav className="flex space-x-8">
                            {['overview', 'payroll', 'documents', 'settings'].filter(tab => tab !== 'settings' || canEditInfo).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                        pb-4 px-1 text-sm font-medium capitalize border-b-2 transition-colors
                                        ${activeTab === tab
                                            ? 'border-indigo-600 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                    `}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content Section */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-100 pb-2">
                                    <User className="w-5 h-5 text-indigo-600" />
                                    <h3>Personal Details</h3>
                                </div>
                                <dl className="space-y-4">
                                    <div className="flex justify-between py-1 border-b border-gray-50 md:border-none">
                                        <dt className="text-sm text-gray-500 w-32 flex items-center gap-2">
                                            <Mail className="w-4 h-4" /> Email
                                        </dt>
                                        <dd className="text-sm font-medium text-gray-900 text-right md:text-left">{employee.email || 'N/A'}</dd>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-50 md:border-none">
                                        <dt className="text-sm text-gray-500 w-32 flex items-center gap-2">
                                            <Phone className="w-4 h-4" /> Phone
                                        </dt>
                                        <dd className="text-sm font-medium text-gray-900 text-right md:text-left">{employee.phone || 'N/A'}</dd>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-50 md:border-none">
                                        <dt className="text-sm text-gray-500 w-32 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" /> Address
                                        </dt>
                                        <dd className="text-sm font-medium text-gray-900 text-right md:text-left whitespace-pre-wrap max-w-xs">{employee.address || 'N/A'}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-100 pb-2">
                                    <Briefcase className="w-5 h-5 text-indigo-600" />
                                    <h3>Employment</h3>
                                </div>
                                <dl className="space-y-4">
                                    <div className="flex justify-between py-1 border-b border-gray-50 md:border-none">
                                        <dt className="text-sm text-gray-500 w-32 flex items-center gap-2">
                                            <Shield className="w-4 h-4" /> Department
                                        </dt>
                                        <dd className="text-sm font-medium text-gray-900 text-right md:text-left">{employee.department || 'N/A'}</dd>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-50 md:border-none">
                                        <dt className="text-sm text-gray-500 w-32 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" /> Hire Date
                                        </dt>
                                        <dd className="text-sm font-medium text-gray-900 text-right md:text-left">{employee.hire_date || 'N/A'}</dd>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-50 md:border-none">
                                        <dt className="text-sm text-gray-500 w-32 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" /> Salary
                                        </dt>
                                        <dd className="text-sm font-bold text-gray-900 text-right md:text-left bg-green-50 px-2 py-0.5 rounded text-green-700 inline-block">
                                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(employee.base_salary)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Navigation / Simple Sections */}
                            <div className="space-y-8 lg:col-span-2">

                                {/* Personal Information */}
                                <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
                                        <User className="w-5 h-5 text-indigo-600" />
                                        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                            <input
                                                type="text"
                                                value={personalData.first_name}
                                                onChange={(e) => setPersonalData({ ...personalData, first_name: e.target.value })}
                                                disabled={!canManageRoles}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                value={personalData.last_name}
                                                onChange={(e) => setPersonalData({ ...personalData, last_name: e.target.value })}
                                                disabled={!canManageRoles}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                value={personalData.phone}
                                                onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                                placeholder="+225 ..."
                                            />
                                        </div>
                                        {canManageRoles && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Work Site</label>
                                                <select
                                                    value={personalData.work_site_id}
                                                    onChange={(e) => setPersonalData({ ...personalData, work_site_id: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
                                                >
                                                    <option value="">-- No Work Site --</option>
                                                    {workSites.map(site => (
                                                        <option key={site.id} value={site.id}>{site.name} ({site.radius}m)</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                            <textarea
                                                value={personalData.address}
                                                onChange={(e) => setPersonalData({ ...personalData, address: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                                placeholder="Resident Address..."
                                                rows={1}
                                            />
                                        </div>
                                        <div className="md:col-span-2 flex justify-end">
                                            <button
                                                onClick={handleSavePersonal}
                                                disabled={savingPersonal}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {savingPersonal ? 'Saving...' : 'Save Details'}
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                {/* Preferences */}
                                {/* Preferences - Only Me */}
                                {isMe && (
                                    <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
                                            <Bell className="w-5 h-5 text-indigo-600" />
                                            <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <span className="text-gray-700 font-medium">Email Notifications</span>
                                                <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" defaultChecked />
                                            </label>
                                            <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <span className="text-gray-700 font-medium">Dark Mode (Beta)</span>
                                                <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                                            </label>
                                        </div>
                                    </section>
                                )}

                            </div>

                            {/* Right Column: Security */}
                            <div className="space-y-8">
                                {isMe && (
                                    <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
                                            <Lock className="w-5 h-5 text-orange-600" />
                                            <h3 className="text-lg font-semibold text-gray-900">Security</h3>
                                        </div>
                                        <form onSubmit={handleChangePassword} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.old}
                                                    onChange={(e) => setPasswordData({ ...passwordData, old: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.new}
                                                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.confirm}
                                                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                    required
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={savingPassword}
                                                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium shadow-sm disabled:opacity-50"
                                            >
                                                {savingPassword ? 'Updating...' : 'Update Password'}
                                            </button>
                                        </form>
                                    </section>
                                )}

                                {isMe && (
                                    <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                                            <Camera className="w-5 h-5 text-indigo-600" />
                                            <h3 className="text-lg font-semibold text-gray-900">Profile Photo</h3>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-4">Click below to upload a new profile picture. Recommended size: 500x500px.</p>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingPhoto}
                                            className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition flex items-center justify-center gap-2"
                                        >
                                            <Camera className="w-4 h-4" />
                                            {uploadingPhoto ? 'Uploading...' : 'Upload New Photo'}
                                        </button>
                                    </section>
                                )}

                                {/* Admin: Account Status */}
                                {canManageRoles && (
                                    <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                                            <Shield className="w-5 h-5 text-red-600" />
                                            <h3 className="text-lg font-semibold text-gray-900">Account Status</h3>
                                        </div>
                                        <div className="flex items-center justify-between mb-6">
                                            <span className="text-gray-600 font-medium">Current Status</span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${employee.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                employee.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {employee.status || 'Active'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {employee.status !== 'ACTIVE' && (
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('Re-activate this employee?')) {
                                                            await updateEmployeeStatus(employee.id, 'ACTIVE');
                                                            refreshEmployee();
                                                        }
                                                    }}
                                                    className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm"
                                                >
                                                    Activate Account
                                                </button>
                                            )}

                                            {employee.status !== 'SUSPENDED' && (
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('Suspend this employee? They will not be able to login.')) {
                                                            await updateEmployeeStatus(employee.id, 'SUSPENDED');
                                                            refreshEmployee();
                                                        }
                                                    }}
                                                    className="w-full py-2 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-200 font-medium"
                                                >
                                                    Suspend Account
                                                </button>
                                            )}

                                            {employee.status !== 'BANNED' && (
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('Ban this employee? This is a severe action.')) {
                                                            await updateEmployeeStatus(employee.id, 'BANNED');
                                                            refreshEmployee();
                                                        }
                                                    }}
                                                    className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium"
                                                >
                                                    Ban Employee
                                                </button>
                                            )}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab !== 'overview' && activeTab !== 'settings' && (
                        <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Information for <span className="font-semibold text-gray-600 capitalize">{activeTab}</span> will appear here.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Role Management Modal */}
            {showRoleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Manage Approval Roles</h3>
                            <button onClick={() => setShowRoleModal(false)} className="text-gray-400 hover:text-gray-600">
                                <CheckSquare className="w-5 h-5 invisible" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-5">
                            Select the specific approval groups for <span className="font-semibold">{employee.first_name} {employee.last_name}</span>.
                        </p>

                        <div className="space-y-3 mb-8 max-h-[60vh] overflow-y-auto">
                            {['PROJECT_MANAGER', 'OPERATOR_MANAGER', 'GENERAL_MANAGER', 'FINANCE'].map(role => (
                                <label key={role} className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${selectedGroups.includes(role) ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200'}`}>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedGroups.includes(role) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                        {selectedGroups.includes(role) && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedGroups.includes(role)}
                                        onChange={() => toggleGroup(role)}
                                        className="hidden"
                                    />
                                    <span className="ml-3 font-medium text-gray-700">{role.replace('_', ' ')}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                            <button
                                onClick={() => setShowRoleModal(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveRoles}
                                disabled={savingRoles}
                                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {savingRoles && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                                {savingRoles ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
