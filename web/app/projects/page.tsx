'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/app/dashboard-layout';
import {
    MapPin, Calendar, Users, Package, TrendingUp, 
    Plus, Search, Filter, MoreHorizontal, ArrowRight,
    Clock, CheckCircle2, AlertCircle, HardHat, Construction,
    Wrench, Radio, LayoutGrid, List, XCircle, ArrowUpDown,
    UserCircle, Check, Trash2, PlusCircle, History,
    ChevronRight, ArrowLeft, Download, Layout, Settings
} from 'lucide-react';
import clsx from 'clsx';
import { getWorkSites, createWorkSite, getProducts, recordMovement, getEmployees, getInventoryMovements, getFieldResources } from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Outfit } from 'next/font/google';
import toast from 'react-hot-toast';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function ProjectsPage() {
    const [sites, setSites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [assigningStockSite, setAssigningStockSite] = useState<any | null>(null);
    const [viewingDetailsSite, setViewingDetailsSite] = useState<any | null>(null);
    const [editingSite, setEditingSite] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getWorkSites();
            setSites(data);
        } catch (err) {
            console.error("Failed to fetch work sites", err);
            setSites([
                { id: 1, name: "Extension Fibre - Zone A", location: "Dakar Plateau", status: "ACTIVE", manager_name: "Moussa Diop", start_date: "2024-03-01", progress: 65, project_type: "TELECOM" },
                { id: 2, name: "Construction Résidence 'Le Phare'", location: "Almadies", status: "ACTIVE", manager_name: "Aicha Koné", start_date: "2024-01-15", progress: 40, project_type: "BTP" },
                { id: 3, name: "Installation Solaire École B", location: "Thiès", status: "PLANNING", manager_name: "Omar Sy", start_date: "2024-05-10", progress: 0, project_type: "ENERGY" },
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredSites = sites.filter(site => 
        site.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.manager_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-1">
                        <h1 className={clsx("text-4xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            Projets & Chantiers
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-[3px]">
                            Gestion du Terrain & Logistique Opérationnelle
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-slate-900 text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all active:scale-95"
                        >
                            <Plus size={18} />
                            Nouveau Chantier
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher un projet, un lieu ou un responsable..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        />
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={clsx(
                                "p-4 rounded-[20px] transition-all",
                                viewMode === 'grid' ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                            )}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={clsx(
                                "p-4 rounded-[20px] transition-all",
                                viewMode === 'list' ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                            )}
                        >
                            <List size={20} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="h-12 w-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className={clsx(
                        viewMode === 'grid' 
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
                            : "space-y-4"
                    )}>
                        {filteredSites.map(site => (
                            viewMode === 'grid' ? (
                                <ProjectCard 
                                    key={site.id} 
                                    site={site} 
                                    onAssign={() => setAssigningStockSite(site)}
                                    onDetails={() => setViewingDetailsSite(site)}
                                    onEdit={() => {
                                        setEditingSite(site);
                                        setIsEditModalOpen(true);
                                    }}
                                />
                            ) : (
                                <ProjectRow 
                                    key={site.id} 
                                    site={site} 
                                    onAssign={() => setAssigningStockSite(site)}
                                    onDetails={() => setViewingDetailsSite(site)}
                                    onEdit={() => {
                                        setEditingSite(site);
                                        setIsEditModalOpen(true);
                                    }}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>

            {isAddModalOpen && (
                <AddProjectModal 
                    onClose={() => setIsAddModalOpen(false)} 
                    onSuccess={() => {
                        setIsAddModalOpen(false);
                        fetchData();
                    }} 
                />
            )}

            {isEditModalOpen && editingSite && (
                <EditProjectModal 
                    site={editingSite}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingSite(null);
                    }} 
                    onSuccess={() => {
                        setIsEditModalOpen(false);
                        setEditingSite(null);
                        fetchData();
                    }} 
                />
            )}

            {assigningStockSite && (
                <StockAssignmentModal
                    site={assigningStockSite}
                    onClose={() => setAssigningStockSite(null)}
                    onSuccess={() => {
                        setAssigningStockSite(null);
                        toast.success("Tout le matériel a été affecté au chantier");
                    }}
                />
            )}

            {viewingDetailsSite && (
                <ProjectDetailsModal
                    site={viewingDetailsSite}
                    onClose={() => setViewingDetailsSite(null)}
                />
            )}
        </DashboardLayout>
    );
}

function ProjectRow({ site, onAssign, onDetails, onEdit }: { site: any, onAssign: () => void, onDetails: () => void, onEdit: () => void }) {
    const { format } = require('date-fns');
    const { fr } = require('date-fns/locale');

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-600';
            case 'PLANNING': return 'bg-amber-50 text-amber-600';
            case 'COMPLETED': return 'bg-slate-50 text-slate-400';
            default: return 'bg-rose-50 text-rose-600';
        }
    };

    return (
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/30 transition-all group flex flex-col md:flex-row items-center gap-8">
            <div className={clsx("p-4 rounded-2xl shrink-0", 
                site.project_type === 'TELECOM' ? 'bg-indigo-50 text-indigo-600' : 
                site.project_type === 'BTP' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            )}>
                {site.project_type === 'TELECOM' ? <Radio size={20} /> : site.project_type === 'BTP' ? <HardHat size={20} /> : <TrendingUp size={20} />}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
                <h3 className={clsx("text-lg font-black text-slate-900 truncate", displayFont.className)}>{site.name}</h3>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><MapPin size={12} className="text-indigo-500" /> {site.location || 'Abidjan'}</span>
                    <span className="flex items-center gap-1.5"><Users size={12} className="text-slate-300" /> {site.manager_name}</span>
                </div>
            </div>

            <div className="w-48 space-y-2 shrink-0">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <span>Progression</span>
                    <span className="text-indigo-600">{site.progress || 0}%</span>
                </div>
                <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${site.progress || 0}%` }} />
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                <button onClick={onAssign} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Affecter Stock">
                    <Package size={18} />
                </button>
                <button onClick={onDetails} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="Détails">
                    <Layout size={18} />
                </button>
                <button onClick={onEdit} className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm" title="Modifier">
                    <Settings size={18} />
                </button>
            </div>
        </div>
    );
}

function ProjectCard({ site, onAssign, onDetails, onEdit }: { site: any, onAssign: () => void, onDetails: () => void, onEdit: () => void }) {
    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'PLANNING': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'ON_HOLD': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'COMPLETED': return 'bg-slate-50 text-slate-500 border-slate-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'TELECOM': return <Radio size={24} />;
            case 'BTP': return <Construction size={24} />;
            case 'ENERGY': return <TrendingUp size={24} />;
            default: return <HardHat size={24} />;
        }
    };

    return (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/40 transition-all group overflow-hidden flex flex-col">
            <div className="p-8 space-y-8 flex-grow">
                <div className="flex justify-between items-start">
                    <div className={clsx("p-4 rounded-[20px] transition-all", 
                        site.project_type === 'TELECOM' ? 'bg-indigo-50 text-indigo-600' : 
                        site.project_type === 'BTP' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    )}>
                        {getTypeIcon(site.project_type)}
                    </div>
                    <span className={clsx("px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[2px] border", getStatusStyles(site.status))}>
                        {site.status === 'ACTIVE' ? 'En cours' : site.status === 'PLANNING' ? 'Planification' : site.status === 'COMPLETED' ? 'Terminé' : 'Suspendu'}
                    </span>
                </div>

                <div className="space-y-2">
                    <h3 className={clsx("text-xl font-black text-slate-900 tracking-tight", displayFont.className)}>{site.name}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <MapPin size={14} className="text-indigo-500" />
                        {site.location || 'Localisation non définie'}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50/50 rounded-2xl space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsable</p>
                        <p className="text-xs font-bold text-slate-900">{site.manager_name || 'Non assigné'}</p>
                    </div>
                    <div className="p-4 bg-slate-50/50 rounded-2xl space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Début</p>
                        <p className="text-xs font-bold text-slate-900">
                            {site.start_date ? (
                                (() => {
                                    const d = new Date(site.start_date);
                                    return isNaN(d.getTime()) ? 'Date invalide' : format(d, 'dd MMM yyyy', { locale: fr });
                                })()
                            ) : 'Non définie'}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span>Progression</span>
                        <span className="text-indigo-600">{site.progress || 0}%</span>
                    </div>
                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                        <div 
                            className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                            style={{ width: `${site.progress || 0}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center mt-auto">
                <button 
                    onClick={onAssign}
                    className="flex items-center gap-2 text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest"
                >
                    <Package size={14} /> Stock
                </button>
                <div className="w-px h-4 bg-slate-200" />
                <button 
                    onClick={onDetails}
                    className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
                >
                    <Layout size={14} /> Détails
                </button>
                <div className="w-px h-4 bg-slate-200" />
                <button 
                    onClick={onEdit}
                    className="flex items-center gap-2 text-[10px] font-black text-amber-600 hover:text-amber-800 transition-colors uppercase tracking-widest"
                >
                    <Settings size={14} /> Modifier
                </button>
            </div>
        </div>
    );
}

function EditProjectModal({ site, onClose, onSuccess }: { site: any, onClose: () => void, onSuccess: () => void }) {
    const [submitting, setSubmitting] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchManager, setSearchManager] = useState(site.manager_name || '');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        name: site.name || '',
        project_type: site.project_type || 'TELECOM',
        start_date: site.start_date || '',
        status: site.status || 'ACTIVE',
        manager_name: site.manager_name || '',
        progress: site.progress || 0,
        teams: site.teams || []
    });

    useEffect(() => {
        const loadEmployees = async () => {
            const data = await getEmployees();
            setEmployees(data);
        };
        loadEmployees();

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredPMs = employees.filter(emp => {
        const name = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
        const search = searchManager.toLowerCase();
        const isPM = !emp.position?.toLowerCase().includes('terrain') && 
                     !emp.position?.toLowerCase().includes('technicien') &&
                     !emp.position?.toLowerCase().includes('field');
        return name.includes(search) && isPM;
    });

    const fieldEmployees = employees.filter(emp => 
        emp.position?.toLowerCase().includes('terrain') || 
        emp.position?.toLowerCase().includes('technicien') ||
        emp.position?.toLowerCase().includes('field') ||
        emp.department === 'FIELD'
    );

    const handleAddTeam = () => {
        setFormData({
            ...formData,
            teams: [...formData.teams, { name: '', leader_id: '', member_ids: [] }]
        });
    };

    const handleRemoveTeam = (index: number) => {
        const newTeams = [...formData.teams];
        newTeams.splice(index, 1);
        setFormData({ ...formData, teams: newTeams });
    };

    const handleUpdateTeam = (index: number, field: string, value: any) => {
        const newTeams = [...formData.teams];
        newTeams[index] = { ...newTeams[index], [field]: value };
        setFormData({ ...formData, teams: newTeams });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await updateWorkSite(site.id, formData);
            toast.success("Projet mis à jour avec succès");
            onSuccess();
        } catch (err: any) {
            console.error("Failed to update project", err);
            const errorMsg = err.response?.data?.detail || "Erreur lors de la mise à jour";
            toast.error(typeof errorMsg === 'string' ? errorMsg : "Données invalides (422)");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[48px] w-full max-w-2xl max-h-[95vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col">
                <div className="p-12 space-y-10 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h2 className={clsx("text-3xl font-black text-slate-900", displayFont.className)}>Modifier le Projet</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Édition du chantier: {site.name}</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du Projet</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secteur / Type</label>
                                <select
                                    value={formData.project_type}
                                    onChange={e => setFormData({ ...formData, project_type: e.target.value })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner appearance-none"
                                >
                                    <option value="BTP">BTP & Génie Civil</option>
                                    <option value="TELECOM">Télécommunications</option>
                                    <option value="ENERGY">Énergie / Solaire</option>
                                    <option value="SERVICE">Services / Maintenance</option>
                                </select>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date de démarrage</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.start_date}
                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Statut</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner appearance-none"
                                >
                                    <option value="ACTIVE">En cours</option>
                                    <option value="PLANNING">Planification</option>
                                    <option value="ON_HOLD">En pause</option>
                                    <option value="COMPLETED">Terminé</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Progression ({formData.progress}%)</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={formData.progress}
                                    onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            <div className="space-y-3 md:col-span-2 relative" ref={dropdownRef}>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chef de Projet / Responsable (PM)</label>
                                <div className="relative group">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input
                                        required
                                        value={formData.manager_name || searchManager}
                                        onChange={e => {
                                            setSearchManager(e.target.value);
                                            setFormData({ ...formData, manager_name: e.target.value });
                                            setIsDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsDropdownOpen(true)}
                                        className="w-full pl-14 pr-6 py-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                    />
                                    {isDropdownOpen && (filteredPMs.length > 0 || searchManager) && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[32px] shadow-2xl border border-slate-100 py-4 z-50 max-h-60 overflow-y-auto">
                                            {filteredPMs.length > 0 ? (
                                                filteredPMs.map(emp => (
                                                    <button
                                                        key={emp.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const name = `${emp.first_name} ${emp.last_name}`;
                                                            setFormData({ ...formData, manager_name: name });
                                                            setSearchManager(name);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className="w-full px-8 py-4 text-left hover:bg-slate-50 flex items-center justify-between group/item"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center font-bold text-xs">
                                                                {emp.first_name?.[0]}{emp.last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900">{emp.first_name} {emp.last_name}</p>
                                                            </div>
                                                        </div>
                                                        {formData.manager_name === `${emp.first_name} ${emp.last_name}` && <Check className="text-indigo-600" size={16} />}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-8 py-4 text-xs font-bold text-slate-400 italic">
                                                    Aucun profil administratif trouvé.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6 md:col-span-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Équipes de Terrain Affectées</label>
                                    <button
                                        type="button"
                                        onClick={handleAddTeam}
                                        className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2"
                                    >
                                        <PlusCircle size={14} /> Ajouter une Équipe
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {formData.teams.map((team, tIndex) => (
                                        <div key={tIndex} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[1px] ml-1">Nom de l'équipe</label>
                                                    <input
                                                        value={team.name}
                                                        onChange={e => handleUpdateTeam(tIndex, 'name', e.target.value)}
                                                        className="w-full p-4 bg-white border-none rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTeam(tIndex)}
                                                    className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-indigo-600 uppercase tracking-[1px] ml-1">Team Leader (TL)</label>
                                                    <select
                                                        value={team.leader_id}
                                                        onChange={e => handleUpdateTeam(tIndex, 'leader_id', e.target.value)}
                                                        className="w-full p-4 bg-white border-none rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                                    >
                                                        <option value="">Sélectionner le chef d'équipe...</option>
                                                        {fieldEmployees.map(emp => (
                                                            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[1px] ml-1">Membres</label>
                                                    <div className="p-4 bg-white rounded-2xl max-h-32 overflow-y-auto shadow-inner space-y-2">
                                                        {fieldEmployees
                                                            .filter(emp => String(emp.id) !== String(team.leader_id))
                                                            .map(emp => (
                                                                <label key={emp.id} className="flex items-center gap-2 cursor-pointer group">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={team.member_ids.includes(emp.id)}
                                                                        onChange={e => {
                                                                            const ids = e.target.checked
                                                                                ? [...team.member_ids, emp.id]
                                                                                : team.member_ids.filter(id => id !== emp.id);
                                                                            handleUpdateTeam(tIndex, 'member_ids', ids);
                                                                        }}
                                                                        className="rounded-lg border-slate-200 text-indigo-600"
                                                                    />
                                                                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
                                                                        {emp.first_name} {emp.last_name}
                                                                    </span>
                                                                </label>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 p-6 bg-slate-50 text-slate-500 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-[2] p-6 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all disabled:opacity-50"
                            >
                                {submitting ? "Mise à jour..." : "Enregistrer les modifications"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function AddProjectModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        name: '',
        manager_name: '',
        project_type: 'BTP',
        start_date: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        progress: 0,
        latitude: null,
        longitude: null,
        radius: 200,
        teams: [] as { name: string; leader_id: string; member_ids: number[] }[]
    });
    const [employees, setEmployees] = useState<any[]>([]);
    const [searchManager, setSearchManager] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await getEmployees();
                setEmployees(data);
            } catch (err) {
                console.error("Failed to fetch employees", err);
            }
        };
        fetchEmployees();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddTeam = () => {
        setFormData({
            ...formData,
            teams: [...formData.teams, { name: '', leader_id: '', member_ids: [] }]
        });
    };

    const handleRemoveTeam = (index: number) => {
        setFormData({
            ...formData,
            teams: formData.teams.filter((_, i) => i !== index)
        });
    };

    const handleUpdateTeam = (index: number, field: string, value: any) => {
        const newTeams = [...formData.teams];
        newTeams[index] = { ...newTeams[index], [field]: value };
        setFormData({ ...formData, teams: newTeams });
    };

    // Filter for Project Managers (PM) - Administrative/Management only
    const filteredPMs = employees.filter(emp => {
        const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
        const searchMatch = fullName.includes(searchManager.toLowerCase());
        
        const isFieldDept = emp.department?.toUpperCase() === 'FIELD' || 
                           emp.department?.toLowerCase().includes('terrain') || 
                           emp.department?.toLowerCase().includes('chantier');
        
        const isFieldPosition = emp.position?.toLowerCase().includes('equipe') || 
                               emp.position?.toLowerCase().includes('terrain') ||
                               emp.position?.toLowerCase().includes('ouvrier') ||
                               emp.position?.toLowerCase().includes('technicien');

        return searchMatch && !isFieldDept && !isFieldPosition;
    });

    // Filter for Field Team (TL and Members) - Field/Technical only
    const fieldEmployees = employees.filter(emp => {
        const isFieldDept = emp.department?.toUpperCase() === 'FIELD' || 
                           emp.department?.toLowerCase().includes('terrain') || 
                           emp.department?.toLowerCase().includes('chantier') ||
                           emp.department?.toUpperCase() === 'TECHNICAL';
                           
        const isFieldPosition = emp.position?.toLowerCase().includes('equipe') || 
                               emp.position?.toLowerCase().includes('terrain') ||
                               emp.position?.toLowerCase().includes('technicien') ||
                               emp.position?.toLowerCase().includes('chauffeur');
                               
        return isFieldDept || isFieldPosition;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createWorkSite(formData);
            toast.success("Projet créé avec succès");
            onSuccess();
        } catch (err: any) {
            console.error("Failed to create project", err);
            const errorMsg = err.response?.data?.detail || "Erreur lors de la création";
            toast.error(typeof errorMsg === 'string' ? errorMsg : "Données invalides (422)");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[48px] w-full max-w-2xl max-h-[95vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col">
                <div className="p-12 space-y-10 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h2 className={clsx("text-3xl font-black text-slate-900", displayFont.className)}>Nouveau Projet</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ouverture d'un chantier / site</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du Projet</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="ex: Extension Fibre Nord"
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secteur / Type</label>
                                <select
                                    value={formData.project_type}
                                    onChange={e => setFormData({ ...formData, project_type: e.target.value })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner appearance-none"
                                >
                                    <option value="BTP">BTP & Génie Civil</option>
                                    <option value="TELECOM">Télécommunications</option>
                                    <option value="ENERGY">Énergie / Solaire</option>
                                    <option value="SERVICE">Services / Maintenance</option>
                                </select>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date de démarrage</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.start_date}
                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Statut Initial</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner appearance-none"
                                >
                                    <option value="ACTIVE">En cours</option>
                                    <option value="PLANNING">Planification</option>
                                    <option value="ON_HOLD">En pause</option>
                                </select>
                            </div>

                            <div className="space-y-3 md:col-span-2 relative" ref={dropdownRef}>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chef de Projet / Responsable (PM)</label>
                                <div className="relative group">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input
                                        required
                                        value={formData.manager_name || searchManager}
                                        onChange={e => {
                                            setSearchManager(e.target.value);
                                            setFormData({ ...formData, manager_name: e.target.value });
                                            setIsDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsDropdownOpen(true)}
                                        placeholder="Chercher ou saisir un responsable..."
                                        className="w-full pl-14 pr-6 py-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                    />
                                    {isDropdownOpen && (filteredPMs.length > 0 || searchManager) && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[32px] shadow-2xl border border-slate-100 py-4 z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-300">
                                            {filteredPMs.length > 0 ? (
                                                filteredPMs.map(emp => (
                                                    <button
                                                        key={emp.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const name = `${emp.first_name} ${emp.last_name}`;
                                                            setFormData({ ...formData, manager_name: name });
                                                            setSearchManager(name);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className="w-full px-8 py-4 text-left hover:bg-slate-50 flex items-center justify-between group/item transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center font-bold text-xs">
                                                                {emp.first_name?.[0]}{emp.last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900">{emp.first_name} {emp.last_name}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{emp.job_title || emp.position || 'Administratif'}</p>
                                                            </div>
                                                        </div>
                                                        {formData.manager_name === `${emp.first_name} ${emp.last_name}` && <Check className="text-indigo-600" size={16} />}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-8 py-4 text-xs font-bold text-slate-400 italic">
                                                    Aucun profil administratif trouvé. Appuyez sur Entrée pour utiliser "{searchManager}"
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6 md:col-span-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Équipes de Terrain Affectées</label>
                                    <button
                                        type="button"
                                        onClick={handleAddTeam}
                                        className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2"
                                    >
                                        <PlusCircle size={14} /> Ajouter une Équipe
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {formData.teams.length === 0 ? (
                                        <div className="p-8 bg-slate-50 rounded-[32px] border border-dashed border-slate-200 text-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aucune équipe de terrain définie</p>
                                        </div>
                                    ) : (
                                        formData.teams.map((team, tIndex) => (
                                            <div key={tIndex} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1 space-y-2">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[1px] ml-1">Nom de l'équipe</label>
                                                        <input
                                                            value={team.name}
                                                            onChange={e => handleUpdateTeam(tIndex, 'name', e.target.value)}
                                                            placeholder="ex: Équipe Fibre Zone A"
                                                            className="w-full p-4 bg-white border-none rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTeam(tIndex)}
                                                        className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-indigo-600 uppercase tracking-[1px] ml-1">Team Leader (TL)</label>
                                                        <select
                                                            value={team.leader_id}
                                                            onChange={e => handleUpdateTeam(tIndex, 'leader_id', e.target.value)}
                                                            className="w-full p-4 bg-white border-none rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                                        >
                                                            <option value="">Sélectionner le chef d'équipe...</option>
                                                            {fieldEmployees.map(emp => (
                                                                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.position || 'Terrain'})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[1px] ml-1">Membres de l'équipe</label>
                                                        <div className="p-4 bg-white rounded-2xl max-h-32 overflow-y-auto shadow-inner space-y-2">
                                                            {fieldEmployees
                                                                .filter(emp => String(emp.id) !== String(team.leader_id))
                                                                .map(emp => (
                                                                    <label key={emp.id} className="flex items-center gap-2 cursor-pointer group">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={team.member_ids.includes(emp.id)}
                                                                            onChange={e => {
                                                                                const ids = e.target.checked
                                                                                    ? [...team.member_ids, emp.id]
                                                                                    : team.member_ids.filter(id => id !== emp.id);
                                                                                handleUpdateTeam(tIndex, 'member_ids', ids);
                                                                            }}
                                                                            className="rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500"
                                                                        />
                                                                        <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
                                                                            {emp.first_name} {emp.last_name}
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 p-6 bg-slate-50 text-slate-500 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-[2] p-6 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all disabled:opacity-50"
                            >
                                {submitting ? "Création..." : "Ouvrir le Projet"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function StockAssignmentModal({ site, onClose, onSuccess }: any) {
    const [products, setProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [assignments, setAssignments] = useState<any[]>([
        { id: Date.now(), product_id: '', quantity: 1 }
    ]);
    const [reason, setReason] = useState(`Affectation Chantier: ${site.name}`);
    const [submitting, setSubmitting] = useState(false);

    const [resources, setResources] = useState<any[]>([]);
    const [selectedResourceId, setSelectedResourceId] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [productsData, resourcesData] = await Promise.all([
                    getProducts(),
                    getFieldResources()
                ]);
                setProducts(productsData);
                setResources(resourcesData);
            } catch (err) {
                console.error("Failed to fetch initial data", err);
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleAddRow = () => {
        setAssignments([...assignments, { id: Date.now(), product_id: '', quantity: 1 }]);
    };

    const handleRemoveRow = (id: number) => {
        if (assignments.length > 1) {
            setAssignments(assignments.filter(a => a.id !== id));
        }
    };

    const handleUpdateRow = (id: number, field: string, value: any) => {
        setAssignments(assignments.map(a => 
            a.id === id ? { ...a, [field]: value } : a
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const validAssignments = assignments.filter(a => a.product_id && a.quantity > 0);
        if (validAssignments.length === 0) {
            toast.error("Veuillez sélectionner au moins un article avec une quantité");
            return;
        }

        if (!selectedResourceId) {
            toast.error("Veuillez sélectionner le personnel recevant le matériel");
            return;
        }

        setSubmitting(true);
        try {
            // Find team info for the selected resource
            let teamInfo = { name: '', leader_name: '' };
            if (site.teams && selectedResourceId) {
                const res = resources.find(r => Number(r.id) === Number(selectedResourceId));
                const empId = res?.employee_id;
                
                const team = site.teams.find((t: any) => 
                    Number(t.leader_id) === Number(empId) || 
                    t.member_ids.map(Number).includes(Number(empId))
                );
                
                if (team) {
                    teamInfo.name = team.name;
                    const leader = resources.find(r => Number(r.employee_id) === Number(team.leader_id));
                    teamInfo.leader_name = leader?.employee_name || '';
                }
            }

            for (const item of validAssignments) {
                const payload = {
                    product_id: Number(item.product_id),
                    quantity: Number(item.quantity),
                    reason: reason,
                    type: 'OUT',
                    work_site_id: Number(site.id),
                    condition_out: 'GOOD',
                    condition_return: 'GOOD',
                    reference_id: '',
                    issued_to_id: Number(selectedResourceId),
                    received_from_id: null,
                    approved_by_id: null,
                    mission_id: '',
                    damage_notes: '',
                    team_name: teamInfo.name,
                    team_leader_name: teamInfo.leader_name
                };
                console.log("Recording Movement with payload:", payload);
                await recordMovement(payload);
            }
            toast.success(`${validAssignments.length} article(s) affecté(s) avec succès`);
            onSuccess();
        } catch (err: any) {
            console.error("Failed to assign stock", err);
            const errorDetail = err.response?.data?.detail || err.response?.data?.message || "Erreur inconnue";
            console.error("API Error Detail:", errorDetail);
            toast.error(`Erreur 422: ${typeof errorDetail === 'string' ? errorDetail : 'Données invalides'}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[48px] w-full max-w-3xl max-h-[95vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col">
                <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h2 className={clsx("text-2xl font-black text-slate-900", displayFont.className)}>Affectation Multi-Articles</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sortie de stock pour: {site.name}</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all">
                            <XCircle size={20} />
                        </button>
                    </div>

                    {loadingProducts ? (
                        <div className="flex justify-center py-12">
                            <div className="h-10 w-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {assignments.map((item, index) => {
                                    const selectedProduct = products.find(p => p.id === Number(item.product_id));
                                    return (
                                        <div key={item.id} className="flex gap-4 items-end animate-in fade-in slide-in-from-left-4 duration-300">
                                            <div className="flex-[3] space-y-2">
                                                {index === 0 && <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Article</label>}
                                                <div className="relative">
                                                    <select
                                                        required
                                                        value={item.product_id}
                                                        onChange={e => handleUpdateRow(item.id, 'product_id', e.target.value)}
                                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner appearance-none"
                                                    >
                                                        <option value="">Choisir un article...</option>
                                                        {products.map(p => (
                                                            <option key={p.id} value={p.id} disabled={assignments.some(a => a.product_id === String(p.id) && a.id !== item.id)}>
                                                                {p.name} ({p.current_stock} {p.unit} dispos)
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ArrowUpDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-2">
                                                {index === 0 && <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantité {selectedProduct && `(${selectedProduct.unit})`}</label>}
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    max={selectedProduct ? selectedProduct.current_stock : undefined}
                                                    value={item.quantity}
                                                    onChange={e => handleUpdateRow(item.id, 'quantity', e.target.value)}
                                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner text-center"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRow(item.id)}
                                                disabled={assignments.length === 1}
                                                className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-all disabled:opacity-30 mb-0.5"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personnel recevant le matériel</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={selectedResourceId}
                                        onChange={e => setSelectedResourceId(e.target.value)}
                                        className="w-full p-5 bg-slate-50 border-none rounded-[20px] text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner appearance-none"
                                    >
                                        <option value="">Choisir la ressource / personne...</option>
                                        {resources
                                            .filter(res => {
                                                // Filter by team members if site has teams defined
                                                if (site.teams && site.teams.length > 0) {
                                                    const allTeamMemberIds = site.teams.flatMap((t: any) => [
                                                        Number(t.leader_id),
                                                        ...t.member_ids.map(Number)
                                                    ]);
                                                    return allTeamMemberIds.includes(Number(res.employee_id));
                                                }
                                                return true;
                                            })
                                            .map(res => {
                                                // Find which team this person belongs to for better display
                                                let teamContext = "";
                                                if (site.teams) {
                                                    const team = site.teams.find((t: any) => 
                                                        Number(t.leader_id) === Number(res.employee_id || res.id) || 
                                                        t.member_ids.map(Number).includes(Number(res.employee_id || res.id))
                                                    );
                                                    if (team) {
                                                        const isLeader = Number(team.leader_id) === Number(res.employee_id || res.id);
                                                        teamContext = ` [${team.name}${isLeader ? ' - TL' : ''}]`;
                                                    }
                                                }
                                                return (
                                                    <option key={res.id} value={res.id}>
                                                        {res.employee_name}{teamContext}
                                                    </option>
                                                );
                                            })}
                                    </select>
                                    <UserCircle size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleAddRow}
                                className="w-full p-4 border-2 border-dashed border-slate-100 rounded-3xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                            >
                                <PlusCircle size={14} /> Ajouter un autre article
                            </button>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motif global</label>
                                <input
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    className="w-full p-5 bg-slate-50 border-none rounded-[20px] text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                />
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 p-5 bg-slate-50 text-slate-500 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] p-5 bg-slate-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all disabled:opacity-50"
                                >
                                    {submitting ? "Affectation en cours..." : `Confirmer l'affectation (${assignments.length})`}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

function ProjectDetailsModal({ site, onClose }: { site: any, onClose: () => void }) {
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'stock'>('overview');

    useEffect(() => {
        const fetchMovements = async () => {
            try {
                const data = await getInventoryMovements();
                // Filter movements related to this project
                // Reason format: "Affectation Chantier: [Name]"
                const siteMovements = data.filter((m: any) => 
                    m.reason?.includes(site.name) || m.reason?.includes(`Chantier: ${site.name}`)
                );
                setMovements(siteMovements);
            } catch (err) {
                console.error("Failed to fetch movements", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMovements();
    }, [site.name]);

    // Group materials by product to show total consumption
    const consumption = movements.reduce((acc: any, m: any) => {
        const key = m.product_name;
        if (!acc[key]) {
            acc[key] = { name: key, quantity: 0, unit: m.unit || 'unités', lastDate: m.date };
        }
        acc[key].quantity += Number(m.quantity);
        if (new Date(m.date) > new Date(acc[key].lastDate)) {
            acc[key].lastDate = m.date;
        }
        return acc;
    }, {});

    const consumptionList = Object.values(consumption);

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-end">
            <div className="bg-white h-full w-full max-w-2xl shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
                {/* Header Section */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex gap-3">
                        <button className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-indigo-600 transition-all">
                            <Download size={20} />
                        </button>
                        <button className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-rose-600 transition-all">
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-10 space-y-12">
                        {/* Project Identity */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className={clsx("p-5 rounded-3xl", 
                                    site.project_type === 'TELECOM' ? 'bg-indigo-50 text-indigo-600' : 
                                    site.project_type === 'BTP' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                )}>
                                    {site.project_type === 'TELECOM' ? <Radio size={32} /> : 
                                     site.project_type === 'BTP' ? <Construction size={32} /> : <HardHat size={32} />}
                                </div>
                                <div className="space-y-1">
                                    <h2 className={clsx("text-4xl font-black text-slate-900 tracking-tight", displayFont.className)}>{site.name}</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin size={14} className="text-indigo-500" /> {site.location || 'Localisation non définie'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-6 bg-slate-50 rounded-[32px] space-y-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Statut</p>
                                    <span className="inline-flex px-3 py-1 bg-white rounded-full text-[10px] font-black text-indigo-600 border border-indigo-100 uppercase tracking-tighter">
                                        {site.status}
                                    </span>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-[32px] space-y-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsable</p>
                                    <p className="text-xs font-black text-slate-900">{site.manager_name || 'Non assigné'}</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-[32px] space-y-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date Début</p>
                                    <p className="text-xs font-black text-slate-900">{site.start_date || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-slate-100">
                            <button 
                                onClick={() => setActiveTab('overview')}
                                className={clsx("px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all",
                                    activeTab === 'overview' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Vue d'ensemble
                            </button>
                            <button 
                                onClick={() => setActiveTab('stock')}
                                className={clsx("px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all",
                                    activeTab === 'stock' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Stock & Matériel ({movements.length})
                            </button>
                        </div>

                        {activeTab === 'overview' ? (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <h3 className="text-lg font-black text-slate-900">Progression Globale</h3>
                                        <span className="text-3xl font-black text-indigo-600">{site.progress || 0}%</span>
                                    </div>
                                    <div className="h-4 bg-slate-50 rounded-full border border-slate-100 p-1">
                                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${site.progress || 0}%` }} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-8 bg-white border border-slate-100 rounded-[40px] shadow-sm space-y-4">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 w-fit rounded-2xl">
                                            <Package size={24} />
                                        </div>
                                        <h4 className="font-black text-slate-900">Articles Affectés</h4>
                                        <p className="text-3xl font-black text-slate-900">{consumptionList.length}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total des références sorties du stock central</p>
                                    </div>
                                    <div className="p-8 bg-white border border-slate-100 rounded-[40px] shadow-sm space-y-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 w-fit rounded-2xl">
                                            <History size={24} />
                                        </div>
                                        <h4 className="font-black text-slate-900">Dernière Activité</h4>
                                        <p className="text-xl font-black text-slate-900">
                                            {movements.length > 0 ? format(new Date(movements[0].date), 'dd MMM yyyy', { locale: fr }) : 'Aucune'}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dernier mouvement logistique enregistré</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                {/* Material Consumption Summary */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <TrendingUp className="text-indigo-600" size={20} /> Résumé de Consommation
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {consumptionList.length === 0 ? (
                                            <div className="p-12 bg-slate-50 rounded-[32px] text-center border-2 border-dashed border-slate-100">
                                                <Package size={40} className="mx-auto text-slate-200 mb-4" />
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucun matériel affecté pour le moment</p>
                                            </div>
                                        ) : (
                                            consumptionList.map((item: any) => (
                                                <div key={item.name} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-transparent hover:border-slate-200 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-600">
                                                            <Package size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900">{item.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dernière affectation: {format(new Date(item.lastDate), 'dd/MM/yy')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-black text-indigo-600">{item.quantity}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Detailed History */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <History className="text-indigo-600" size={20} /> Journal des Sorties
                                    </h3>
                                    <div className="space-y-4">
                                        {loading ? (
                                            <div className="flex justify-center py-8">
                                                <Loader2 className="animate-spin text-indigo-600" />
                                            </div>
                                        ) : (
                                            movements.map((m: any) => (
                                                <div key={m.id} className="flex gap-6 relative pb-8 group">
                                                    <div className="absolute left-[23px] top-12 bottom-0 w-px bg-slate-100 group-last:hidden" />
                                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 z-10 group-hover:bg-indigo-50 transition-colors">
                                                        <Clock size={20} className="text-slate-400 group-hover:text-indigo-600" />
                                                    </div>
                                                    <div className="space-y-1 pt-1">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            {format(new Date(m.date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                                                        </p>
                                                        <p className="text-sm font-bold text-slate-900">
                                                            Sortie de <span className="text-indigo-600">{Number(m.quantity).toFixed(2)}</span> <span className="text-slate-900">{m.product_name}(s)</span>
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            {m.reason && (
                                                                <p className="text-xs text-slate-400 italic">"{m.reason}"</p>
                                                            )}
                                                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase tracking-tighter">Par: {m.performed_by_name || 'Système'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Loader2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={clsx("animate-spin", props.className)}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
