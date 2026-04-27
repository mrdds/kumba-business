'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../dashboard-layout';
import { getInformations, createInformation, deleteInformation } from '../../../services/api';
import { 
    Megaphone, Plus, Trash2, X, Send, 
    Calendar, User, Bell, Sparkles, Loader2,
    LayoutGrid, List, Filter, Search, MoreHorizontal
} from 'lucide-react';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';
import { useNotification } from '@/context/NotificationContext';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

interface Information {
    id: number;
    title: string;
    content: string;
    color: string;
    created_at: string;
    created_by_name?: string;
}

const COLORS = [
    { label: 'Indigo', value: '#6366F1' },
    { label: 'Emerald', value: '#10B981' },
    { label: 'Amber', value: '#F59E0B' },
    { label: 'Rose', value: '#F43F5E' },
    { label: 'Slate', value: '#0F172A' },
    { label: 'Violet', value: '#8B5CF6' },
];

export default function InfoCenterPage() {
    const { showToast } = useNotification();
    const [informations, setInformations] = useState<Information[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [color, setColor] = useState(COLORS[0].value);

    const fetchInfos = async () => {
        try {
            const data = await getInformations();
            setInformations(data);
        } catch (err) {
            console.error('Failed to fetch informations', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInfos();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;
        setSubmitting(true);
        try {
            await createInformation({ title: title.trim(), content: content.trim(), color });
            showToast("Annonce publiée avec succès", "success");
            setTitle('');
            setContent('');
            setColor(COLORS[0].value);
            setShowForm(false);
            fetchInfos();
        } catch (err) {
            console.error('Failed to create information', err);
            showToast("Erreur lors de la publication", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Voulez-vous vraiment supprimer cette annonce ?')) return;
        setDeleting(id);
        try {
            await deleteInformation(id);
            setInformations(prev => prev.filter(i => i.id !== id));
            showToast("Annonce supprimée", "success");
        } catch (err) {
            console.error('Failed to delete information', err);
            showToast("Erreur lors de la suppression", "error");
        } finally {
            setDeleting(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className={clsx("text-4xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            Info Center
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Communication interne & Annonces officielles
                        </p>
                    </div>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-slate-900 text-white px-8 py-4 rounded-[24px] flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 font-black text-xs uppercase tracking-[2px]"
                        >
                            <Plus size={18} />
                            Nouvelle Annonce
                        </button>
                    )}
                </div>

                {/* Form Section */}
                {showForm && (
                    <div className="bg-white p-8 md:p-12 rounded-[48px] shadow-2xl shadow-slate-100 border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-12 opacity-5">
                            <Sparkles size={120} />
                        </div>
                        
                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <h2 className={clsx("text-2xl font-black text-slate-900", displayFont.className)}>Diffuser un message</h2>
                            <button onClick={() => setShowForm(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[3px] ml-1">Titre de l'annonce</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            maxLength={100}
                                            placeholder="Ex: Réunion générale de fin d'année..."
                                            className="w-full h-16 px-8 bg-slate-50/50 border-none rounded-[24px] text-lg font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[3px] ml-1">Message complet</label>
                                        <textarea
                                            value={content}
                                            onChange={e => setContent(e.target.value)}
                                            rows={6}
                                            placeholder="Détails importants à communiquer aux équipes..."
                                            className="w-full p-8 bg-slate-50/50 border-none rounded-[32px] text-base font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none leading-relaxed"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[3px] ml-1">Niveau d'Urgence</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {COLORS.map(c => (
                                                <button
                                                    key={c.value}
                                                    type="button"
                                                    onClick={() => setColor(c.value)}
                                                    className={clsx(
                                                        "h-12 rounded-2xl transition-all border-2",
                                                        color === c.value ? "border-slate-900 shadow-lg scale-105" : "border-transparent"
                                                    )}
                                                    style={{ backgroundColor: c.value }}
                                                    title={c.label}
                                                >
                                                    {color === c.value && <span className="text-white font-black text-xs">✓</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-[32px] space-y-4 border border-slate-100">
                                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[2px]">Aperçu du Badge</h3>
                                        <div className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                                            <div className="h-3 w-3 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Flash Info</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50 flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-8 py-4 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-900/20 flex items-center gap-2 disabled:opacity-60 transition-all"
                                >
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    Publier l'Annonce
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Feed Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-slate-900" size={32} />
                    </div>
                ) : informations.length === 0 ? (
                    <div className="text-center py-24 bg-slate-50 rounded-[48px] border border-dashed border-slate-200">
                        <Megaphone size={64} className="mx-auto text-slate-200 mb-6" />
                        <h3 className={clsx("text-2xl font-black text-slate-400", displayFont.className)}>Aucune communication</h3>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Le flux d'actualités est vide pour le moment</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {informations.map(info => {
                            const date = new Date(info.created_at);
                            return (
                                <div
                                    key={info.id}
                                    className="group bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-100/50 transition-all overflow-hidden"
                                >
                                    <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start">
                                        <div className="flex-1 min-w-0 space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div 
                                                    className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm"
                                                    style={{ backgroundColor: info.color }}
                                                >
                                                    OFFICIEL
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    <Calendar size={14} className="text-slate-200" />
                                                    {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </div>
                                            </div>

                                            <h3 className={clsx("text-3xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                                                {info.title}
                                            </h3>
                                            
                                            <p className="text-slate-600 text-lg font-medium leading-relaxed max-w-3xl whitespace-pre-wrap">
                                                {info.content}
                                            </p>

                                            <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                                                <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                                                    {info.created_by_name?.[0] || 'A'}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-900">{info.created_by_name || 'Administration'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direction Générale</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => handleDelete(info.id)}
                                                disabled={deleting === info.id}
                                                className="p-4 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                                title="Supprimer l'annonce"
                                            >
                                                {deleting === info.id ? (
                                                    <Loader2 size={20} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={20} />
                                                )}
                                            </button>
                                            <button className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all">
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div 
                                        className="h-1.5 w-full opacity-50" 
                                        style={{ backgroundColor: info.color }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
