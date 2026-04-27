'use client';
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../dashboard-layout';
import { useTranslation } from 'react-i18next';
import { FileText, Search, Plus, Folder, File, Download, MoreVertical, Loader2, Trash2, ExternalLink, X } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { getDocuments, uploadDocument, deleteDocument, getDocumentDownloadUrl } from '@/services/api';

export default function DocumentsPage() {
    const { t } = useTranslation();
    const { showToast } = useNotification();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [documents, setDocuments] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState('General');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        title: '',
        docType: 'Facture',
        file: null as File | null
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const categories = ['General', 'Finance', 'RH', 'Projets', 'Contrats'];
    const docTypes = ['Facture', 'Contrat', 'CNI', 'Passeport', 'Diplôme', 'Attestation', 'Autre'];

    const fetchDocs = async () => {
        try {
            setLoading(true);
            const data = await getDocuments(activeCategory);
            setDocuments(data);
        } catch (error) {
            console.error(error);
            showToast('Erreur lors du chargement des documents', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, [activeCategory]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadForm(prev => ({ 
                ...prev, 
                file, 
                title: prev.title || file.name.split('.')[0] 
            }));
            setShowUploadModal(true);
        }
    };

    const handleUpload = async () => {
        if (!uploadForm.file) return;

        try {
            setUploading(true);
            await uploadDocument(
                uploadForm.file, 
                activeCategory, 
                uploadForm.title, 
                uploadForm.docType
            );
            showToast('Document ajouté avec succès', 'success');
            setShowUploadModal(false);
            setUploadForm({ title: '', docType: 'Facture', file: null });
            fetchDocs();
        } catch (error) {
            console.error(error);
            showToast('Erreur lors de l\'envoi du document', 'error');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Voulez-vous vraiment supprimer ce document ?')) return;
        try {
            await deleteDocument(id);
            showToast('Document supprimé', 'success');
            setDocuments(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            showToast('Erreur lors de la suppression', 'error');
        }
    };

    const handleDownload = (id: number, name: string) => {
        // Open download in new tab
        const url = getDocumentDownloadUrl(id);
        window.open(url, '_blank');
    };

    const filteredDocs = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
            />

            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Nouveau Document</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Détails de l'archivage</p>
                            </div>
                            <button onClick={() => setShowUploadModal(false)} className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-gray-100 text-gray-400 hover:text-gray-900">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="p-4 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm">
                                    <File size={24} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-black text-gray-900 truncate">{uploadForm.file?.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Fichier sélectionné</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Titre du document</label>
                                    <input 
                                        type="text" 
                                        value={uploadForm.title}
                                        onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/5 transition-all"
                                        placeholder="Ex: Facture Mars 2024"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Type de document</label>
                                    <select 
                                        value={uploadForm.docType}
                                        onChange={(e) => setUploadForm(prev => ({ ...prev, docType: e.target.value }))}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer"
                                    >
                                        {docTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50/30 flex gap-4">
                            <button 
                                onClick={() => setShowUploadModal(false)}
                                className="flex-1 px-6 py-4 rounded-2xl text-sm font-black text-gray-400 hover:text-gray-900 hover:bg-white transition-all border border-transparent hover:border-gray-100"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleUpload}
                                disabled={uploading || !uploadForm.title}
                                className="flex-1 bg-gray-900 text-white px-6 py-4 rounded-2xl text-sm font-black hover:bg-blue-600 transition-all shadow-xl shadow-gray-900/10 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                {uploading ? 'Envoi en cours...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">{t('documents.title', 'Gestion des Documents')}</h1>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">{t('documents.subtitle', 'Stockez et organisez vos documents d\'entreprise')}</p>
                </div>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-gray-900/10 font-black text-sm disabled:opacity-50"
                >
                    {uploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                    {uploading ? 'Envoi...' : t('documents.add_new', 'Nouveau Document')}
                </button>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    activeCategory === cat 
                                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' 
                                    : 'bg-white text-gray-400 hover:text-gray-900 border border-gray-100'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            className="w-full bg-white pl-12 pr-4 py-3 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium shadow-sm"
                            placeholder={t('documents.search_placeholder', 'Rechercher un document...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <div className="h-12 w-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest animate-pulse">Chargement de votre coffre-fort...</p>
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText size={32} className="text-gray-200" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">{t('documents.no_docs', 'Aucun document trouvé')}</h3>
                        <p className="text-gray-500 text-sm mt-2">{t('documents.no_docs_subtitle', 'Commencez par ajouter votre premier document')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-50 bg-gray-50/20">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">{t('documents.table.title', 'Titre')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">{t('documents.table.type', 'Type')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">{t('documents.table.category', 'Catégorie')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[2px] md:table-cell hidden">{t('documents.table.size', 'Taille')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[2px] md:table-cell hidden">{t('documents.table.date', 'Date')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[2px] text-right">{t('documents.table.actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-blue-50/30 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white border border-gray-100 rounded-2xl text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                                    <File size={22} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight">{doc.title || doc.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{doc.extension || 'FILE'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-gray-600">
                                                {doc.doc_type || '-'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-200/50">
                                                {doc.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-xs font-bold text-gray-400 md:table-cell hidden">{doc.size}</td>
                                        <td className="px-8 py-6 text-xs font-bold text-gray-600 md:table-cell hidden">{doc.created_at}</td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button 
                                                    onClick={() => handleDownload(doc.id, doc.name)}
                                                    className="p-3 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100"
                                                    title="Télécharger"
                                                >
                                                    <Download size={20} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
