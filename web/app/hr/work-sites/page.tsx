'use client';

import { useState, useEffect } from 'react';
import { getWorkSites, createWorkSite, updateWorkSite, deleteWorkSite } from '../../../services/api';
import { 
    MapPin, ArrowLeft, Plus, Globe, Navigation, 
    Trash2, Edit3, Loader2, Info, CheckCircle, 
    Map as MapIcon, Crosshair, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '../../dashboard-layout';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';
import { useNotification } from '@/context/NotificationContext';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function WorkSitesPage() {
    const { showToast } = useNotification();
    const [sites, setSites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '', latitude: '', longitude: '', radius: 50 });

    const fetchSites = async () => {
        try {
            const data = await getWorkSites();
            setSites(data);
        } catch (error) {
            console.error('Failed to fetch work sites', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSites();
    }, []);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            showToast("La géolocalisation n'est pas supportée par votre navigateur.", "error");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude.toString(),
                    longitude: position.coords.longitude.toString()
                }));
                showToast("Position récupérée avec succès !", "success");
            },
            (error) => {
                console.error("Error getting location:", error);
                showToast("Impossible d'obtenir votre position. Vérifiez vos autorisations.", "error");
            }
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.latitude || !formData.longitude) {
            showToast("Veuillez remplir tous les champs obligatoires.", "error");
            return;
        }

        setSubmitting(true);
        const payload = {
            name: formData.name,
            latitude: parseFloat(formData.latitude as string),
            longitude: parseFloat(formData.longitude as string),
            radius: parseInt(formData.radius as unknown as string, 10)
        };

        try {
            if (formData.id) {
                await updateWorkSite(formData.id, payload);
                showToast("Site mis à jour avec succès", "success");
            } else {
                await createWorkSite(payload);
                showToast("Nouveau site enregistré", "success");
            }
            setIsFormOpen(false);
            setFormData({ id: null, name: '', latitude: '', longitude: '', radius: 50 });
            fetchSites();
        } catch (error) {
            console.error('Failed to save work site', error);
            showToast("Erreur lors de l'enregistrement", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (site: any) => {
        setFormData(site);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce site de travail ?")) {
            try {
                await deleteWorkSite(id);
                showToast("Site supprimé", "success");
                fetchSites();
            } catch (error) {
                console.error("Failed to delete work site", error);
                showToast("Erreur lors de la suppression", "error");
            }
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <Link href="/hr" className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest mb-4">
                            <ArrowLeft size={14} /> Retour Dashboard
                        </Link>
                        <h1 className={clsx("text-4xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            Sites & Géofencing
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Périmètres de pointage mobile autorisés
                        </p>
                    </div>
                    {!isFormOpen && (
                        <button
                            onClick={() => {
                                setFormData({ id: null, name: '', latitude: '', longitude: '', radius: 50 });
                                setIsFormOpen(true);
                            }}
                            className="bg-slate-900 text-white px-8 py-4 rounded-[20px] flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 font-black text-sm uppercase tracking-widest"
                        >
                            <Plus size={20} />
                            Ajouter un Site
                        </button>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard 
                        label="Total Sites" 
                        value={sites.length} 
                        icon={<MapIcon className="text-indigo-600" size={20} />} 
                        color="indigo" 
                    />
                    <StatCard 
                        label="Rayon Moyen" 
                        value={`${sites.length ? Math.round(sites.reduce((acc, s) => acc + s.radius, 0) / sites.length) : 0}m`} 
                        icon={<Navigation className="text-emerald-600" size={20} />} 
                        color="emerald" 
                    />
                    <StatCard 
                        label="Couverture" 
                        value="Actif" 
                        icon={<CheckCircle className="text-amber-600" size={20} />} 
                        color="amber" 
                    />
                </div>

                {/* Form Section */}
                {isFormOpen && (
                    <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl shadow-slate-100 border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className={clsx("text-2xl font-black text-slate-900", displayFont.className)}>
                                {formData.id ? "Modifier le Périmètre" : "Nouveau Périmètre de Pointage"}
                            </h2>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                                <ArrowLeft size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[2px] ml-1">Nom du Site</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input 
                                            type="text" name="name" value={formData.name || ''} onChange={handleChange} 
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                                            placeholder="Ex: Siège Social, Chantier A..." 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[2px] ml-1">Rayon Autorisé (Mètres)</label>
                                    <div className="relative">
                                        <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input 
                                            type="number" name="radius" value={formData.radius} onChange={handleChange} 
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                                            placeholder="50" 
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[2px]">Coordonnées GPS Précises</label>
                                        <button
                                            type="button"
                                            onClick={handleGetLocation}
                                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100 transition-all"
                                        >
                                            <Crosshair size={14} /> Utiliser ma position
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input 
                                            type="number" step="any" name="latitude" value={formData.latitude ?? ''} onChange={handleChange} 
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                                            placeholder="Latitude" 
                                        />
                                        <input 
                                            type="number" step="any" name="longitude" value={formData.longitude ?? ''} onChange={handleChange} 
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                                            placeholder="Longitude" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end gap-4">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="px-8 py-4 rounded-[20px] text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                                    Annuler
                                </button>
                                <button type="submit" disabled={submitting} className="bg-slate-900 text-white px-10 py-4 rounded-[20px] font-black text-sm uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-900/20 flex items-center gap-2 disabled:opacity-50 transition-all">
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                    {formData.id ? "Enregistrer les modifications" : "Créer le Site"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Sites List */}
                <div className="space-y-6">
                    <h2 className={clsx("text-2xl font-black text-slate-900 ml-2", displayFont.className)}>Périmètres Actifs</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {loading ? (
                            <div className="col-span-full flex justify-center py-20">
                                <Loader2 className="animate-spin text-slate-900" size={32} />
                            </div>
                        ) : sites.length === 0 ? (
                            <div className="col-span-full bg-slate-50 rounded-[40px] p-20 text-center border border-dashed border-slate-200">
                                <MapIcon className="mx-auto text-slate-200 mb-6" size={48} />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucun site de travail configuré</p>
                                <button onClick={() => setIsFormOpen(true)} className="mt-6 text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">
                                    Créer le premier site
                                </button>
                            </div>
                        ) : (
                            sites.map((site: any) => (
                                <div key={site.id} className="group bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-100/50 transition-all p-8 space-y-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10">
                                        <Globe size={100} />
                                    </div>
                                    
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                                                <MapPin size={28} />
                                            </div>
                                            <div>
                                                <h3 className={clsx("text-xl font-black text-slate-900 tracking-tight", displayFont.className)}>{site.name}</h3>
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Rayon: {site.radius}m</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 relative z-10">
                                            <button onClick={() => handleEdit(site)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                                <Edit3 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(site.id)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Latitude</p>
                                            <p className="text-sm font-bold text-slate-600 truncate">{site.latitude}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Longitude</p>
                                            <p className="text-sm font-bold text-slate-600 truncate">{site.longitude}</p>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <a 
                                            href={`https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                                        >
                                            Voir sur Google Maps <ChevronRight size={12} />
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function StatCard({ label, value, icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={clsx("absolute -right-6 -top-6 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity", 
                color === 'indigo' ? 'bg-indigo-600' : color === 'emerald' ? 'bg-emerald-600' : 'bg-amber-600'
            )} />
            <div className="flex justify-between items-start mb-4">
                <div className={clsx("p-3 rounded-2xl", 
                    color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 
                    color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                )}>
                    {icon}
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <h3 className={clsx("text-2xl font-black text-slate-900 tracking-tight", displayFont.className)}>{value}</h3>
        </div>
    );
}

function Building2(props: any) {
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
        >
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </svg>
    )
}
