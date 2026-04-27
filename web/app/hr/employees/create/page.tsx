'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '../../../dashboard-layout';
import api, { uploadEmployeeDocument } from '../../../../services/api';
import { useNotification } from '@/context/NotificationContext';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft, ArrowRight, Check, Loader2, User, Briefcase,
    GraduationCap, Building2, Shield, Plus, Trash2, Camera,
    ChevronDown, AlertCircle, FileText, UploadCloud, File, Trash,
    Sparkles, ShieldCheck, Heart, UserPlus, Globe, Mail, Phone, Calendar, Info, Banknote,
    AlertTriangle, MapPin, Truck, Box, Download, Users
} from 'lucide-react';
import ConfirmModal from '../../../../components/ui/ConfirmModal';
import clsx from 'clsx';
import Link from 'next/link';
import { JOB_TITLES } from '@/constants/JobTitles';
import { NATIONALITIES_BY_REGION, NATIONALITY_REGION_ORDER } from '@/constants/Nationalities';
import { Outfit } from 'next/font/google';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value || 0) + ' F CFA';
};

// ── Zod Schema ─────────────────────────────────────────────────────────────
const experienceSchema = z.object({
    company: z.string().min(1, 'Entreprise requise'),
    position: z.string().min(1, 'Poste requis'),
    start_year: z.string().min(4, 'Année requise'),
    end_year: z.string().optional(),
    current: z.boolean().optional(),
});

const employeeSchema = z.object({
    first_name: z.string().min(2, 'Prénom requis (min. 2 caractères)'),
    last_name: z.string().min(2, 'Nom requis (min. 2 caractères)'),
    gender: z.enum(['M', 'F'], { required_error: 'Le genre est requis' }),
    birth_date: z.string().optional(),
    birth_place: z.string().optional(),
    nationality: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Email invalide'),
    marital_status: z.enum(['single', 'married', 'divorced', 'widowed', '']).optional(),
    children_count: z.coerce.number().min(0).optional(),
    entry_date: z.string().optional(),
    job_title: z.string().min(1, 'Fonction requise'),
    department: z.string().optional(),
    employee_id: z.string().optional(),
    hire_date: z.string().optional(),
    category: z.string().optional(),
    education_level: z.string().optional(),
    education_field: z.string().optional(),
    experiences: z.array(experienceSchema).max(5),
    cnps_number: z.string().optional(),
    emergency_contacts: z.array(z.object({
        name: z.string().min(1, 'Nom requis'),
        phone: z.string().min(1, 'Téléphone requis'),
        relation: z.string().optional(),
    })).max(3),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'ADVANCED_USER', 'STANDARD_USER', 'READ_ONLY', 'AUDITOR']),
    base_salary: z.coerce.number().min(0).optional(),
    field_resource: z.object({
        resource_type: z.enum(['INTERNAL', 'SUBCONTRACTOR', 'FREELANCE', 'PARTNER']),
        category: z.string().min(1, 'Catégorie requise'),
        specialty: z.string().optional(),
        skill_level: z.string().optional(),
        zone: z.string().optional(),
        mobility: z.string().optional(),
        is_available: z.boolean().default(true),
        contractor_company: z.string().optional(),
        contract_reference: z.string().optional(),
        contact_person: z.string().optional(),
        contact_phone: z.string().optional(),
        contract_start_date: z.string().optional(),
        contract_end_date: z.string().optional(),
        daily_rate: z.coerce.number().optional(),
        payment_mode: z.string().optional(),
        can_drive: z.boolean().default(false),
        can_handle_inventory: z.boolean().default(false),
        can_receive_inventory: z.boolean().default(false),
        can_approve_inventory: z.boolean().default(false),
        can_sign_delivery: z.boolean().default(false),
        can_lead_team: z.boolean().default(false),
        can_close_mission: z.boolean().default(false),
    }).optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

// ── Constants ───────────────────────────────────────────────────────────────
const STEPS = [
    { id: 'personal', icon: User, label: 'Identité' },
    { id: 'professional', icon: Briefcase, label: 'Professionnel' },
    { id: 'education', icon: GraduationCap, label: 'Parcours' },
    { id: 'field', icon: Globe, label: 'Terrain' },
    { id: 'administrative', icon: Building2, label: 'Admin' },
    { id: 'documents', icon: FileText, label: 'Documents' },
    { id: 'role', icon: Shield, label: 'Accès' },
    { id: 'review', icon: Check, label: 'Validation' },
];

