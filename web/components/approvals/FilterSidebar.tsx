'use client';
import clsx from 'clsx';

export default function FilterSidebar({ filters, activeFilter, onFilterChange }: any) {
    return (
        <div className="space-y-8 sticky top-8">
            <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-6 ml-2">Navigation</h4>
                <div className="space-y-2">
                    {filters.map((f: any) => (
                        <button 
                            key={f.id}
                            onClick={() => onFilterChange(f.id)}
                            className={clsx(
                                "w-full flex items-center justify-between px-6 py-4 rounded-[20px] transition-all group",
                                activeFilter === f.id 
                                    ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-100" 
                                    : "text-slate-400 hover:bg-white hover:text-slate-600"
                            )}
                        >
                            <span className="text-[11px] font-black uppercase tracking-widest">{f.label}</span>
                            {f.count > 0 && (
                                <span className={clsx(
                                    "text-[9px] font-black px-2 py-0.5 rounded-full",
                                    activeFilter === f.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                )}>
                                    {f.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
