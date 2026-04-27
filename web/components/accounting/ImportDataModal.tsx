'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { importFromExcel } from '@/services/excelService';

interface ImportDataModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: any[]) => Promise<void>;
    title: string;
    description: string;
    templateUrl?: string;
}

export default function ImportDataModal({ isOpen, onClose, onImport, title, description, templateUrl }: ImportDataModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            try {
                setLoading(true);
                setError(null);
                const data = await importFromExcel(selectedFile);
                if (data.length === 0) {
                    setError('Le fichier est vide ou mal formaté.');
                } else {
                    setFile(selectedFile);
                    setPreviewData(data);
                }
            } catch (err) {
                setError('Erreur lors de la lecture du fichier. Assurez-vous qu\'il s\'agit d\'un fichier Excel ou CSV valide.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            // Manually trigger the same logic as handleFileChange
            const input = fileInputRef.current;
            if (input) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(droppedFile);
                input.files = dataTransfer.files;
                handleFileChange({ target: { files: dataTransfer.files } } as any);
            }
        }
    };

    const handleConfirmImport = async () => {
        if (previewData.length > 0) {
            try {
                setLoading(true);
                await onImport(previewData);
                onClose();
                setFile(null);
                setPreviewData([]);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Erreur lors de l\'importation des données.');
            } finally {
                setLoading(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
                
                {/* --- HEADER --- */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
                            <Upload className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
                            <p className="text-sm text-slate-500 font-medium">{description}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in slide-in-from-top-2">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {!file ? (
                        <div 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center space-y-6 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="p-6 bg-white rounded-3xl shadow-xl shadow-slate-200/50 group-hover:scale-110 transition-transform">
                                <FileText size={48} className="text-blue-500" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-black text-slate-900">Glissez-déposez votre fichier ici</p>
                                <p className="text-slate-400 font-medium">Excel (.xlsx, .xls) ou CSV accepté</p>
                            </div>
                            <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm transition-all active:scale-95">
                                Sélectionner un fichier
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden" 
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileChange}
                            />
                            {templateUrl && (
                                <a 
                                    href={templateUrl} 
                                    className="text-sm font-bold text-blue-600 hover:underline pt-4"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Télécharger le modèle d'importation
                                </a>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 size={24} className="text-emerald-600" />
                                    <div>
                                        <p className="font-black text-emerald-900 text-sm">{file.name}</p>
                                        <p className="text-xs text-emerald-600 font-bold">{previewData.length} lignes détectées</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { setFile(null); setPreviewData([]); }}
                                    className="p-2 text-rose-500 hover:bg-white rounded-xl transition-all"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Aperçu des données</h3>
                                <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-sm max-h-[300px] overflow-y-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 sticky top-0">
                                            <tr>
                                                {Object.keys(previewData[0] || {}).map((key) => (
                                                    <th key={key} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50">{key}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {previewData.slice(0, 10).map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50">
                                                    {Object.values(row).map((val: any, j) => (
                                                        <td key={j} className="px-6 py-4 text-xs font-bold text-slate-600 tabular-nums truncate max-w-[200px]">{String(val)}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                            {previewData.length > 10 && (
                                                <tr>
                                                    <td colSpan={Object.keys(previewData[0]).length} className="px-6 py-4 text-center text-xs text-slate-400 font-medium italic">
                                                        ... et {previewData.length - 10} autres lignes
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- FOOTER --- */}
                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-4">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-8 py-4 text-sm font-black text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleConfirmImport}
                        disabled={!file || loading}
                        className="px-10 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-2xl font-black text-base shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-3"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Lancer l'importation
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