const ROLES = [
    { value: 'READ_ONLY', label: 'Consultant', desc: 'Lecture seule uniquement', color: 'slate' },
    { value: 'STANDARD_USER', label: 'Employé', desc: 'Accès basique collaborateur', color: 'indigo' },
    { value: 'PROJECT_MANAGER', label: 'Chef de Projet', desc: 'Gestion budgets & tâches', color: 'violet' },
    { value: 'MANAGER', label: 'Manager', desc: 'Gestion équipe & département', color: 'emerald' },
    { value: 'ADMIN', label: 'Administrateur', desc: 'Gérer modules & utilisateurs', color: 'amber' },
    { value: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Contrôle total du système', color: 'rose' },
];

const MARITAL_OPTIONS = [
    { value: 'single', label: 'Célibataire' },
    { value: 'married', label: 'Marié(e)' },
    { value: 'divorced', label: 'Divorcé(e)' },
    { value: 'widowed', label: 'Veuf/Veuve' },
];

const EDUCATION_LEVELS = [
    'Aucun', 'BEPC / Brevet', 'BAC', 'BTS / DUT', 'Licence / Bachelor',
    'Master / Maîtrise', 'Doctorat / PhD', 'Formation Professionnelle',
];

const FIELD_CATEGORIES = [
    // Télécom / Infrastructure
    { value: 'TECH_TL', label: 'Technicien TL' },
    { value: 'TECH_RIGGER', label: 'Technicien Rigger' },
    { value: 'TECH_FTTH', label: 'Technicien FTTH' },
    { value: 'TECH_RADIO', label: 'Technicien Radio' },
    { value: 'TECH_ENERGY', label: 'Technicien Énergie' },
    { value: 'TECH_MAINT', label: 'Technicien Maintenance' },
    { value: 'TECH_TRANS', label: 'Technicien Transmission' },
    { value: 'TECH_FIBER', label: 'Technicien Fibre' },
    { value: 'TECH_CW', label: 'Technicien Civil Works' },
    { value: 'TECH_SAT', label: 'Technicien SAT' },
    { value: 'TECH_NOC', label: 'Technicien NOC Terrain' },
    
    // Logistique / Support
    { value: 'DRIVER', label: 'Chauffeur' },
    { value: 'MAGASINIER', label: 'Magasinier' },
    { value: 'LOG_TERRAIN', label: 'Logisticien terrain' },
    { value: 'AGENT_DEPOT', label: 'Agent dépôt' },
    { value: 'COORD_TERRAIN', label: 'Coordinateur terrain' },
    
    // Supervision
    { value: 'TEAM_LEAD', label: 'Team Lead' },
    { value: 'SUPERVISOR', label: 'Superviseur terrain' },
    { value: 'CHIEF_WORKS', label: 'Chef chantier' },
    { value: 'COORD_OPS', label: 'Coordinateur opérations' },
    { value: 'QC_TERRAIN', label: 'Contrôleur qualité terrain' },
    
    // Exécution
    { value: 'INSTALLER', label: 'Installateur' },
    { value: 'MONTEUR', label: 'Monteur' },
    { value: 'LABORER', label: 'Manœuvre' },
    { value: 'MAINT_AGENT', label: 'Agent maintenance' },
    { value: 'SECURITY', label: 'Agent sécurité' },
    
    // Partenaires
    { value: 'TECH_SUB', label: 'Technicien sous-traitant' },
    { value: 'PARTNER_TEAM', label: 'Équipe partenaire' },
    { value: 'PREST_MAINT', label: 'Prestataire maintenance' },
    { value: 'CONTRACT_TERRAIN', label: 'Contractuel terrain' },
];

const DEPARTMENTS = [
    "Direction Générale", "Administration & RH", "Finance & Comptabilité",
    "Commercial & Marketing", "Opérations / Production", "Logistique / Supply Chain",
    "Informatique / IT", "Maintenance / Services Généraux", "Juridique / Légal", "Sécurité"
];

const CATEGORIES = [
    "Cadre Dirigeant", "Cadre", "Agent de Maîtrise", "Employé",
    "Ouvrier Qualifié", "Ouvrier", "Stagiaire", "Consultant"
];

const EDUCATION_FIELDS = [
    "Informatique & Réseaux",
    "Finance, Audit & Comptabilité",
    "Marketing & Communication",
    "Ressources Humaines",
    "Logistique & Transport",
    "Génie Civil & Construction",
    "Télécommunications",
    "Droit & Sciences Politiques",
    "Management & Gestion",
    "Énergie & Électricité",
    "Santé & Sécurité au Travail",
    "Autre"
];

// ── Sub-components ──────────────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-rose-500 font-black uppercase tracking-widest">
            <AlertCircle size={12} /> {message}
        </p>
    );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2.5 ml-1">
            {children}
            {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
    );
}

function Input({ error, className, icon: Icon, ...props }: any) {
    return (
        <div className="relative group">
            {Icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                    <Icon size={16} />
                </div>
            )}
            <input
                className={clsx(
                    "w-full bg-slate-50 border-none rounded-[20px] px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none",
                    Icon && "pl-12",
                    error && "bg-rose-50 ring-2 ring-rose-500/10",
                    className
                )}
                {...props}
            />
            <FieldError message={error} />
        </div>
    );
}

function Select({ error, children, icon: Icon, ...props }: any) {
    return (
        <div className="relative group">
            {Icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors z-10 pointer-events-none">
                    <Icon size={16} />
                </div>
            )}
            <select
                className={clsx(
                    "w-full bg-slate-50 border-none rounded-[20px] px-4 py-3.5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none",
                    Icon && "pl-12",
                    error && "bg-rose-50 ring-2 ring-rose-500/10"
                )}
                {...props}
            >
                {children}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                <ChevronDown size={16} />
            </div>
            <FieldError message={error} />
        </div>
    );
}

