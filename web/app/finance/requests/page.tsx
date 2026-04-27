'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/dashboard-layout';
import { HandCoins, Plus, Search, Filter, ChevronRight, Clock, CheckCircle2, XCircle, AlertCircle, MoreVertical, FileText, Trash2, Edit2, Send, X, Calendar } from 'lucide-react';
import api from '@/services/api';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

export default function RequestsPage() {
    const { t } = useTranslation();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRequest, setEditingRequest] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: '',
        project_name: '',
        description: '',
        amount: '',
        request_type: 'MONEY'
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/finance/requests');
            setRequests(res.data);
        } catch (err) {
            console.error("Error fetching requests:", err);
            toast.error("Échec du chargement des requêtes");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (request = null) => {
        if (request) {
            setEditingRequest(request);
            setFormData({
                title: request.title,
                project_name: request.project_name || '',
                description: request.description,
                amount: request.amount ? request.amount.toString() : '',
                request_type: request.request_type
            });
        } else {
            setEditingRequest(null);
            setFormData({
                title: '',
                project_name: '',
                description: '',
                amount: '',
                request_type: 'MONEY'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                amount: formData.amount ? parseFloat(formData.amount) : null
            };

            if (editingRequest) {
                await api.put(`/finance/requests/${editingRequest.id}`, data);
                toast.success("Requête mise à jour");
            } else {
                await api.post('/finance/requests', data);
                toast.success("Requête créée");
            }
            setIsModalOpen(false);
            fetchRequests();
        } catch (err) {
            toast.error("Une erreur est survenue");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette requête ?")) return;
        try {
            await api.delete(`/finance/requests/${id}`);
            toast.success("Requête supprimée");
            fetchRequests();
        } catch (err) {
            toast.error("Impossible de supprimer une requête approuvée");
        }
    };

    const handleSubmitForApproval = async (id: number) => {
        try {
            await api.post(`/finance/requests/${id}/submit`);
            toast.success("Soumis pour approbation");
            fetchRequests();
        } catch (err) {
            toast.error("Échec de la soumission");
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'REJECTED': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'COMPLETED': return 'bg-blue-50 text-blue-700 border-blue-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <Clock size={14} />;
            case 'APPROVED': return <CheckCircle2 size={14} />;
            case 'REJECTED': return <XCircle size={14} />;
            case 'COMPLETED': return <CheckCircle2 size={14} />;
            default: return <AlertCircle size={14} />;
        }
    };

    const filteredRequests = requests.filter(r => 
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.requester_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-base font-black text-slate-900 tracking-tight">
                            {t('finance.requests.title')}
                        </h1>
                        <p className="text-slate-500 font-medium">
                            {t('finance.requests.subtitle')}
                        </p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        {t('finance.requests.new')}
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'En attente', count: requests.filter(r => r.status === 'PENDING').length, color: 'amber' },
                        { label: 'Approuvées', count: requests.filter(r => r.status === 'APPROVED').length, color: 'emerald' },
                        { label: 'Terminées', count: requests.filter(r => r.status === 'COMPLETED').length, color: 'blue' },
                        { label: 'Total', count: requests.length, color: 'slate' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-base font-black text-slate-900 mt-1">{stat.count}</p>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher une requête..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-100 bg-white focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-200 transition-all outline-none text-slate-700 font-medium"
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : filteredRequests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRequests.map((request) => (
                            <div key={request.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden flex flex-col">
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={clsx(
                                            "px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5",
                                            getStatusStyle(request.status)
                                        )}>
                                            {getStatusIcon(request.status)}
                                            {request.status}
                                        </div>
                                        <div className="flex gap-2">
                                            {request.status === 'PENDING' && (
                                                <div className="animate-pulse w-2 h-2 rounded-full bg-amber-400"></div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-base font-black text-slate-900 mb-2 line-clamp-1">
                                        {request.title}
                                    </h3>
                                    <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2">{request.project_name || "Projet non spécifié"}</p>
                                    
                                    <p className="text-slate-500 text-sm line-clamp-2 mb-4 font-medium leading-relaxed">
                                        {request.description || "Aucune description fournie."}
                                    </p>

                                    <div className="flex items-center gap-4 py-4 border-t border-slate-50">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Demandeur</p>
                                            <p className="text-sm font-bold text-slate-700 mt-0.5">{request.requester_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant</p>
                                            <p className="text-base font-black text-slate-900 mt-0.5">
                                                {request.amount ? `${request.amount.toLocaleString()} F` : "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
                                    <div className="flex gap-2">
                                        {request.status !== 'APPROVED' && request.status !== 'COMPLETED' && (
                                            <>
                                                <button 
                                                    onClick={() => handleOpenModal(request)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="Modifier"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(request.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                {request.status === 'DRAFT' || !request.status ? (
                                                    <button 
                                                        onClick={() => handleSubmitForApproval(request.id)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                        title="Soumettre pour approbation"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                ) : null}
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Calendar size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">
                                            {format(new Date(request.date), 'dd/MM/yyyy')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 p-16 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <HandCoins size={32} className="text-slate-300" />
                        </div>
                        <h2 className="text-lg font-black text-slate-900 mb-2">{t('finance.requests.empty')}</h2>
                        <button 
                            onClick={() => handleOpenModal()}
                            className="mt-8 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all"
                        >
                            Créer une requête
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[95vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="p-8 flex justify-between items-center border-b border-slate-50">
                            <div>
                                <h2 className="text-base font-black text-slate-900">
                                    {editingRequest ? 'Modifier la Requête' : 'Nouvelle Requête'}
                                </h2>
                                <p className="text-slate-500 text-sm font-medium">Remplissez les détails ci-dessous</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sujet de la demande</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all outline-none"
                                        placeholder="ex: Achat de consommables bureau"
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Projet</label>
                                    <input
                                        type="text"
                                        value={formData.project_name}
                                        onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all outline-none"
                                        placeholder="ex: Projet Rénovation"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant (CFA)</label>
                                        <input
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type de demande</label>
                                        <select
                                            value={formData.request_type}
                                            onChange={(e) => setFormData({...formData, request_type: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all outline-none bg-white"
                                        >
                                            <option value="MONEY">Argent / Fonds (Général)</option>
                                            <option value="URGENT">Dépense Urgente / Petite Caisse</option>
                                            <option value="STOCK">Achat Stock / Marchandise</option>
                                            <option value="MATERIAL">Matériel / Équipement</option>
                                            <option value="TRAVEL">Frais de Mission / Déplacement</option>
                                            <option value="SALARY_ADVANCE">Avance sur salaire</option>
                                            <option value="OTHER">Autre</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description / Justification</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all outline-none resize-none"
                                        placeholder="Expliquez votre demande..."
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                >
                                    {editingRequest ? 'Enregistrer' : 'Créer la requête'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
