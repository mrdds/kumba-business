'use client';
import { motion } from 'framer-motion';
import { FileText, Calendar, User, ArrowUpRight, ChevronRight, Check, X } from 'lucide-react';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';
import Link from 'next/link';

const displayFont = Outfit({ subsets: ['latin'], weight: ['800'] });

export default function ExecutiveCard({ req, onApprove, onReject, onViewDetails, onTimeline, getLink, isProcessing }: any) {
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 50 }}
            whileHover={{ y: -4 }}
            className={clsx(
                "group bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all relative overflow-hidden",
                isProcessing && "opacity-50 pointer-events-none"
            )}
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                    <div className="h-16 w-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <FileText size={32} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                            <h3 className={clsx("text-2xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                                {req.document_type_label || req.content_type_model}
                            </h3>
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                                #{req.object_id}
                            </span>
                        </div>
                        {req.description && (
                            <p className="text-slate-500 font-medium text-sm line-clamp-1 mb-4">{req.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                            <span className="flex items-center gap-1.5"><Calendar size={12} className="opacity-40" /> {new Date(req.created_at).toLocaleDateString('fr-FR')}</span>
                            <span className="h-1 w-1 bg-slate-200 rounded-full" />
                            <span className="flex items-center gap-1.5"><User size={12} className="opacity-40" /> {req.created_by_name || 'Système'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onTimeline(req.id)}
                        className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                        title="Circuit d'approbation"
                    >
                        <ArrowUpRight size={20} />
                    </button>
                    <Link
                        href={getLink(req)}
                        onClick={(e) => onViewDetails(req, e)}
                        className="px-6 py-4 bg-slate-50 text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2"
                    >
                        Détails
                    </Link>
                    <button
                        onClick={() => onReject(req.id)}
                        className="h-12 w-12 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                    >
                        <X size={20} />
                    </button>
                    <button
                        onClick={() => onApprove(req.id)}
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[2px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-2"
                    >
                        <Check size={18} />
                        Approuver
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
