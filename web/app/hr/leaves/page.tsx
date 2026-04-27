'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../dashboard-layout';
import { getMyLeaves, createLeaveRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Plus, Calendar, Sun, Heart, Baby, Briefcase, Clock, CheckCircle, XCircle, X, Loader2, Plane } from 'lucide-react';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

const LEAVE_TYPES = [
    { value: 'ANNUAL', label: 'Congé Annuel', icon: Sun, color: 'amber' },
    { value: 'SICK', label: 'Congé Maladie', icon: Heart, color: 'rose' },
    { value: 'MATERNITY', label: 'Congé Maternité', icon: Baby, color: 'pink' },
    { value: 'UNPAID', label: 'Congé Sans Solde', icon: Briefcase, color: 'slate' },
];

export default function LeavesPage() {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        start_date: '',
        end_date: '',
        leave_type: 'ANNUAL',
        reason: ''
    });

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const data = await getMyLeaves();
            setLeaves(data);
        } catch (error) {
            console.error("Failed to fetch leaves", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createLeaveRequest(formData);
            setShowModal(false);
            setFormData({ start_date: '', end_date: '', leave_type: 'ANNUAL', reason: '' });
            fetchLeaves();
        } catch (error) {
            console.error("Failed to create leave request", error);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'APPROVED': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: CheckCircle, label: 'Approuvé' };
            case 'REJECTED': return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', icon: XCircle, label: 'Refusé' };
            default: return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: Clock, label: 'En Attente' };
        }
    };

    const getLeaveTypeConfig = (type: string) => {
        return LEAVE_TYPES.find(lt => lt.value === type) || LEAVE_TYPES[0];
    };

    const calculateDays = (start: string, end: string) => {
        if (!start || !end) return 0;
        const diff = new Date(end).getTime() - new Date(start).getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    };

    // Stats
    const approved = leaves.filter(l => l.status === 'APPROVED');
    const totalDaysUsed = approved.reduce((acc, l) => acc + calculateDays(l.start_date, l.end_date), 0);
    const pending = leaves.filter(l => l.status === 'PENDING').length;

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className={clsx("text-3xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            Mes Congés
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Suivi et demandes de congé
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 font-black text-sm uppercase tracking-widest"
                    >
                        <Plus size={20} />
                        Nouvelle Demande
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Plane size={20} /></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solde Restant</span>
                        </div>
                        <p className={clsx("text-2xl font-black text-slate-900 tracking-tighter", displayFont.className)}>
                            30 <span className="text-sm font-bold text-slate-400">jours</span>
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><CheckCircle size={20} /></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jours Utilisés</span>
                        </div>
                        <p className={clsx("text-2xl font-black text-slate-900 tracking-tighter", displayFont.className)}>
                            {totalDaysUsed} <span className="text-sm font-bold text-slate-400">jours</span>
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Clock size={20} /></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Attente</span>
                        </div>
                        <p className={clsx("text-2xl font-black text-slate-900 tracking-tighter", displayFont.className)}>
                            {pending} <span className="text-sm font-bold text-slate-400">demandes</span>
                        </p>
                    </div>
                </div>

                {/* Leave List */}
                {loading ? (
                    <div className="flex justify-center p-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                    </div>
                ) : leaves.length === 0 ? (
                    <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 p-16 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sun size={32} className="text-slate-300" />
                        </div>
                        <h3 className={clsx("text-xl font-black text-slate-900 mb-2", displayFont.className)}>Aucune demande de congé</h3>
                        <p className="text-slate-500 font-medium mb-8">Faites votre première demande de congé.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all"
                        >
                            Demander un congé
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {leaves.map((leave) => {
                            const statusConfig = getStatusConfig(leave.status);
                            const leaveType = getLeaveTypeConfig(leave.leave_type);
                            const LeaveIcon = leaveType.icon;
                            const StatusIcon = statusConfig.icon;
                            const days = calculateDays(leave.start_date, leave.end_date);

                            return (
                                <div key={leave.id} className="group bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex items-center gap-5 flex-grow">
                                        <div className={clsx("p-4 rounded-2xl", 
                                            leaveType.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                                            leaveType.color === 'rose' ? 'bg-rose-50 text-rose-600' :
                                            leaveType.color === 'pink' ? 'bg-pink-50 text-pink-600' :
                                            'bg-slate-50 text-slate-600'
                                        )}>
                                            <LeaveIcon size={24} />
                                        </div>
                                        <div>
                                            <h3 className={clsx("font-black text-slate-900 text-lg tracking-tight", displayFont.className)}>
                                                {leaveType.label}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                                    <Calendar size={12} />
                                                    <span>{new Date(leave.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — {new Date(leave.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                                                    {days} jour{days > 1 ? 's' : ''}
                                                </span>
                                                <div className={clsx("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1", statusConfig.bg, statusConfig.text, statusConfig.border)}>
                                                    <StatusIcon size={10} />
                                                    {statusConfig.label}
                                                </div>
                                            </div>
                                            {leave.reason && (
                                                <p className="text-xs text-slate-400 mt-2 font-medium line-clamp-1">{leave.reason}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Leave Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 flex justify-between items-center border-b border-slate-50 bg-slate-50/50">
                            <div>
                                <h2 className={clsx("text-xl font-black text-slate-900", displayFont.className)}>
                                    Nouvelle Demande de Congé
                                </h2>
                                <p className="text-slate-500 text-sm font-medium">Précisez les dates et le type de congé</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-slate-100">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {/* Leave Type */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-3">Type de Congé</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {LEAVE_TYPES.map(lt => {
                                        const LIcon = lt.icon;
                                        return (
                                            <button
                                                key={lt.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, leave_type: lt.value })}
                                                className={clsx(
                                                    "p-3 rounded-2xl border-2 flex items-center gap-3 transition-all text-left",
                                                    formData.leave_type === lt.value
                                                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                        : "border-slate-100 hover:border-slate-200 text-slate-600"
                                                )}
                                            >
                                                <LIcon size={18} />
                                                <span className="text-xs font-black">{lt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Date Début</label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all outline-none bg-slate-50/50 font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Date Fin</label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all outline-none bg-slate-50/50 font-bold text-sm"
                                    />
                                </div>
                            </div>

                            {/* Duration Display */}
                            {formData.start_date && formData.end_date && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                                    <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Durée Estimée</span>
                                    <span className={clsx("text-lg font-black text-indigo-700", displayFont.className)}>
                                        {calculateDays(formData.start_date, formData.end_date)} jour(s)
                                    </span>
                                </div>
                            )}

                            {/* Reason */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Motif (Optionnel)</label>
                                <textarea
                                    rows={3}
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all outline-none resize-none bg-slate-50/50 font-medium text-sm"
                                    placeholder="Raison du congé..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] bg-slate-900 text-white px-6 py-4 rounded-2xl font-black hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {submitting && <Loader2 size={18} className="animate-spin" />}
                                    {submitting ? 'Envoi...' : 'Soumettre la Demande'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
