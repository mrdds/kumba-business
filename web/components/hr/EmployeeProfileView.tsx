'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
    updateEmployee,
    updateEmployeeHR,
    changePassword,
    uploadEmployeePhoto,
    updateEmployeeStatus,
    getWorkSites,
    uploadEmployeeDocument,
    deleteEmployeeDocument
} from '../../services/api';
import {
    ArrowLeft, Mail, Phone, Calendar, Briefcase,
    MapPin, DollarSign, User, Shield, Clock,
    CheckSquare, Camera, Lock, Save, Bell,
    Map, X, Loader2, Check, Fingerprint, Globe,
    GraduationCap, Heart, Baby, FileText, Download,
    Trash2, CheckCircle, Plus, UploadCloud, Edit
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../context/NotificationContext';
import clsx from 'clsx';
import { Outfit } from 'next/font/google';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

const NATIONALITIES = [
    { v: 'DZ', l: 'Algérienne' }, { v: 'AO', l: 'Angolaise' }, { v: 'BJ', l: 'Béninoise' }, { v: 'BW', l: 'Botswanaise' },
    { v: 'BF', l: 'Burkinabée' }, { v: 'BI', l: 'Burundaise' }, { v: 'CM', l: 'Camerounaise' }, { v: 'CV', l: 'Cap-verdienne' },
    { v: 'CF', l: 'Centrafricaine' }, { v: 'TD', l: 'Tchadienne' }, { v: 'KM', l: 'Comorienne' }, { v: 'CG', l: 'Congolaise (Brazzaville)' },
    { v: 'CD', l: 'Congolaise (Kinshasa)' }, { v: 'CI', l: 'Ivoirienne' }, { v: 'DJ', l: 'Djiboutienne' }, { v: 'EG', l: 'Égyptienne' },
    { v: 'GQ', l: 'Équato-guinéenne' }, { v: 'ER', l: 'Érythréenne' }, { v: 'ET', l: 'Éthiopienne' }, { v: 'GA', l: 'Gabonaise' },
    { v: 'GM', l: 'Gambienne' }, { v: 'GH', l: 'Ghanéenne' }, { v: 'GN', l: 'Guinéenne' }, { v: 'GW', l: 'Guinéenne (Bissau)' },
    { v: 'KE', l: 'Kényane' }, { v: 'LS', l: 'Lesothane' }, { v: 'LR', l: 'Libérienne' }, { v: 'LY', l: 'Libyenne' },
    { v: 'MG', l: 'Malgache' }, { v: 'MW', l: 'Malawite' }, { v: 'ML', l: 'Malienne' }, { v: 'MR', l: 'Mauritanienne' },
    { v: 'MU', l: 'Mauricienne' }, { v: 'MA', l: 'Marocaine' }, { v: 'MZ', l: 'Mozambicaine' }, { v: 'NA', l: 'Namibienne' },
    { v: 'NE', l: 'Nigérienne' }, { v: 'NG', l: 'Nigériane' }, { v: 'RW', l: 'Rwandaise' }, { v: 'ST', l: 'Santoméenne' },
    { v: 'SN', l: 'Sénégalaise' }, { v: 'SC', l: 'Seychelloise' }, { v: 'SL', l: 'Sierra-léonaise' }, { v: 'SO', l: 'Somalienne' },
    { v: 'ZA', l: 'Sud-africaine' }, { v: 'SS', l: 'Sud-soudanaise' }, { v: 'SD', l: 'Soudanaise' }, { v: 'SZ', l: 'Swazie' },
    { v: 'TZ', l: 'Tanzanienne' }, { v: 'TG', l: 'Togolaise' }, { v: 'TN', l: 'Tunisienne' }, { v: 'UG', l: 'Ougandaise' },
    { v: 'ZM', l: 'Zambienne' }, { v: 'ZW', l: 'Zimbabwéenne' }, { v: 'FR', l: 'Française' }, { v: 'BE', l: 'Belge' },
    { v: 'CA', l: 'Canadienne' }, { v: 'US', l: 'Américaine' }, { v: 'CH', l: 'Suisse' }
].sort((a, b) => a.l.localeCompare(b.l));

const DEPARTMENTS = [
    "Direction Générale", "Administration & RH", "Finance & Comptabilité",
    "Commercial & Marketing", "Opérations / Production", "Logistique / Supply Chain",
    "Informatique / IT", "Maintenance / Services Généraux", "Juridique / Légal", "Sécurité"
].map(d => ({ v: d, l: d }));

const CATEGORIES = [
    "Cadre Dirigeant", "Cadre", "Agent de Maîtrise", "Employé",
    "Ouvrier Qualifié", "Ouvrier", "Stagiaire", "Consultant"
].map(c => ({ v: c, l: c }));

interface EmployeeProfileViewProps {
    employee: any;
    loading: boolean;
    refreshEmployee: () => void;
    showBackButton?: boolean;
}

export default function EmployeeProfileView({ employee, loading, refreshEmployee, showBackButton = true }: EmployeeProfileViewProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const { showToast } = useNotification();

    const [activeTab, setActiveTab] = useState('identity');
    const [isEditMode, setIsEditMode] = useState(false);

    // States from original code
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedGroups, setSelectedGroups] = useState < string[] > ([]);
    const [savingRoles, setSavingRoles] = useState(false);
    const [passwordData, setPasswordData] = useState({ old: '', new: '', confirm: '' });
    const [savingPassword, setSavingPassword] = useState(false);
    const [workSites, setWorkSites] = useState < any[] > ([]);

    // Main Form Data (Merging original states)
    const [formData, setFormData] = useState < any > ({});
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newDocName, setNewDocName] = useState('');
    const [newDocType, setNewDocType] = useState('OTHER');
    const [selectedFile, setSelectedFile] = useState < File | null > (null);

    const fileInputRef = useRef < HTMLInputElement > (null);
    const docInputRef = useRef < HTMLInputElement > (null);

    const isMe = currentUser?.email === employee?.email;
    const canManageRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser?.role || '');
    const canManageHR = canManageRoles || ['RH'].includes(currentUser?.role || '');

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
            setFormData({
                ...employee,
                work_site_id: employee.work_site_id || '',
                groups: employee.groups || []
            });
        }
    }, [employee]);

    if (loading) return (
        <div className="flex justify-center items-center h-full min-h-[60vh]">
            <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
        </div>
    );

    if (!employee) return (
        <div className="p-20 text-center bg-white rounded-[40px] border border-slate-100 shadow-2xl max-w-2xl mx-auto mt-10">
            <User className="w-20 h-20 text-slate-100 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Employé introuvable</h3>
            <p className="text-slate-500 text-base mt-2">Désolé, nous n'avons pas pu charger les détails de cet employé.</p>
        </div>
    );

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setUploadingPhoto(true);
            try {
                await uploadEmployeePhoto(employee.id, e.target.files[0]);
                refreshEmployee();
                showToast('Photo de profil mise à jour', 'success');
            } catch {
                showToast('Erreur lors du chargement de la photo', 'error');
            } finally {
                setUploadingPhoto(false);
            }
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Clean payload: send only editable fields
            const allowedFields = [
                'first_name', 'last_name', 'email', 'phone', 'position',
                'department', 'hire_date', 'base_salary', 'birth_date',
                'birth_place', 'gender', 'nationality', 'marital_status',
                'children_count', 'address', 'category', 'work_site_id',
                'matricule'
            ];

            const payload: any = {};
            allowedFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    payload[field] = formData[field];
                }
            });

            // Map kumba_id to matricule if backend expects matricule but we have kumba_id
            if (!payload.matricule && employee.kumba_id) {
                payload.matricule = employee.kumba_id;
            }

            // Ensure types are correct for the backend
            if (payload.work_site_id === "" || payload.work_site_id === "null" || payload.work_site_id === null) {
                payload.work_site_id = null;
            } else if (payload.work_site_id !== undefined) {
                payload.work_site_id = Number(payload.work_site_id);
            }

            if (payload.base_salary === "" || payload.base_salary === null) {
                payload.base_salary = 0;
            } else if (payload.base_salary !== undefined) {
                payload.base_salary = Number(payload.base_salary);
            }

            if (payload.children_count === "" || payload.children_count === null) {
                payload.children_count = 0;
            } else if (payload.children_count !== undefined) {
                payload.children_count = Number(payload.children_count);
            }

            console.log("Saving employee profile with payload:", JSON.stringify(payload, null, 2));

            await updateEmployeeHR(employee.id, payload);
            showToast('Profil mis à jour avec succès', 'success');
            setIsEditMode(false);
            refreshEmployee();
        } catch (error: any) {
            console.error("Error saving employee profile:", error.response?.data);
            const detailedError = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            console.error("Detailed validation error:", detailedError);

            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Erreur de validation (422)';
            showToast(`${errorMsg}: ${detailedError.substring(0, 50)}...`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            showToast("Les nouveaux mots de passe ne correspondent pas", 'error');
            return;
        }
        setSavingPassword(true);
        try {
            await changePassword({
                old_password: passwordData.old,
                new_password: passwordData.new
            });
            showToast("Mot de passe mis à jour avec succès", 'success');
            setPasswordData({ old: '', new: '', confirm: '' });
        } catch (error: any) {
            showToast(error.response?.data?.message || "Échec de la mise à jour", 'error');
        } finally {
            setSavingPassword(false);
        }
    };

    const handleSaveRoles = async () => {
        setSavingRoles(true);
        try {
            await updateEmployee(employee.id, { groups: selectedGroups });
            setShowRoleModal(false);
            showToast("Droits d'accès mis à jour", 'success');
            refreshEmployee();
        } catch (e) {
            showToast('Échec de la mise à jour des rôles', 'error');
        } finally {
            setSavingRoles(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const toggleGroup = (group: string) => {
        if (selectedGroups.includes(group)) {
            setSelectedGroups(selectedGroups.filter(g => g !== group));
        } else {
            setSelectedGroups([...selectedGroups, group]);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
            {/* Back Button */}
            {showBackButton && (
                <button
                    onClick={() => router.back()}
                    className="group flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 w-fit mb-4"
                >
                    <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">{t('common.back')}</span>
                </button>
            )}

            {/* Glassmorphism Header */}
            <div className="relative bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-0 h-48 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(99,102,241,0.2),transparent_50%)]" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                </div>

                <div className="relative pt-24 px-8 md:px-12 pb-10">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div className="flex-1 min-w-0 flex flex-col md:flex-row items-end gap-8 group">
                            {/* Avatar Section */}
                            <div className="shrink-0 relative h-44 w-44 rounded-[40px] bg-white p-2 shadow-2xl ring-8 ring-white/10 transition-transform hover:scale-[1.02] duration-500">
                                {employee.photo_url ? (
                                    <img src={employee.photo_url} alt="Profile" className="w-full h-full rounded-[34px] object-cover" />
                                ) : (
                                    <div className="w-full h-full rounded-[34px] bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center text-white text-xl font-black tracking-tighter uppercase">
                                        {employee.first_name?.[0]}{employee.last_name?.[0]}
                                    </div>
                                )}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-2 -right-2 h-12 w-12 bg-indigo-600 text-white rounded-2xl shadow-xl border-4 border-white flex items-center justify-center hover:bg-slate-900 hover:rotate-12 transition-all z-10"
                                >
                                    <Camera size={20} />
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                {uploadingPhoto && (
                                    <div className="absolute inset-0 bg-white/80 rounded-[34px] flex items-center justify-center z-20 backdrop-blur-sm">
                                        <Loader2 size={32} className="animate-spin text-indigo-600" />
                                    </div>
                                )}
                            </div>

                            {/* Identity Info */}
                            <div className="flex-1 min-w-0 mb-2 space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className={clsx(
                                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[2px] border shadow-sm",
                                        employee.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                    )}>
                                        {employee.status || 'ACTIVE'}
                                    </span>
                                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[2px] bg-slate-900 text-white border border-slate-800 shadow-sm">
                                        {employee.kumba_id || employee.matricule || "N/A"}
                                    </span>
                                </div>
                                <h1 className={clsx("text-4xl md:text-5xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                                    {isEditMode ? (
                                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                                            <input className="flex-1 min-w-0 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none px-6 py-3 text-xl font-black text-slate-900 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-inner" value={formData.first_name || ''} onChange={e => updateField('first_name', e.target.value)} placeholder="Prénom" />
                                            <input className="flex-1 min-w-0 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none px-6 py-3 text-xl font-black text-slate-900 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-inner" value={formData.last_name || ''} onChange={e => updateField('last_name', e.target.value)} placeholder="Nom" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <h6 className='text-2xl text-white mb-4'>{employee.first_name} {employee.last_name}</h6>
                                            {employee.is_activated && <CheckCircle size={24} className="text-indigo-500 fill-indigo-50" />}
                                        </div>
                                    )}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-slate-400 font-bold text-[10px] uppercase tracking-[1px]">
                                    <span className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><Briefcase size={14} className="text-indigo-500" /> {employee.position}</span>
                                    <span className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><Shield size={14} className="text-indigo-500" /> {employee.department || 'Non assigné'}</span>
                                    <span className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                        <MapPin size={14} className="text-indigo-500" />
                                        {workSites.find(s => s.id === (formData.work_site_id || employee.work_site_id))?.name || employee.work_site || 'Siège'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 flex flex-wrap items-center gap-3 mb-2">
                            {canManageHR && !isEditMode && (
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => setIsEditMode(true)}
                                        className="px-4 py-2 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[2px] hover:bg-indigo-600 hover:translate-y-[-4px] transition-all shadow-2xl shadow-slate-900/20 flex items-center gap-3 group"
                                    >
                                        <Edit size={18} className="transition-transform group-hover:rotate-12" /> {t('common.edit')}
                                    </button>
                                    {canManageRoles && (
                                        <button
                                            onClick={() => setShowRoleModal(true)}
                                            className="px-4 py-2 bg-white border-2 border-slate-100 text-slate-900 rounded-[24px] font-black text-xs uppercase tracking-[2px] hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-xl shadow-slate-200/50 flex items-center gap-3"
                                        >
                                            <Shield size={18} /> {t('hr.profile.sections.permissions')}
                                        </button>
                                    )}
                                </div>
                            )}
                            {isEditMode && (
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => { setIsEditMode(false); setFormData({ ...employee }); }}
                                        className="px-6 py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-[24px] font-black text-xs uppercase tracking-[2px] hover:bg-slate-50 transition-all"
                                    >
                                        <X size={18} className="inline mr-2" /> {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-6 py-4 bg-indigo-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[2px] hover:bg-indigo-700 hover:translate-y-[-4px] transition-all shadow-2xl shadow-indigo-600/20 flex items-center gap-3"
                                    >
                                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        {saving ? t('common.saving') : t('common.save')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modern Tabs Navigation */}
                <div className="px-8 md:px-12 bg-slate-50/50 backdrop-blur-md border-t border-slate-100">
                    <div className="flex items-center justify-center md:justify-start gap-2 overflow-x-auto py-2 no-scrollbar">
                        <TabBtn active={activeTab === 'identity'} onClick={() => setActiveTab('identity')} icon={<User size={16} />} label={t('hr.profile.tabs.identity')} />
                        <TabBtn active={activeTab === 'professional'} onClick={() => setActiveTab('professional')} icon={<Briefcase size={16} />} label={t('hr.profile.tabs.professional')} />
                        <TabBtn active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<Clock size={16} />} label={t('hr.profile.tabs.admin')} />
                        <TabBtn active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={<FileText size={16} />} label={t('hr.profile.tabs.documents')} />
                        <TabBtn active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Lock size={16} />} label={t('hr.profile.tabs.security')} />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {activeTab === 'identity' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <ProfileSection title={t('hr.profile.sections.personal')} description="Coordonnées et détails civils">
                            <EditRow label="Sexe" value={formData.gender} isEdit={isEditMode} onChange={v => updateField('gender', v)} type="select" options={[{ v: 'M', l: 'Masculin' }, { v: 'F', l: 'Féminin' }]} icon={<User size={14} />} />
                            <EditRow label="Date de naissance" value={formData.birth_date} isEdit={isEditMode} onChange={v => updateField('birth_date', v)} type="date" icon={<Calendar size={14} />} />
                            <EditRow label="Lieu de naissance" value={formData.birth_place} isEdit={isEditMode} onChange={v => updateField('birth_place', v)} icon={<MapPin size={14} />} />
                            <EditRow label="Nationalité" value={formData.nationality} isEdit={isEditMode} onChange={v => updateField('nationality', v)} type="select" options={NATIONALITIES} icon={<Globe size={14} />} />
                        </ProfileSection>

                        <ProfileSection title="Contact & Famille" description="Moyens de communication">
                            <EditRow label="État Civil" value={formData.marital_status} isEdit={isEditMode} onChange={v => updateField('marital_status', v)} type="select" options={[{ v: 'SINGLE', l: 'Célibataire' }, { v: 'MARRIED', l: 'Marié(e)' }, { v: 'DIVORCED', l: 'Divorcé(e)' }, { v: 'WIDOWED', l: 'Veuf/Veuve' }]} icon={<Heart size={14} />} />
                            <EditRow label="Nombre d'enfants" value={formData.children_count} isEdit={isEditMode} onChange={v => updateField('children_count', parseInt(v))} type="number" icon={<Baby size={14} />} />
                            <EditRow label="Téléphone" value={formData.phone} isEdit={isEditMode} onChange={v => updateField('phone', v)} type="tel" icon={<Phone size={14} />} />
                            <EditRow label="Email" value={formData.email} isEdit={isEditMode} onChange={v => updateField('email', v)} type="email" icon={<Mail size={14} />} />
                        </ProfileSection>

                        <ProfileSection title="Adresse de Résidence" description="Localisation physique">
                            {isEditMode ? (
                                <textarea className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] p-6 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-inner" value={formData.address || ''} onChange={e => updateField('address', e.target.value)} rows={4} placeholder="Adresse complète..." />
                            ) : (
                                <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 italic text-sm text-slate-400 leading-relaxed">
                                    {employee.address || 'Aucune adresse renseignée'}
                                </div>
                            )}
                        </ProfileSection>
                    </div>
                )}

                {activeTab === 'professional' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <ProfileSection title="Poste & Carrière" description="Informations professionnelles au sein de l'entreprise">
                            <EditRow label="Matricule" value={formData.matricule} isEdit={isEditMode} onChange={v => updateField('matricule', v)} icon={<Fingerprint size={14} />} />
                            <EditRow label="Fonction / Poste" value={formData.position} isEdit={isEditMode} onChange={v => updateField('position', v)} icon={<Briefcase size={14} />} />
                            <EditRow label="Département" value={formData.department} isEdit={isEditMode} onChange={v => updateField('department', v)} type="select" options={DEPARTMENTS} icon={<Shield size={14} />} />
                            <EditRow label="Date d'embauche" value={formData.hire_date} isEdit={isEditMode} onChange={v => updateField('hire_date', v)} type="date" icon={<Clock size={14} />} />
                            <EditRow
                                label="Site de Travail"
                                value={formData.work_site_id || employee.work_site_id}
                                isEdit={isEditMode && canManageRoles}
                                onChange={v => updateField('work_site_id', v)}
                                type="select"
                                options={workSites.map(s => ({ v: s.id, l: s.name }))}
                                icon={<MapPin size={14} />}
                            />
                        </ProfileSection>

                        <div className="space-y-10">
                            <ProfileSection title="Rémunération" description="Salaire de base mensuel">
                                <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                    <p className="text-[10px] font-black uppercase text-white/40 tracking-[2px] mb-4">Salaire de Base</p>
                                    {isEditMode && canManageRoles ? (
                                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/20">
                                            <input type="number" className="flex-1 bg-transparent text-3xl font-black text-white outline-none" value={formData.base_salary || 0} onChange={e => updateField('base_salary', parseFloat(e.target.value))} />
                                            <span className="text-sm font-bold text-white/40">XOF / MOIS</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-white tracking-tighter">{new Intl.NumberFormat('fr-FR').format(employee.base_salary || 0)}</span>
                                            <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">XOF / MOIS</span>
                                        </div>
                                    )}
                                </div>
                            </ProfileSection>

                            <ProfileSection title="Classification Administrative" description="Catégorie professionnelle">
                                <EditRow label="Catégorie" value={formData.category} isEdit={isEditMode} onChange={v => updateField('category', v)} type="select" options={CATEGORIES} icon={<Shield size={14} />} />
                            </ProfileSection>
                        </div>
                    </div>
                )}

                {activeTab === 'admin' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <ProfileSection title="Statut du Compte" description="Gérer l'accès de l'utilisateur à la plateforme">
                            <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">État actuel</p>
                                            <p className={clsx(
                                                "text-sm font-black uppercase",
                                                employee.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'
                                            )}>{employee.status || 'ACTIVE'}</p>
                                        </div>
                                    </div>
                                </div>
                                {canManageRoles && (
                                    <div className="grid grid-cols-1 gap-3">
                                        {employee.status !== 'ACTIVE' && (
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Réactiver cet employé ?')) {
                                                        await updateEmployeeStatus(employee.id, 'ACTIVE');
                                                        refreshEmployee();
                                                        showToast('Compte réactivé', 'success');
                                                    }
                                                }}
                                                className="w-full py-4 bg-emerald-600 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                                            >
                                                Activer le compte
                                            </button>
                                        )}
                                        {employee.status !== 'SUSPENDED' && (
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Suspendre cet employé ?')) {
                                                        await updateEmployeeStatus(employee.id, 'SUSPENDED');
                                                        refreshEmployee();
                                                        showToast('Compte suspendu', 'warning');
                                                    }
                                                }}
                                                className="w-full py-4 bg-amber-100 text-amber-700 border-2 border-amber-200 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-amber-200 transition-all"
                                            >
                                                Suspendre l'accès
                                            </button>
                                        )}
                                        {employee.status !== 'BANNED' && (
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Bannir cet employé ? Cette action est irréversible.')) {
                                                        await updateEmployeeStatus(employee.id, 'BANNED');
                                                        refreshEmployee();
                                                        showToast('Employé banni', 'error');
                                                    }
                                                }}
                                                className="w-full py-4 bg-rose-50 text-rose-600 border-2 border-rose-100 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all"
                                            >
                                                Bannir définitivement
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </ProfileSection>

                        <ProfileSection title="Rôles & Permissions" description="Groupes d'approbation et droits système">
                            <div className="space-y-4">
                                {employee.groups?.length === 0 && (
                                    <div className="p-8 text-center bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200">
                                        <p className="text-sm text-slate-400 italic">Aucun rôle assigné</p>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-3">
                                    {employee.groups?.map((g: string) => (
                                        <div key={g} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle size={14} /> {g.replace('_', ' ')}
                                        </div>
                                    ))}
                                </div>
                                {canManageRoles && (
                                    <button
                                        onClick={() => setShowRoleModal(true)}
                                        className="w-full mt-4 py-4 bg-white border-2 border-slate-100 rounded-[20px] text-slate-900 font-black text-xs uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all"
                                    >
                                        Gérer les groupes d'approbation
                                    </button>
                                )}
                            </div>
                        </ProfileSection>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="space-y-10">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Gestion Documentaire</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Fichiers et justificatifs administratifs</p>
                            </div>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                disabled={uploadingDoc}
                                className="px-6 py-3 bg-slate-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-xl shadow-slate-900/10"
                            >
                                {uploadingDoc ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                Ajouter un document
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(employee.documents || []).length === 0 && (
                                <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[40px] border-4 border-dashed border-slate-100">
                                    <p className="text-slate-400 font-bold text-base tracking-tight">Aucun document disponible</p>
                                </div>
                            )}
                            {(employee.documents || []).map((doc: any) => (
                                <div key={doc.id} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                            <FileText size={28} />
                                        </div>
                                        <div className="max-w-[160px]">
                                            <p className="font-black text-slate-900 text-sm truncate uppercase tracking-tight" title={doc.name}>{doc.name}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{doc.document_type || 'Document'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl flex items-center justify-center transition-all">
                                            <Download size={20} />
                                        </a>
                                        {canManageHR && (
                                            <button onClick={async () => {
                                                if (confirm(t('common.confirm_delete'))) {
                                                    try {
                                                        await deleteEmployeeDocument(doc.id);
                                                        showToast('Document supprimé', 'success');
                                                        refreshEmployee();
                                                    } catch {
                                                        showToast('Erreur lors de la suppression', 'error');
                                                    }
                                                }
                                            }} className="h-10 w-10 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl flex items-center justify-center transition-all">
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {isMe && (
                            <ProfileSection title="Sécurité du Compte" description="Mise à jour du mot de passe">
                                <form onSubmit={handleChangePassword} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mot de passe actuel</label>
                                        <input
                                            type="password"
                                            value={passwordData.old}
                                            onChange={(e) => setPasswordData({ ...passwordData, old: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-sm outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-inner"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nouveau mot de passe</label>
                                        <input
                                            type="password"
                                            value={passwordData.new}
                                            onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-sm outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-inner"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Confirmer le nouveau mot de passe</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirm}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-sm outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-inner"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={savingPassword}
                                        className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-indigo-600 shadow-2xl shadow-slate-900/10 transition-all flex items-center justify-center gap-3"
                                    >
                                        {savingPassword ? <Loader2 size={20} className="animate-spin" /> : <Lock size={20} />}
                                        Mettre à jour le mot de passe
                                    </button>
                                </form>
                            </ProfileSection>
                        )}
                        <ProfileSection title="Préférences" description="Personnalisation de l'interface">
                            <div className="space-y-4">
                                <label className="flex items-center justify-between p-6 bg-slate-50/50 border-2 border-slate-100 rounded-[24px] hover:bg-white hover:border-indigo-100 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm transition-all">
                                            <Bell size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase text-slate-900 tracking-tight">Notifications Email</p>
                                            <p className="text-[10px] text-slate-400 font-bold">Alertes d'approbation et RH</p>
                                        </div>
                                    </div>
                                    <input type="checkbox" className="w-6 h-6 text-indigo-600 rounded-lg border-2 border-slate-200 focus:ring-indigo-500" defaultChecked />
                                </label>
                                <label className="flex items-center justify-between p-6 bg-slate-50/50 border-2 border-slate-100 rounded-[24px] hover:bg-white hover:border-indigo-100 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm transition-all">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase text-slate-900 tracking-tight">Fuseau horaire automatique</p>
                                            <p className="text-[10px] text-slate-400 font-bold">Synchronisé avec le navigateur</p>
                                        </div>
                                    </div>
                                    <input type="checkbox" className="w-6 h-6 text-indigo-600 rounded-lg border-2 border-slate-200 focus:ring-indigo-500" defaultChecked />
                                </label>
                            </div>
                        </ProfileSection>
                    </div>
                )}
            </div>

            {/* Role Management Modal (Restored from original) */}
            {showRoleModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-lg max-h-[95vh] shadow-2xl border border-white relative overflow-hidden flex flex-col">
                        <div className="p-10 overflow-y-auto custom-scrollbar">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Gestion des Rôles d'Approbation</h3>
                            <button onClick={() => setShowRoleModal(false)} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-sm text-slate-500 mb-6 font-medium relative z-10">
                            Sélectionnez les groupes d'approbation spécifiques pour <span className="font-bold text-slate-900">{employee.first_name} {employee.last_name}</span>.
                        </p>

                        <div className="space-y-3 mb-10 max-h-[40vh] overflow-y-auto pr-2 relative z-10 custom-scrollbar">
                            {['PROJECT_MANAGER', 'OPERATOR_MANAGER', 'GENERAL_MANAGER', 'FINANCE'].map(role => (
                                <label key={role} className={clsx(
                                    "flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all group",
                                    selectedGroups.includes(role) ? "border-indigo-200 bg-indigo-50 shadow-sm" : "border-slate-100 hover:border-slate-200 bg-white"
                                )}>
                                    <div className={clsx(
                                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                        selectedGroups.includes(role) ? "bg-indigo-600 border-indigo-600 scale-110" : "border-slate-200"
                                    )}>
                                        {selectedGroups.includes(role) && <Check size={14} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedGroups.includes(role)}
                                        onChange={() => toggleGroup(role)}
                                        className="hidden"
                                    />
                                    <span className={clsx(
                                        "ml-4 font-black text-xs uppercase tracking-widest transition-colors",
                                        selectedGroups.includes(role) ? "text-indigo-900" : "text-slate-500"
                                    )}>{role.replace('_', ' ')}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex justify-end gap-4 relative z-10">
                            <button
                                onClick={() => setShowRoleModal(false)}
                                className="px-6 py-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSaveRoles}
                                disabled={savingRoles}
                                className="px-8 py-4 bg-indigo-600 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {savingRoles && <Loader2 size={16} className="animate-spin" />}
                                {savingRoles ? 'Sauvegarde...' : 'Appliquer les modifications'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            )}

            {/* Upload Modal for Documents */}
            {showUploadModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-lg max-h-[95vh] shadow-2xl border border-white relative overflow-hidden flex flex-col">
                        <div className="p-10 overflow-y-auto custom-scrollbar">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Nouveau Document</h3>
                            <button onClick={() => setShowUploadModal(false)} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-8 relative z-10">
                            <div
                                onClick={() => docInputRef.current?.click()}
                                className={clsx(
                                    "border-4 border-dashed rounded-[32px] p-12 text-center cursor-pointer transition-all group",
                                    selectedFile ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'
                                )}
                            >
                                <input type="file" ref={docInputRef} className="hidden" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setSelectedFile(file);
                                        if (!newDocName) setNewDocName(file.name.split('.')[0]);
                                    }
                                }} />
                                {selectedFile ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <FileText size={40} className="text-indigo-600" />
                                        <p className="font-black text-slate-900 text-sm">{selectedFile.name}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-indigo-400">
                                        <UploadCloud size={40} />
                                        <p className="font-bold text-sm">Cliquez pour ajouter un fichier</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    value={newDocName}
                                    onChange={(e) => setNewDocName(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-sm outline-none focus:border-indigo-500 transition-all"
                                    placeholder="Nom du document"
                                />
                                <select
                                    value={newDocType}
                                    onChange={(e) => setNewDocType(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-sm outline-none focus:border-indigo-500 transition-all"
                                >
                                    <option value="CV">CV</option>
                                    <option value="ID_CARD">Carte d'Identité</option>
                                    <option value="DIPLOMA">Diplôme</option>
                                    <option value="CONTRACT">Contrat</option>
                                    <option value="OTHER">Autre</option>
                                </select>
                            </div>

                            <button
                                disabled={!selectedFile || !newDocName || uploadingDoc}
                                onClick={async () => {
                                    if (!selectedFile) return;
                                    setUploadingDoc(true);
                                    try {
                                        await uploadEmployeeDocument(employee.id, newDocName, newDocType, selectedFile);
                                        showToast('Document ajouté', 'success');
                                        setShowUploadModal(false);
                                        setSelectedFile(null);
                                        setNewDocName('');
                                        refreshEmployee();
                                    } catch {
                                        showToast('Erreur lors de l\'ajout', 'error');
                                    } finally {
                                        setUploadingDoc(false);
                                    }
                                }}
                                className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-50 transition-all"
                            >
                                {uploadingDoc ? <Loader2 size={20} className="animate-spin" /> : 'Ajouter au dossier'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}

interface TabBtnProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

function TabBtn({ active, onClick, icon, label }: TabBtnProps) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "group relative flex items-center gap-2.5 px-6 py-4 rounded-2xl transition-all duration-300 font-black text-[10px] uppercase tracking-[2px] whitespace-nowrap",
                active
                    ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20 translate-y-[-2px]"
                    : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
            )}
        >
            <span className={clsx("transition-transform duration-300 group-hover:scale-110", active ? "text-indigo-400" : "text-slate-300")}>
                {icon}
            </span>
            {label}
            {active && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            )}
        </button>
    );
}

interface ProfileSectionProps {
    title: string;
    children: React.ReactNode;
    action?: React.ReactNode;
    description?: string;
}

function ProfileSection({ title, children, action, description }: ProfileSectionProps) {
    return (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-xl">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">{title}</h3>
                    {description && <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{description}</p>}
                </div>
                {action}
            </div>
            <div className="p-8 space-y-2">{children}</div>
        </div>
    );
}

interface EditRowProps {
    icon: React.ReactNode;
    label: string;
    value: any;
    isEdit: boolean;
    onChange: (val: string) => void;
    type?: string;
    options?: any[];
}

function EditRow({ icon, label, value, isEdit, onChange, type = "text", options }: EditRowProps) {
    const displayValue = (val: any) => {
        if (val === null || val === undefined || val === 'null' || val === 'undefined' || val === '') return '—';
        return val;
    };

    const getLabel = (val: any) => {
        if (options && val !== null && val !== undefined && val !== '') {
            const opt = options.find(o => String(o.v) === String(val));
            if (opt) return opt.l;
        }
        return displayValue(val);
    };

    const inputValue = (val: any) => {
        if (val === null || val === undefined || val === 'null' || val === 'undefined') return '';
        return String(val);
    };

    return (
        <div className="grid grid-cols-12 items-center gap-4 py-4 border-b border-slate-50 last:border-0 group transition-all">
            {/* Label Side */}
            <div className="col-span-12 md:col-span-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center group-hover:text-indigo-600 group-hover:border-indigo-100 group-hover:bg-indigo-50 transition-all shrink-0">
                    {icon}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] group-hover:text-slate-600 transition-colors">
                    {label}
                </span>
            </div>

            {/* Value Side */}
            <div className="col-span-12 md:col-span-7 flex justify-start md:justify-end min-w-0">
                {isEdit ? (
                    <div className="w-full relative">
                        {type === 'select' && options ? (
                            <select
                                className="w-full md:text-right text-xs font-black text-slate-900 bg-slate-50/50 border-2 border-slate-200 rounded-2xl outline-none px-5 py-3 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all appearance-none cursor-pointer"
                                value={inputValue(value)}
                                onChange={e => onChange(e.target.value)}
                            >
                                <option value="">Sélectionner...</option>
                                {options.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
                            </select>
                        ) : (
                            <input
                                type={type}
                                className="w-full md:text-right text-xs font-black text-slate-900 bg-slate-50/50 border-2 border-slate-200 rounded-2xl outline-none px-5 py-3 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all"
                                value={inputValue(value)}
                                onChange={e => onChange(e.target.value)}
                                placeholder="..."
                            />
                        )}
                    </div>
                ) : (
                    <div className="px-6 py-3 bg-slate-50/30 border-2 border-slate-100 rounded-2xl min-w-[180px] max-w-full flex justify-start md:justify-end items-center transition-all group-hover:border-indigo-100 group-hover:bg-white group-hover:shadow-sm">
                        <span className={clsx(
                            "text-xs font-black md:text-right uppercase tracking-tight break-words leading-relaxed",
                            getLabel(value) === '—' ? "text-slate-300 italic" : "text-slate-900"
                        )}>
                            {getLabel(value)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