function SectionCard({ title, icon: Icon, color, children, description }: any) {
    return (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={clsx("px-8 py-8 flex items-center gap-4 border-b border-slate-50",
                color === 'blue' ? 'bg-indigo-50/30' :
                    color === 'emerald' ? 'bg-emerald-50/30' :
                        color === 'amber' ? 'bg-amber-50/30' : 'bg-slate-50/30'
            )}>
                <div className={clsx("p-3 rounded-2xl bg-white shadow-sm",
                    color === 'blue' ? 'text-indigo-600' :
                        color === 'emerald' ? 'text-emerald-600' :
                            color === 'amber' ? 'text-amber-600' : 'text-slate-600'
                )}>
                    <Icon size={24} />
                </div>
                <div>
                    <h2 className={clsx("text-2xl font-black text-slate-900 tracking-tight", displayFont.className)}>{title}</h2>
                    {description && <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{description}</p>}
                </div>
            </div>
            <div className="p-8 lg:p-12">{children}</div>
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function CreateEmployee() {
    const router = useRouter();
    const { t } = useTranslation();
    const { showToast } = useNotification();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState < string | null > (null);
    const [avatarFile, setAvatarFile] = useState < File | null > (null);
    const [showTitlePicker, setShowTitlePicker] = useState(false);
    const [newDocTitle, setNewDocTitle] = useState('');
    const [newDocType, setNewDocType] = useState('OTHER');

    const [cvFile, setCvFile] = useState < File | null > (null);
    const [birthCertFile, setBirthCertFile] = useState < File | null > (null);
    const [idFile, setIdFile] = useState < File | null > (null);
    const [otherDocs, setOtherDocs] = useState < { name: string, file: File, type: string }[] > ([]);
    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [isFieldActive, setIsFieldActive] = useState(false);

    const { register, control, handleSubmit, formState: { errors }, trigger, watch, setValue, getValues, reset } =
        useForm < EmployeeFormData > ({
            resolver: zodResolver(employeeSchema),
            defaultValues: {
                role: 'STANDARD_USER',
                experiences: [],
                emergency_contacts: [{ name: '', phone: '', relation: '' }],
                groups: [],
                children_count: 0,
                base_salary: 0,
                gender: 'M',
                field_resource: {
                    resource_type: 'INTERNAL',
                    category: '',
                    is_available: true,
                    mobility: 'LOCAL',
                    can_drive: false,
                    can_handle_inventory: false,
                    can_receive_inventory: false,
                    can_approve_inventory: false,
                    can_sign_delivery: false,
                    can_lead_team: false,
                    can_close_mission: false,
                }
            },
        });

    const { fields: expFields, append: addExp, remove: removeExp } = useFieldArray({ control, name: 'experiences' });
    const { fields: emergencyFields, append: addEmergency, remove: removeEmergency } = useFieldArray({ control, name: 'emergency_contacts' });

    const jobTitle = watch('job_title');
    const watchAllFields = watch();

    // Log validation errors for debugging
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.log("Validation Errors:", errors);
        }
    }, [errors]);

    useEffect(() => {
        const savedData = localStorage.getItem('employee_onboarding_form');
        const savedStep = localStorage.getItem('employee_onboarding_step');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                reset(parsed);
            } catch (e) { console.error(e); }
        }
        if (savedStep) setCurrentStep(parseInt(savedStep, 10));
    }, [reset]);

    useEffect(() => {
        localStorage.setItem('employee_onboarding_form', JSON.stringify(watchAllFields));
    }, [watchAllFields]);

    useEffect(() => {
        localStorage.setItem('employee_onboarding_step', currentStep.toString());
    }, [currentStep]);

    const clearForm = () => {
        localStorage.removeItem('employee_onboarding_form');
        localStorage.removeItem('employee_onboarding_step');
        reset({
            first_name: '',
            last_name: '',
            email: '',
            gender: 'M',
            birth_date: '',
            birth_place: '',
            nationality: '',
            phone: '',
            marital_status: '',
            children_count: 0,
            job_title: '',
            department: '',
            base_salary: 0,
            experiences: [],
            emergency_contacts: [{ name: '', phone: '', relation: '' }],
            role: 'STANDARD_USER',
            field_resource: {
                resource_type: 'INTERNAL',
                category: '',
                is_available: true,
                mobility: 'LOCAL',
                can_drive: false,
                can_handle_inventory: false,
                can_receive_inventory: false,
                can_approve_inventory: false,
                can_sign_delivery: false,
                can_lead_team: false,
                can_close_mission: false,
            }
        });
        setCurrentStep(0);
        setPhotoPreview(null);
        setAvatarFile(null);
        setIsFieldActive(false);
        showToast("Le formulaire a été réinitialisé.", "info");
    };

    const handleNext = async () => {
        let fieldsToValidate: any[] = [];
        
        switch (currentStep) {
            case 0: // Identité
                fieldsToValidate = ['first_name', 'last_name', 'email', 'gender'];
                break;
            case 1: // Professionnel
                fieldsToValidate = ['job_title'];
                break;
            case 2: // Parcours
                fieldsToValidate = ['experiences'];
                break;
            case 3: // Terrain
                if (isFieldActive) {
                    fieldsToValidate = ['field_resource.resource_type', 'field_resource.category'];
                }
                break;
            case 4: // Admin
                fieldsToValidate = ['emergency_contacts'];
                break;
            case 6: // Accès
                fieldsToValidate = ['role'];
                break;
        }

        const isValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate as any) : true;
        
        if (isValid) {
            setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            showToast("Veuillez remplir correctement tous les champs obligatoires avant de continuer.", "error");
        }
    };

    const handleBack = () => setCurrentStep(s => Math.max(s - 1, 0));

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const onSubmit = async (data: EmployeeFormData) => {
        console.log("Submitting Employee Data:", data);
        setLoading(true);
        try {
            const fd = new FormData();
            
            // Map job_title to position for the backend
            const { job_title, ...rest } = data;
            const submitData = { ...rest, position: job_title };

            // Append basic fields
            Object.entries(submitData).forEach(([k, v]) => {
                if (v !== undefined && v !== null && !['experiences', 'emergency_contacts', 'groups', 'field_resource'].includes(k)) {
                    fd.append(k, String(v));
                }
            });

            // Append arrays as JSON strings
            fd.append('experiences', JSON.stringify(data.experiences || []));
            fd.append('emergency_contacts', JSON.stringify(data.emergency_contacts || []));
            fd.append('groups', JSON.stringify(data.groups || []));
            
            // Append field resource if active
            if (isFieldActive && data.field_resource) {
                fd.append('field_resource', JSON.stringify(data.field_resource));
            }

            // Append avatar if present
            if (avatarFile) fd.append('avatar', avatarFile);

            console.log("FormData ready, sending to API...");

            const response = await api.post('/hr/employees', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            console.log("API Response:", response.data);

            const newEmployeeId = response.data.id;
            const uploadPromises = [];
            
            // Handle document uploads
            if (cvFile) uploadPromises.push(uploadEmployeeDocument(newEmployeeId, `CV_${data.first_name}`, 'CV', cvFile));
            if (birthCertFile) uploadPromises.push(uploadEmployeeDocument(newEmployeeId, `Extrait_${data.first_name}`, 'BIRTH_CERT', birthCertFile));
            if (idFile) uploadPromises.push(uploadEmployeeDocument(newEmployeeId, `ID_${data.first_name}`, 'ID_CARD', idFile));
            
            otherDocs.forEach(doc => {
                uploadPromises.push(uploadEmployeeDocument(newEmployeeId, doc.name, doc.type, doc.file));
            });

            if (uploadPromises.length > 0) {
                console.log(`Uploading ${uploadPromises.length} documents...`);
                await Promise.all(uploadPromises);
            }

            showToast(t('hr.employees.create.success'), 'success');
            
            // Clear persistence
            localStorage.removeItem('employee_onboarding_form');
            localStorage.removeItem('employee_onboarding_step');
            
            router.push('/hr/employees');
        } catch (err: any) {
            console.error("Submission Error:", err);
            const errorMsg = err.response?.data?.message || err.message || t('hr.employees.create.error');
            showToast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-8">
                        <div className="flex flex-col items-center gap-6 mb-10">
                            <label className="relative cursor-pointer group">
                                <div className="h-32 w-32 rounded-[40px] bg-slate-50 border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden group-hover:scale-105 transition-all">
                                    {photoPreview
                                        ? <img src={photoPreview} alt="preview" className="h-full w-full object-cover" />
                                        : <Camera size={40} className="text-slate-200" />
                                    }
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Sparkles size={24} className="text-white" />
                                    </div>
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                            </label>
                            <div className="text-center">
                                <p className="text-sm font-black text-slate-900 tracking-tight">Portrait Officiel</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">PNG ou JPG · Max 5 Mo</p>
                            </div>
                        </div>

                        <SectionCard title="Identité du Collaborateur" icon={User} color="blue" description="Informations civiles et contact">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <Label required>Prénom</Label>
                                    <Input {...register('first_name')} placeholder="Ex: Jean" error={errors.first_name?.message} icon={User} />
                                </div>
                                <div>
                                    <Label required>Nom de famille</Label>
                                    <Input {...register('last_name')} placeholder="Ex: Kouassi" error={errors.last_name?.message} icon={User} />
                                </div>
                                <div className="md:col-span-2">
                                    <Label required>Genre</Label>
                                    <div className="flex gap-3">
                                        {['M', 'F'].map(g => (
                                            <button
                                                key={g} type="button"
                                                onClick={() => setValue('gender', g as any)}
                                                className={clsx(
                                                    "flex-1 flex items-center justify-center gap-3 py-4 rounded-[24px] border-2 transition-all font-black text-xs uppercase tracking-widest",
                                                    watch('gender') === g
                                                        ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20"
                                                        : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
                                                )}
                                            >
                                                <div className={clsx("w-3 h-3 rounded-full border-2", watch('gender') === g ? "bg-white border-white" : "border-slate-300")} />
                                                {g === 'M' ? 'Masculin' : 'Féminin'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <Label>Date de naissance</Label>
                                    <Input type="date" {...register('birth_date')} icon={Calendar} error={errors.birth_date?.message} />
                                </div>
                                <div>
                                    <Label>Lieu de naissance</Label>
                                    <Input {...register('birth_place')} placeholder="Ex: Yamoussoukro" icon={Globe} error={errors.birth_place?.message} />
                                </div>
                                <div>
                                    <Label>Nationalité</Label>
                                    <Select {...register('nationality')} icon={Globe} error={errors.nationality?.message}>
                                        <option value="">Sélectionner...</option>
                                        {NATIONALITY_REGION_ORDER.map(region => (
                                            <optgroup key={region} label={region}>
                                                {NATIONALITIES_BY_REGION[region]?.map(n => (
                                                    <option key={n.value} value={n.label}>{n.label}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </Select>
                                </div>
                                <div>
                                    <Label>Téléphone</Label>
                                    <Input type="tel" {...register('phone')} placeholder="+225 ..." icon={Phone} error={errors.phone?.message} />
                                </div>
                                <div className="md:col-span-2">
                                    <Label required>Email professionnel</Label>
                                    <Input type="email" {...register('email')} placeholder="jean.kouassi@entreprise.com" error={errors.email?.message} icon={Mail} />
                                </div>
                                <div>
                                    <Label>Situation matrimoniale</Label>
                                    <Select {...register('marital_status')} icon={Heart} error={errors.marital_status?.message}>
                                        <option value="">Sélectionner...</option>
                                        {MARITAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </Select>
                                </div>
                                <div>
                                    <Label>Nombre d'enfants</Label>
                                    <Input type="number" min={0} {...register('children_count')} icon={UserPlus} error={errors.children_count?.message} />
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                );

            case 1:
                return (
                    <SectionCard title="Contrat & Poste" icon={Briefcase} color="emerald" description="Détails de l'embauche">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div>
                                <Label>Date d'entrée</Label>
                                <Input type="date" {...register('entry_date')} icon={Calendar} error={errors.entry_date?.message} />
                            </div>
                            <div>
                                <Label>Matricule Interne</Label>
                                <Input {...register('employee_id')} placeholder="KMB-2024-XXX" icon={ShieldCheck} error={errors.employee_id?.message} />
                            </div>
                            <div className="md:col-span-2 relative">
                                <Label required>Fonction / Poste occupé</Label>
                                <button
                                    type="button"
                                    onClick={() => setShowTitlePicker(!showTitlePicker)}
                                    className={clsx(
                                        "w-full bg-slate-50 rounded-[24px] px-6 py-4 text-sm text-left flex justify-between items-center transition-all outline-none ring-offset-0",
                                        showTitlePicker ? "ring-4 ring-emerald-500/10" : "",
                                        errors.job_title ? "ring-2 ring-rose-500/10" : "",
                                        jobTitle ? "font-black text-slate-900" : "text-slate-300 font-bold"
                                    )}
                                >
                                    {jobTitle || 'Rechercher une fonction...'}
                                    <ChevronDown size={18} className={clsx("transition-transform duration-300", showTitlePicker && "rotate-180")} />
                                </button>
                                <FieldError message={errors.job_title?.message} />

                                {showTitlePicker && (
                                    <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[32px] border border-slate-100 shadow-2xl z-[100] max-h-[400px] overflow-y-auto p-4 animate-in zoom-in-95 duration-200 no-scrollbar">
                                        {JOB_TITLES.map(cat => (
                                            <div key={cat.category} className="mb-6 last:mb-0">
                                                <p className="px-3 py-1 text-[9px] font-black text-emerald-600 uppercase tracking-[2px] mb-3">{cat.category}</p>
                                                <div className="grid grid-cols-1 gap-1">
                                                    {cat.titles.map(title => (
                                                        <button
                                                            key={title} type="button"
                                                            onClick={() => { setValue('job_title', title); setShowTitlePicker(false); }}
                                                            className={clsx(
                                                                "w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex justify-between items-center",
                                                                jobTitle === title ? "bg-slate-900 text-white font-black" : "text-slate-600 hover:bg-slate-50 font-bold"
                                                            )}
                                                        >
                                                            {title}
                                                            {jobTitle === title && <Check size={14} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label>Service / Département</Label>
                                <Select {...register('department')} icon={Building2} error={errors.department?.message}>
                                    <option value="">Sélectionner...</option>
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label>Catégorie / Grade</Label>
                                <Select {...register('category')} icon={Shield} error={errors.category?.message}>
                                    <option value="">Sélectionner...</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </Select>
                            </div>
                            <div className="md:col-span-2">
                                <Label>Salaire de base mensuel (Brut)</Label>
                                <div className="bg-slate-900 rounded-[32px] p-6 text-white flex items-center gap-6 shadow-xl shadow-slate-900/10">
                                    <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0">
                                        <Banknote size={28} />
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="number"
                                            {...register('base_salary')}
                                            className="w-full bg-transparent text-3xl font-black text-white outline-none placeholder:text-white/10 tracking-tighter"
                                            placeholder="0"
                                        />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-1">Francs CFA (XOF) / mois</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                );

            case 2:
                return (
                    <div className="space-y-8">
                        <SectionCard title="Formation Académique" icon={GraduationCap} color="blue">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label>Plus haut diplôme</Label>
                                    <Select {...register('education_level')} icon={GraduationCap} error={errors.education_level?.message}>
                                        <option value="">Sélectionner...</option>
                                        {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </Select>
                                </div>
                                <div>
                                    <Label>Spécialité / Domaine</Label>
                                    <Select {...register('education_field')} icon={Sparkles} error={errors.education_field?.message}>
                                        <option value="">Sélectionner...</option>
                                        {EDUCATION_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                                    </Select>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard title="Expériences Notables" icon={Briefcase} color="amber" description="Historique de carrière">
                            <div className="space-y-6">
                                {expFields.map((field, idx) => (
                                    <div key={field.id} className="bg-slate-50/50 rounded-[32px] p-8 border border-slate-100 relative group animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expérience #{idx + 1}</span>
                                            <button type="button" onClick={() => removeExp(idx)} className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <Label required>Entreprise</Label>
                                                <Input {...register(`experiences.${idx}.company`)} placeholder="Nom" error={errors.experiences?.[idx]?.company?.message} />
                                            </div>
                                            <div>
                                                <Label required>Poste</Label>
                                                <Input {...register(`experiences.${idx}.position`)} placeholder="Intitulé" error={errors.experiences?.[idx]?.position?.message} />
                                            </div>
                                            <div>
                                                <Label required>Année Début</Label>
                                                <Input {...register(`experiences.${idx}.start_year`)} placeholder="20XX" error={errors.experiences?.[idx]?.start_year?.message} />
                                            </div>
                                            <div>
                                                <Label>Année Fin</Label>
                                                <Input {...register(`experiences.${idx}.end_year`)} placeholder="20XX (ou présent)" error={errors.experiences?.[idx]?.end_year?.message} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => addExp({ company: '', position: '', start_year: '', end_year: '', current: false })}
                                    className="w-full py-6 rounded-[32px] border-2 border-dashed border-slate-100 text-slate-400 hover:border-amber-200 hover:bg-amber-50/50 hover:text-amber-600 transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3"
                                >
                                    <Plus size={18} />
                                    Ajouter une référence
                                </button>
                            </div>
                        </SectionCard>
                    </div>
                );

            case 3: // Terrain
                const resType = watch('field_resource.resource_type');
                return (
                    <SectionCard title="Équipe Terrain" icon={Globe} color="emerald" description="Gestion opérationnelle & missions">
                        <div className="space-y-10">
                            <label className={clsx(
                                "flex items-center justify-between p-8 rounded-[40px] border-2 transition-all cursor-pointer group shadow-xl",
                                isFieldActive ? "bg-emerald-600 border-emerald-600 shadow-emerald-600/20 text-white" : "bg-white border-slate-100 hover:border-emerald-100 shadow-slate-200/50"
                            )}>
                                <div className="flex items-center gap-6">
                                    <div className={clsx("h-16 w-16 rounded-3xl flex items-center justify-center transition-colors shadow-inner", isFieldActive ? "bg-white/20" : "bg-emerald-50 text-emerald-600")}>
                                        <Globe size={32} />
                                    </div>
                                    <div>
                                        <p className="text-xl font-black tracking-tight">Activer comme ressource terrain</p>
                                        <p className={clsx("text-xs font-bold mt-1", isFieldActive ? "text-white/60" : "text-slate-400 uppercase tracking-widest")}>Permet l'assignation aux missions, chantiers et stocks</p>
                                    </div>
                                </div>
                                <input type="checkbox" className="hidden" checked={isFieldActive} onChange={(e) => setIsFieldActive(e.target.checked)} />
                                <div className={clsx("h-8 w-14 rounded-full p-1 transition-colors relative", isFieldActive ? "bg-white" : "bg-slate-200")}>
                                    <div className={clsx("h-6 w-6 rounded-full transition-all shadow-sm", isFieldActive ? "translate-x-6 bg-emerald-600" : "translate-x-0 bg-white")} />
                                </div>
                            </label>

                            {isFieldActive && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div>
                                            <Label required>Type de ressource</Label>
                                            <Select {...register('field_resource.resource_type')} icon={UserPlus} error={errors.field_resource?.resource_type?.message}>
                                                <option value="INTERNAL">Employé interne</option>
                                                <option value="SUBCONTRACTOR">Sous-traitant</option>
                                                <option value="FREELANCE">Freelance / Contractuel</option>
                                                <option value="PARTNER">Équipe partenaire</option>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label required>Catégorie métier</Label>
                                            <Select {...register('field_resource.category')} icon={Briefcase} error={errors.field_resource?.category?.message}>
                                                <option value="">Sélectionner...</option>
                                                {FIELD_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Spécialité</Label>
                                            <Input {...register('field_resource.specialty')} placeholder="Ex: Fibre Optique" icon={Sparkles} error={errors.field_resource?.specialty?.message} />
                                        </div>
                                    </div>

                                    {resType !== 'INTERNAL' && (
                                        <div className="bg-slate-900/5 rounded-[40px] p-8 border border-slate-200 space-y-8 animate-in zoom-in-95 duration-300">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Informations Contractuelles Externe</h4>
                                            </div>
                                            
                                            {resType === 'SUBCONTRACTOR' || resType === 'PARTNER' ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <Label>Société Partenaire</Label>
                                                        <Input {...register('field_resource.contractor_company')} placeholder="Nom de l'entreprise" icon={Building2} error={errors.field_resource?.contractor_company?.message} />
                                                    </div>
                                                    <div>
                                                        <Label>Référence Contrat</Label>
                                                        <Input {...register('field_resource.contract_reference')} placeholder="REF-202X-..." icon={FileText} error={errors.field_resource?.contract_reference?.message} />
                                                    </div>
                                                    <div>
                                                        <Label>Contact Responsable</Label>
                                                        <Input {...register('field_resource.contact_person')} placeholder="Nom complet" icon={User} error={errors.field_resource?.contact_person?.message} />
                                                    </div>
                                                    <div>
                                                        <Label>Téléphone Contact</Label>
                                                        <Input {...register('field_resource.contact_phone')} placeholder="+225..." icon={Phone} error={errors.field_resource?.contact_phone?.message} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <Label>Mode de Paiement</Label>
                                                        <Select {...register('field_resource.payment_mode')} icon={Banknote} error={errors.field_resource?.payment_mode?.message}>
                                                            <option value="MOBILE_MONEY">Mobile Money</option>
                                                            <option value="CASH">Espèces</option>
                                                            <option value="TRANSFER">Virement</option>
                                                            <option value="CHEQUE">Chèque</option>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label>Tarif Journalier (XOF)</Label>
                                                        <Input type="number" {...register('field_resource.daily_rate')} placeholder="0" icon={Banknote} error={errors.field_resource?.daily_rate?.message} />
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/50">
                                                <div>
                                                    <Label>Date Début Contrat</Label>
                                                    <Input type="date" {...register('field_resource.contract_start_date')} icon={Calendar} error={errors.field_resource?.contract_start_date?.message} />
                                                </div>
                                                <div>
                                                    <Label>Date Fin Contrat</Label>
                                                    <Input type="date" {...register('field_resource.contract_end_date')} icon={Calendar} error={errors.field_resource?.contract_end_date?.message} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <Label>Zone d'affectation</Label>
                                            <Input {...register('field_resource.zone')} placeholder="Ex: Abidjan Sud" icon={MapPin} error={errors.field_resource?.zone?.message} />
                                        </div>
                                        <div>
                                            <Label>Mobilité</Label>
                                            <Select {...register('field_resource.mobility')} error={errors.field_resource?.mobility?.message}>
                                                <option value="LOCAL">Locale uniquement</option>
                                                <option value="REGIONAL">Régionale</option>
                                                <option value="NATIONAL">Grands Déplacements</option>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/50 rounded-[40px] p-10 border border-slate-100">
                                        <Label>Capacités & Habilitations opérationnelles</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                                            {[
                                                { id: 'can_drive', name: 'Peut conduire', icon: Truck },
                                                { id: 'can_handle_inventory', name: 'Gérer matériel', icon: Box },
                                                { id: 'can_receive_inventory', name: 'Recevoir matériel', icon: Download },
                                                { id: 'can_approve_inventory', name: 'Valider sorties', icon: ShieldCheck },
                                                { id: 'can_sign_delivery', name: 'Signer bons BL', icon: FileText },
                                                { id: 'can_lead_team', name: 'Superviser équipe', icon: Users },
                                                { id: 'can_close_mission', name: 'Clôturer mission', icon: Check },
                                            ].map(cap => (
                                                <label key={cap.id} className={clsx(
                                                    "flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white group hover:shadow-lg",
                                                    watch(`field_resource.${cap.id}`) ? "border-emerald-500 shadow-emerald-500/10" : "border-transparent hover:border-slate-100"
                                                )}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={clsx("h-10 w-10 rounded-2xl flex items-center justify-center transition-colors", watch(`field_resource.${cap.id}`) ? "bg-emerald-600 text-white shadow-lg" : "bg-slate-50 text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-400")}>
                                                            <cap.icon size={20} />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-600">{cap.name}</span>
                                                    </div>
                                                    <input type="checkbox" className="hidden" {...register(`field_resource.${cap.id}`)} />
                                                    <div className={clsx("h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all", watch(`field_resource.${cap.id}`) ? "bg-emerald-600 border-emerald-600" : "border-slate-100")}>
                                                        {watch(`field_resource.${cap.id}`) && <Check size={12} className="text-white" strokeWidth={4} />}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                );

            case 4:
                return (
                    <div className="space-y-8">
                        <SectionCard title="Administration RH" icon={Building2} color="slate">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <Label>Immatriculation CNPS</Label>
                                    <Input {...register('cnps_number')} placeholder="Numéro de sécurité sociale" icon={ShieldCheck} error={errors.cnps_number?.message} />
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard title="Contacts d'Urgence" icon={Heart} color="rose">
                            <div className="space-y-6">
                                {emergencyFields.map((field, idx) => (
                                    <div key={field.id} className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 relative">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Référent #{idx + 1}</span>
                                            {emergencyFields.length > 1 && (
                                                <button type="button" onClick={() => removeEmergency(idx)} className="text-rose-300 hover:text-rose-600 transition-colors">
                                                    <Trash size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <Label required>Nom complet</Label>
                                                <Input {...register(`emergency_contacts.${idx}.name`)} placeholder="Nom" error={errors.emergency_contacts?.[idx]?.name?.message} />
                                            </div>
                                            <div>
                                                <Label required>Téléphone</Label>
                                                <Input {...register(`emergency_contacts.${idx}.phone`)} placeholder="N° Mobile" error={errors.emergency_contacts?.[idx]?.phone?.message} />
                                            </div>
                                            <div>
                                                <Label>Lien / Relation</Label>
                                                <Input {...register(`emergency_contacts.${idx}.relation`)} placeholder="Ex: Épouse" error={errors.emergency_contacts?.[idx]?.relation?.message} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {emergencyFields.length < 3 && (
                                    <button
                                        type="button"
                                        onClick={() => addEmergency({ name: '', phone: '', relation: '' })}
                                        className="w-full py-6 rounded-[32px] border-2 border-dashed border-slate-100 text-slate-400 hover:border-rose-200 hover:bg-rose-50/50 hover:text-rose-600 transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3"
                                    >
                                        <Plus size={18} />
                                        Ajouter un contact
                                    </button>
                                )}
                            </div>
                        </SectionCard>
                    </div>
                );

            case 5:
                return (
                    <SectionCard title="Dossier Documentaire" icon={FileText} color="blue" description="Pièces justificatives numérisées">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                            <DocUploader label="CV / Résumé" file={cvFile} setFile={setCvFile} icon={<FileText size={20} />} />
                            <DocUploader label="Extrait Naissance" file={birthCertFile} setFile={setBirthCertFile} icon={<File size={20} />} />
                            <DocUploader label="Pièce d'Identité" file={idFile} setFile={setIdFile} icon={<Shield size={20} />} />
                        </div>

                        <div className="border-t border-slate-50 pt-10">
                            <Label>Autres pièces (Diplômes, Certificats, Contrats...)</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                {otherDocs.map((doc, idx) => (
                                    <div key={idx} className="bg-white border border-slate-100 p-5 rounded-[28px] flex items-center justify-between group hover:shadow-lg transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{doc.name}</p>
                                                <p className="text-[10px] font-black uppercase text-indigo-500 mt-0.5">{doc.type}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setOtherDocs(docs => docs.filter((_, i) => i !== idx))} className="p-2 text-slate-200 hover:text-rose-500 transition-colors">
                                            <Trash size={18} />
                                        </button>
                                    </div>
                                ))}

                                <div className="md:col-span-2 bg-slate-50/50 rounded-[40px] p-8 border-2 border-dashed border-slate-100">
                                    <div className="flex flex-col md:flex-row gap-4 items-end">
                                        <div className="flex-1 w-full">
                                            <Label>Libellé du document</Label>
                                            <Input value={newDocTitle} onChange={(e: any) => setNewDocTitle(e.target.value)} placeholder="Ex: Master II - Marketing" />
                                        </div>
                                        <div className="flex-1 w-full">
                                            <Label>Catégorie</Label>
                                            <Select value={newDocType} onChange={(e: any) => setNewDocType(e.target.value)}>
                                                <option value="DIPLOMA">Diplôme</option>
                                                <option value="CONTRACT">Contrat</option>
                                                <option value="CERTIFICATE">Certificat</option>
                                                <option value="OTHER">Autre</option>
                                            </Select>
                                        </div>
                                        <label className="bg-indigo-600 text-white px-8 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95 h-[52px] whitespace-nowrap">
                                            <UploadCloud size={16} /> Ajouter
                                            <input type="file" className="hidden" onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f) {
                                                    setOtherDocs(p => [...p, { name: newDocTitle || f.name, file: f, type: newDocType }]);
                                                    setNewDocTitle('');
                                                }
                                            }} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                );

            case 6:
                return (
                    <SectionCard title="Permissions & Rôles" icon={Shield} color="blue" description="Accès au système OurSpace">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                            {ROLES.map(role => (
                                <button
                                    key={role.value} type="button"
                                    onClick={() => setValue('role', role.value as any)}
                                    className={clsx(
                                        "p-6 rounded-[32px] border-2 text-left transition-all relative group",
                                        watch('role') === role.value
                                            ? "bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-900/20 scale-[1.02]"
                                            : "bg-white border-slate-50 hover:border-slate-100"
                                    )}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <div className={clsx("h-10 w-10 rounded-2xl flex items-center justify-center", watch('role') === role.value ? "bg-white/10" : "bg-slate-50")}>
                                            <Shield size={20} className={watch('role') === role.value ? "text-white" : "text-slate-400"} />
                                        </div>
                                        {watch('role') === role.value && <div className="h-5 w-5 bg-indigo-500 rounded-full flex items-center justify-center animate-in zoom-in-50"><Check size={12} strokeWidth={4} /></div>}
                                    </div>
                                    <p className="font-black text-sm tracking-tight">{role.label}</p>
                                    <p className={clsx("text-[10px] mt-1 font-bold", watch('role') === role.value ? "text-white/40" : "text-slate-400")}>{role.desc}</p>
                                </button>
                            ))}
                        </div>

                        <div className="bg-slate-50/50 rounded-[40px] p-8 lg:p-10 border border-slate-100">
                            <Label>Modules & Fonctionnalités Dédiées</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                                {[
                                    { id: 'HR_MANAGER', name: 'Ressources Humaines', icon: User },
                                    { id: 'FINANCE', name: 'Finance & Trésorerie', icon: Banknote },
                                    { id: 'PROJECT_MANAGER', name: 'Gestion de Projets', icon: Briefcase },
                                    { id: 'OPERATOR_MANAGER', name: 'Opérations & Stocks', icon: Sparkles },
                                    { id: 'AUDITOR', name: 'Audit & Rapports', icon: FileText },
                                    { id: 'ADMINISTRATOR', name: 'Administration', icon: ShieldCheck }
                                ].map(f => (
                                    <label key={f.id} className={clsx(
                                        "flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer group",
                                        watch('groups')?.includes(f.id) ? "bg-white border-indigo-500 shadow-xl shadow-indigo-500/10" : "bg-white border-transparent hover:border-slate-100"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className={clsx("h-10 w-10 rounded-2xl flex items-center justify-center transition-colors", watch('groups')?.includes(f.id) ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-300")}>
                                                <f.icon size={20} />
                                            </div>
                                            <span className={clsx("text-xs font-black", watch('groups')?.includes(f.id) ? "text-indigo-900" : "text-slate-600")}>{f.name}</span>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={watch('groups')?.includes(f.id)} onChange={(e) => {
                                            const curr = watch('groups') || [];
                                            setValue('groups', e.target.checked ? [...curr, f.id] : curr.filter(g => g !== f.id));
                                        }} />
                                        <div className={clsx("h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all", watch('groups')?.includes(f.id) ? "bg-indigo-600 border-indigo-600" : "border-slate-100")}>
                                            {watch('groups')?.includes(f.id) && <Check size={12} className="text-white" strokeWidth={4} />}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </SectionCard>
                );

            case 7:
                return (
                    <SectionCard title="Vérification Finale" icon={Check} color="emerald" description="Récapitulatif avant confirmation">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <ReviewSection title="Identité Civile">
                                    <ReviewItem label="Nom Complet" value={`${getValues('first_name')} ${getValues('last_name')}`} />
                                    <ReviewItem label="Email" value={getValues('email')} />
                                    <ReviewItem label="Téléphone" value={getValues('phone')} />
                                </ReviewSection>
                                <ReviewSection title="Poste & Contrat">
                                    <ReviewItem label="Fonction" value={getValues('job_title')} />
                                    <ReviewItem label="Département" value={getValues('department')} />
                                    <ReviewItem label="Salaire" value={formatCurrency(Number(getValues('base_salary')))} />
                                </ReviewSection>
                            </div>
                            <div className="space-y-8">
                                <ReviewSection title="Accès Système">
                                    <ReviewItem label="Rôle Principal" value={ROLES.find(r => r.value === getValues('role'))?.label} />
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {(watch('groups') || []).map(g => (
                                            <span key={g} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">{g.replace('_', ' ')}</span>
                                        ))}
                                    </div>
                                </ReviewSection>
                                <ReviewSection title="Dossier Documentaire">
                                    <div className="flex flex-wrap gap-2">
                                        {cvFile && <DocTag label="CV" color="indigo" />}
                                        {birthCertFile && <DocTag label="Extrait" color="emerald" />}
                                        {idFile && <DocTag label="ID" color="blue" />}
                                        {otherDocs.length > 0 && <DocTag label={`+${otherDocs.length} Pièces`} color="slate" />}
                                    </div>
                                </ReviewSection>
                            </div>
                        </div>

                        {isFieldActive && (
                            <div className="mt-12 pt-12 border-t border-slate-100">
                                <ReviewSection title="Spécificités Terrain">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <ReviewItem label="Type Ressource" value={getValues('field_resource.resource_type')} />
                                        <ReviewItem label="Catégorie" value={FIELD_CATEGORIES.find(c => c.value === getValues('field_resource.category'))?.label} />
                                        <ReviewItem label="Zone / Mobilité" value={`${getValues('field_resource.zone') || 'N/A'} (${getValues('field_resource.mobility')})`} />
                                    </div>
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {getValues('field_resource.can_drive') && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">Permis / Conduite</span>}
                                        {getValues('field_resource.can_handle_inventory') && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">Gestion Matériel</span>}
                                        {getValues('field_resource.can_lead_team') && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">Chef d'Équipe</span>}
                                    </div>
                                </ReviewSection>
                            </div>
                        )}

                        <div className="mt-12 p-8 bg-amber-50 rounded-[40px] border border-amber-100 flex items-start gap-4">
                            <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                                <Info size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-amber-900 tracking-tight">Prêt pour l'onboarding ?</p>
                                <p className="text-xs text-amber-700 font-medium leading-relaxed mt-1">En validant, le profil sera créé instantanément. L'employé pourra se connecter avec ses accès professionnels.</p>
                            </div>
                        </div>
                    </SectionCard>
                );
            default: return null;
        }
    };

    return (
        <DashboardLayout>
            {loading && (
                <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-white p-12 rounded-[48px] shadow-2xl flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="h-20 w-20 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <UserPlus className="text-emerald-600 animate-pulse" size={32} />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Finalisation de l'Onboarding</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Création du profil & Envoi des documents...</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto space-y-10 pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <button onClick={() => router.back()} className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest mb-4">
                            <ArrowLeft size={14} /> {t('common.back')}
                        </button>
                        <h1 className={clsx("text-4xl font-black text-slate-900 tracking-tight", displayFont.className)}>Nouvel Onboarding</h1>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Étape {currentStep + 1} sur {STEPS.length} : {STEPS[currentStep].label}</p>
                    </div>
                    <button
                        onClick={() => setShowConfirmReset(true)}
                        className="px-6 py-3 bg-white border border-rose-100 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2"
                    >
                        <Trash2 size={14} /> Vider le formulaire
                    </button>
                </div>

                <ConfirmModal
                    isOpen={showConfirmReset}
                    onClose={() => setShowConfirmReset(false)}
                    onConfirm={clearForm}
                    title="Réinitialisation"
                    message="Voulez-vous vraiment vider tout le formulaire et repartir à zéro ? Toutes les données non enregistrées seront perdues."
                    confirmLabel="Oui, vider tout"
                    cancelLabel="Annuler"
                    variant="danger"
                />

                {/* Stepper Progress */}
                <div className="bg-white p-2 rounded-[32px] border border-slate-100 shadow-sm flex overflow-x-auto no-scrollbar">
                    {STEPS.map((step, idx) => (
                        <div key={step.id} className="flex-1 min-w-[120px] relative">
                            <button
                                onClick={() => idx < currentStep && setCurrentStep(idx)}
                                className={clsx(
                                    "w-full flex flex-col items-center gap-2 py-4 rounded-[28px] transition-all",
                                    idx === currentStep ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20" :
                                        idx < currentStep ? "text-emerald-600" : "text-slate-300"
                                )}
                            >
                                <div className={clsx("h-8 w-8 rounded-xl flex items-center justify-center",
                                    idx === currentStep ? "bg-white/10" : idx < currentStep ? "bg-emerald-50" : "bg-slate-50"
                                )}>
                                    {idx < currentStep ? <Check size={16} strokeWidth={4} /> : <step.icon size={16} />}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                            </button>
                        </div>
                    ))}
                </div>

                <div className="min-h-[500px]">
                    {renderStep()}
                </div>

                <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className="px-8 py-4 rounded-2xl border border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 disabled:opacity-0 transition-all"
                    >
                        Précédent
                    </button>

                    <div className="flex gap-4">
                        {currentStep === STEPS.length - 1 ? (
                            <button
                                onClick={handleSubmit(onSubmit)}
                                disabled={loading}
                                className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-900/20 flex items-center gap-3 transition-all"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                                Confirmer l'onboarding
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-900/20 flex items-center gap-3 transition-all"
                            >
                                Suivant
                                <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function DocUploader({ label, file, setFile, icon }: any) {
    return (
        <div className="space-y-3">
            <Label>{label}</Label>
            <label className={clsx(
                "block p-6 rounded-[32px] border-2 border-dashed text-center cursor-pointer transition-all h-full min-h-[160px] flex flex-col items-center justify-center gap-4",
                file ? "bg-indigo-50/50 border-indigo-200" : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
            )}>
                <div className={clsx("h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors", file ? "bg-white text-indigo-600" : "bg-white text-slate-300")}>
                    {file ? <Check size={24} strokeWidth={4} /> : icon}
                </div>
                <div className="space-y-1">
                    <p className={clsx("text-xs font-black tracking-tight", file ? "text-indigo-900" : "text-slate-400")}>{file ? file.name : 'Choisir un fichier'}</p>
                    {!file && <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">PDF, Image · Max 10Mo</p>}
                </div>
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
        </div>
    );
}

function ReviewSection({ title, children }: any) {
    return (
        <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] border-b border-slate-50 pb-2">{title}</h4>
            <div className="grid grid-cols-1 gap-4">{children}</div>
        </div>
    );
}

function ReviewItem({ label, value }: any) {
    return (
        <div className="flex justify-between items-end border-b border-slate-50 pb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
            <span className="text-sm font-black text-slate-900">{value || '—'}</span>
        </div>
    );
}

function DocTag({ label, color }: any) {
    return (
        <span className={clsx("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-2",
            color === 'indigo' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-slate-50 text-slate-600 border-slate-100'
        )}>
            <div className="w-1 h-1 rounded-full bg-current" />
            {label}
        </span>
    );
}
