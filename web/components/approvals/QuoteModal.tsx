import React, { useEffect, useState } from 'react';
import { 
    X, Loader2, Calendar, FileText, CheckCircle, XCircle, 
    User, Printer, Download, Clock, ShieldCheck, Mail,
    Sparkles, MoreVertical, Hash, ExternalLink, BadgeCheck
} from 'lucide-react';
import { getQuote } from '@/services/api';
import { formatCurrency } from '@/utils/formatCurrency';
import ApprovalStatus from '@/components/ApprovalStatus';
import { useAuth } from '@/context/AuthContext';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

interface QuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    quoteId: number;
    approvalRequestId?: number;
    onApprove?: (id: number) => void;
    onReject?: (id: number) => void;
}

export default function QuoteModal({
    isOpen,
    onClose,
    quoteId,
    approvalRequestId,
    onApprove,
    onReject
}: QuoteModalProps) {
    const { user } = useAuth();
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && quoteId) {
            setLoading(true);
            setError('');
            fetchQuote();
        } else {
            setQuote(null);
        }
    }, [isOpen, quoteId]);

    const fetchQuote = async () => {
        try {
            const data = await getQuote(quoteId);
            setQuote(data);
        } catch (err) {
            console.error('Failed to fetch Quote details', err);
            setError('Impossible de charger les détails du devis.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">

                {/* --- MASTERPIECE HEADER --- */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30">
                            <FileText className="text-white" size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className={clsx("text-2xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                                    Proposition Commerciale #{quoteId}
                                </h2>
                                {quote && <ApprovalStatus status={quote.status} />}
                            </div>
                            {quote && <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">{quote.client_name}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <Printer size={16} /> Imprimer
                        </button>
                        <button className="h-10 px-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/20">
                            <Download size={16} /> PDF
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors ml-2">
                            <X size={24} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* --- CONTENT --- */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96 text-slate-300">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" />
                            <p className="font-black text-[10px] uppercase tracking-widest">Génération de la proposition...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <XCircle className="mx-auto mb-6 text-rose-400" size={64} />
                            <p className="text-xl font-black text-slate-900 mb-2">{error}</p>
                            <button onClick={fetchQuote} className="text-sm font-bold text-indigo-600 hover:underline">Réessayer</button>
                        </div>
                    ) : quote ? (
                        <div className="space-y-12">
                            
                            {/* Document Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Info Cards */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-all">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                <User size={14} /> Partenaire Client
                                            </span>
                                            <p className="text-lg font-black text-slate-900">{quote.client_name}</p>
                                            <p className="text-sm font-bold text-slate-500 mt-0.5">{quote.client_email}</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-all">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                <Calendar size={14} /> Période de Validité
                                            </span>
                                            <p className="text-lg font-black text-slate-900 flex items-center gap-2">
                                                {new Date(quote.date).toLocaleDateString()}
                                                <Clock size={16} className="text-indigo-400" />
                                                {new Date(quote.valid_until).toLocaleDateString()}
                                            </p>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Expire dans 14 jours</p>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Détails de l'offre</h3>
                                        <div className="rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm bg-white">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50/50">
                                                    <tr>
                                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                                        <th className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qté</th>
                                                        <th className="p-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix Unit.</th>
                                                        <th className="p-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total H.T</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {quote.items.map((item: any) => (
                                                        <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                                            <td className="p-6">
                                                                <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{item.description}</p>
                                                            </td>
                                                            <td className="p-6 text-center">
                                                                <span className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-600">
                                                                    {item.quantity}
                                                                </span>
                                                            </td>
                                                            <td className="p-6 text-right text-slate-400 font-bold">
                                                                {formatCurrency(item.unit_price, user?.company?.currency)}
                                                            </td>
                                                            <td className="p-6 text-right font-black text-slate-900">
                                                                {formatCurrency(item.quantity * item.unit_price, user?.company?.currency)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-indigo-600 text-white">
                                                    <tr>
                                                        <td colSpan={3} className="p-8 text-right font-black uppercase text-[10px] tracking-[3px]">Total de la proposition</td>
                                                        <td className={clsx("p-8 text-right text-3xl font-black tracking-tighter", displayFont.className)}>
                                                            {formatCurrency(quote.total_amount, user?.company?.currency)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Column */}
                                <div className="space-y-6">
                                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                                        <h4 className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-2">
                                            <ShieldCheck size={20} className="text-indigo-600" />
                                            Sécurité & Garantie
                                        </h4>
                                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                            Ce devis est une proposition commerciale ferme. L'acceptation du devis entraîne la signature d'un contrat de vente.
                                        </p>
                                        <div className="space-y-4">
                                            <SidebarInfo label="N° Devis" value={`DQ-${quoteId}`} icon={<Hash size={14} />} />
                                            <SidebarInfo label="Émetteur" value={user?.company?.name || 'Kumba Business'} icon={<BadgeCheck size={14} />} />
                                            <SidebarInfo label="Référence" value="SALES-2024-001" icon={<FileText size={14} />} />
                                        </div>
                                    </div>

                                    <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Mail size={24} className="text-indigo-600" />
                                            <h4 className="font-black text-indigo-900 text-sm">Relance Auto</h4>
                                        </div>
                                        <p className="text-xs text-indigo-700/70 font-bold leading-relaxed">
                                            Voulez-vous activer la relance automatique pour ce devis si aucune réponse n'est reçue dans 3 jours ?
                                        </p>
                                        <button className="w-full py-3 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all">
                                            Activer la Relance
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* --- FOOTER CONTROLS --- */}
                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 rounded-2xl font-black text-sm transition-all shadow-sm"
                    >
                        Fermer l'aperçu
                    </button>

                    <div className="flex gap-4">
                        {approvalRequestId && onApprove && onReject && (
                            <>
                                <button
                                    onClick={() => onReject(approvalRequestId)}
                                    className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 font-black text-sm uppercase tracking-widest transition-all flex items-center gap-2"
                                >
                                    <XCircle size={18} />
                                    Refuser
                                </button>
                                <button
                                    onClick={() => onApprove(approvalRequestId)}
                                    className="px-10 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 font-black text-sm uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-emerald-600/20"
                                >
                                    <CheckCircle size={18} />
                                    Approuver la Prop.
                                </button>
                            </>
                        )}
                        {!approvalRequestId && quote?.status === 'APPROVED' && (
                            <button className="px-10 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-black text-sm uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-indigo-600/30">
                                <Mail size={18} /> Envoyer au Client
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SidebarInfo({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg text-slate-300 shadow-sm">{icon}</div>
            <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                <p className="text-xs font-black text-slate-900">{value}</p>
            </div>
        </div>
    );
}
