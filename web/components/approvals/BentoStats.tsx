'use client';
import { Layers, Zap, TrendingUp } from 'lucide-react';
import { Outfit } from 'next/font/google';
import clsx from 'clsx';

const displayFont = Outfit({ subsets: ['latin'], weight: ['800'] });

export default function BentoStats({ totalPending }: { totalPending: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500 rounded-full blur-3xl opacity-20" />
                <Layers className="text-indigo-400 mb-6" size={32} />
                <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 mb-1">Queue Active</p>
                <h3 className={clsx("text-5xl font-black tracking-tighter", displayFont.className)}>{totalPending}</h3>
                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest italic opacity-60">Action Requise</p>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                <Zap className="text-amber-500 mb-6" size={32} />
                <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 mb-1">Efficacité</p>
                <h3 className={clsx("text-5xl font-black tracking-tighter text-slate-900", displayFont.className)}>1.2j</h3>
                <p className="text-xs font-bold text-emerald-500 mt-2 uppercase tracking-widest italic">Stable</p>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                <TrendingUp className="text-indigo-500 mb-6" size={32} />
                <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 mb-1">Zone Chaude</p>
                <h3 className={clsx("text-4xl font-black tracking-tighter text-slate-900 mt-2", displayFont.className)}>Achats</h3>
                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest italic opacity-60">Volume élevé</p>
            </div>
        </div>
    );
}
