'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../dashboard-layout';
import { getInformations, createInformation, deleteInformation } from '../../../services/api';
import { Megaphone, Plus, Trash2, X } from 'lucide-react';

interface Information {
    id: number;
    title: string;
    content: string;
    color: string;
    created_at: string;
    created_by_name?: string;
}

const COLORS = [
    { label: 'Ardoise', value: '#1E293B' },
    { label: 'Bleu', value: '#3B82F6' },
    { label: 'Vert', value: '#10B981' },
    { label: 'Ambre', value: '#F59E0B' },
    { label: 'Rouge', value: '#EF4444' },
    { label: 'Violet', value: '#8B5CF6' },
    { label: 'Rose', value: '#EC4899' },
];

export default function InfoCenterPage() {
    const [informations, setInformations] = useState < Information[] > ([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState < number | null > (null);

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
            setTitle('');
            setContent('');
            setColor(COLORS[0].value);
            setShowForm(false);
            fetchInfos();
        } catch (err) {
            console.error('Failed to create information', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Supprimer cette information ?')) return;
        setDeleting(id);
        try {
            await deleteInformation(id);
            setInformations(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error('Failed to delete information', err);
        } finally {
            setDeleting(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Megaphone size={28} className="text-indigo-600" />
                            Info Center
                        </h1>
                        <p className="text-gray-500 mt-1">Publiez des informations visibles par tous vos employés</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm shadow-indigo-200"
                    >
                        {showForm ? <X size={18} /> : <Plus size={18} />}
                        {showForm ? 'Annuler' : 'Nouvelle Info'}
                    </button>
                </div>

                {/* Creation Form */}
                {showForm && (
                    <div className="bg-white border border-indigo-100 rounded-2xl p-6 mb-8 shadow-sm shadow-indigo-50">
                        <h2 className="text-lg font-bold text-gray-900 mb-5">Publier une nouvelle information</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    maxLength={100}
                                    placeholder="Ex: Réunion générale, Maintenance système..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contenu</label>
                                <textarea
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    rows={4}
                                    placeholder="Détails de l'information..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Couleur de l'étiquette</label>
                                <div className="flex flex-wrap gap-3">
                                    {COLORS.map(c => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            title={c.label}
                                            onClick={() => setColor(c.value)}
                                            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                                            style={{
                                                backgroundColor: c.value,
                                                outline: color === c.value ? `3px solid ${c.value}` : 'none',
                                                outlineOffset: '3px',
                                                transform: color === c.value ? 'scale(1.15)' : 'scale(1)',
                                            }}
                                        >
                                            {color === c.value && (
                                                <span className="text-white font-bold text-lg leading-none">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Live Preview */}
                            <div className="border-l-4 rounded-lg px-4 py-3 bg-gray-50" style={{ borderLeftColor: color }}>
                                <p className="font-bold text-gray-900 text-sm">{title || "Titre de l'annonce"}</p>
                                <p className="text-gray-500 text-sm mt-1">{content || "Le contenu apparaîtra ici."}</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                                >
                                    {submitting ? 'Publication...' : 'Publier'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* List */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    </div>
                ) : informations.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Megaphone size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">Aucune information publiée</h3>
                        <p className="text-gray-400 mt-1">Cliquez sur "Nouvelle Info" pour diffuser un message à vos employés.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {informations.map(info => {
                            const date = new Date(info.created_at);
                            return (
                                <div
                                    key={info.id}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex gap-4 items-start"
                                    style={{ borderLeftWidth: '4px', borderLeftColor: info.color }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-gray-900 text-base truncate">{info.title}</h3>
                                            <span
                                                className="shrink-0 text-xs font-semibold text-white px-2.5 py-0.5 rounded-full"
                                                style={{ backgroundColor: info.color }}
                                            >
                                                Info
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed mb-3">{info.content}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <span>{date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                            {info.created_by_name && (
                                                <>
                                                    <span>·</span>
                                                    <span>Publié par <span className="font-medium text-gray-600">{info.created_by_name}</span></span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(info.id)}
                                        disabled={deleting === info.id}
                                        className="shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="Supprimer"
                                    >
                                        {deleting === info.id ? (
                                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <Trash2 size={18} />
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
