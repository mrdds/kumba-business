'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/context/PreferencesContext';
import DashboardLayout from '@/app/dashboard-layout';
import { getJournalEntries } from '@/services/api';
import JournalEntryModal from '@/components/accounting/JournalEntryModal';
import {
    Search,
    ArrowLeft,
    Plus,
    ChevronRight,
    ArrowRightLeft,
    Filter,
    BookOpen,
    Calendar,
    FileText,
    Clock,
    User,
    CheckCircle2,
    AlertCircle,
    Hash,
    MoreHorizontal,
    History,
    FileSpreadsheet
} from 'lucide-react';
import ImportDataModal from '@/components/accounting/ImportDataModal';
import { exportToExcel } from '@/services/excelService';
import api from '@/services/api';

interface JournalLine {
    id: number;
    account_id: number;
    account_code: string;
    account_name: string;
    debit: number;
    credit: number;
    description: string;
}

interface JournalEntry {
    id: number;
    date: string;
    reference: string;
    description: string;
    status: string;
    entry_type: string;
    total_debit: number;
    total_credit: number;
    is_balanced: boolean;
    lines: JournalLine[];
    created_at: string;
    posted_at: string | null;
}

export default function JournalEntries() {
    const router = useRouter();
    const { t } = useTranslation();
    const { formatCurrency } = usePreferences();

    const [entries, setEntries] = useState < JournalEntry[] > ([]);
    const [selectedEntry, setSelectedEntry] = useState < JournalEntry | null > (null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState < string > ('all');
    const [searchTerm, setSearchTerm] = useState < string > ('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const fetchEntries = async () => {
        try {
            setLoading(true);
            const filter = statusFilter !== 'all' ? statusFilter : undefined;
            const data = await getJournalEntries(filter);
            setEntries(data);
            if (data.length > 0 && !selectedEntry) {
                setSelectedEntry(data[0]);
            }
        } catch (error) {
            console.error('Error fetching journal entries:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, [statusFilter]);

    const handleExport = () => {
        const dataToExport = entries.flatMap(entry => 
            entry.lines.map(line => ({
                Date: entry.date,
                Reference: entry.reference || `JE-${entry.id}`,
                Description_Ecriture: entry.description,
                Type: entry.entry_type,
                Compte_Code: line.account_code,
                Compte_Nom: line.account_name,
                Debit: line.debit,
                Credit: line.credit,
                Libelle_Ligne: line.description
            }))
        );
        exportToExcel(dataToExport, `Journal_General_${new Date().toISOString().split('T')[0]}`);
    };

    const handleImport = async (data: any[]) => {
        // Group lines by reference
        const entriesMap = new Map<string, any>();
        
        data.forEach(row => {
            const ref = String(row.reference || row.Reference || row.date || 'UNSET');
            if (!entriesMap.has(ref)) {
                entriesMap.set(ref, {
                    date: row.date || row.Date || new Date().toISOString().split('T')[0],
                    reference: ref === 'UNSET' ? '' : ref,
                    description: row.description || row.Description || row.Description_Ecriture || 'Imported Entry',
                    entry_type: row.entry_type || row.Type || 'MANUAL',
                    lines: []
                });
            }
            
            const entry = entriesMap.get(ref);
            entry.lines.push({
                account_code: String(row.account_code || row.Compte_Code || ''),
                debit: Number(row.debit || row.Debit || 0),
                credit: Number(row.credit || row.Credit || 0),
                description: row.description_line || row.Libelle_Ligne || ''
            });
        });

        const entriesToImport = Array.from(entriesMap.values()).filter(e => e.lines.length > 0);
        await api.post('/accounting/journal-entries/bulk', entriesToImport);
        await fetchEntries();
    };

    const filteredEntries = entries.filter(e =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.reference.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">{t('accounting.loading')}</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-[1600px] mx-auto space-y-8 pb-12">

                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <button
                            onClick={() => router.push('/accounting')}
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm mb-4 transition-colors group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Retour au Dashboard
                        </button>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Journal Général</h1>
                        <p className="text-slate-500 font-medium mt-1">Registre chronologique des écritures comptables immuables</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
                        >
                            <FileSpreadsheet size={18} />
                            Exporter
                        </button>
                        <button 
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
                        >
                            <Plus size={18} />
                            Importer
                        </button>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        >
                            <Plus size={18} />
                            Nouvelle Écriture
                        </button>
                    </div>
                </div>

                <ImportDataModal 
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={handleImport}
                    title="Importer des Écritures"
                    description="Importez vos journaux comptables. Le fichier doit contenir les colonnes 'date', 'reference', 'account_code', 'debit' et 'credit'."
                />

                <JournalEntryModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={fetchEntries}
                />

                {/* --- CONTENT BOX --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-280px)] min-h-[600px]">

                    {/* LEFT: ENTRIES LIST */}
                    <div className="lg:col-span-5 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-50 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Référence, libellé..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="flex gap-2">
                                <FilterBtn active={statusFilter === 'all'} label="Tout" onClick={() => setStatusFilter('all')} />
                                <FilterBtn active={statusFilter === 'POSTED'} label="Comptabilisé" onClick={() => setStatusFilter('POSTED')} />
                                <FilterBtn active={statusFilter === 'DRAFT'} label="Brouillon" onClick={() => setStatusFilter('DRAFT')} />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                            {filteredEntries.map((entry) => (
                                <div
                                    key={entry.id}
                                    onClick={() => setSelectedEntry(entry)}
                                    className={`p-6 cursor-pointer transition-all relative group ${selectedEntry?.id === entry.id ? 'bg-blue-50/50' : 'hover:bg-slate-50/80'
                                        }`}
                                >
                                    {selectedEntry?.id === entry.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
                                    )}
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-black text-xs text-blue-600 bg-blue-100/50 px-2 py-1 rounded">
                                                {entry.reference || `JE-${entry.id}`}
                                            </span>
                                            <StatusBadge status={entry.status} />
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                                            <Calendar size={12} />
                                            {entry.date}
                                        </div>
                                    </div>
                                    <div className="font-bold text-slate-900 text-sm mb-3 line-clamp-1">{entry.description}</div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Clock size={12} />
                                            {entry.entry_type}
                                        </div>
                                        <div className="font-black text-slate-900 tabular-nums text-sm">
                                            {formatCurrency(entry.total_debit)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: ENTRY DETAILS */}
                    <div className="lg:col-span-7 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col overflow-hidden">
                        {selectedEntry ? (
                            <>
                                <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="text-2xl font-black text-slate-900">{selectedEntry.reference || `Écriture #${selectedEntry.id}`}</h2>
                                                <StatusBadge status={selectedEntry.status} big />
                                            </div>
                                            <p className="text-slate-500 font-medium">{selectedEntry.description}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-600">
                                                <History size={20} />
                                            </button>
                                            <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-600">
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6">
                                        <DetailItem icon={<Calendar size={16} />} label="Date d'opération" value={selectedEntry.date} />
                                        <DetailItem icon={<Hash size={16} />} label="Type d'entrée" value={selectedEntry.entry_type} />
                                        <DetailItem icon={<User size={16} />} label="Créé par" value="Admin" />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8">
                                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50">
                                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Compte</th>
                                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Débit</th>
                                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Crédit</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {selectedEntry.lines.map((line) => (
                                                    <tr key={line.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-mono font-black text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                                    {line.account_code}
                                                                </span>
                                                                <div>
                                                                    <div className="font-bold text-slate-900">{line.account_name}</div>
                                                                    {line.description && (
                                                                        <div className="text-[10px] text-slate-400 font-medium">{line.description}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-black text-slate-900 tabular-nums">
                                                            {line.debit > 0 ? formatCurrency(line.debit) : '—'}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-black text-slate-900 tabular-nums">
                                                            {line.credit > 0 ? formatCurrency(line.credit) : '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-slate-900 text-white font-black">
                                                <tr>
                                                    <td className="px-6 py-5 text-[10px] uppercase tracking-[0.2em]">Totaux de l'écriture</td>
                                                    <td className="px-6 py-5 text-right tabular-nums">{formatCurrency(selectedEntry.total_debit)}</td>
                                                    <td className="px-6 py-5 text-right tabular-nums">{formatCurrency(selectedEntry.total_credit)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    {/* BALANCE CHECK */}
                                    <div className={`mt-8 p-6 rounded-[2rem] border flex items-center justify-between ${selectedEntry.is_balanced
                                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                            : 'bg-rose-50 border-rose-100 text-rose-700'
                                        }`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${selectedEntry.is_balanced ? 'bg-white text-emerald-600' : 'bg-white text-rose-600 shadow-sm'}`}>
                                                {selectedEntry.is_balanced ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black uppercase tracking-widest">
                                                    {selectedEntry.is_balanced ? 'Écriture Équilibrée' : 'Écriture Déséquilibrée'}
                                                </div>
                                                <p className="text-xs font-medium opacity-80 mt-1">
                                                    {selectedEntry.is_balanced
                                                        ? 'Cette transaction respecte le principe de la partie double.'
                                                        : 'Alerte: Les débits ne correspondent pas aux crédits.'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black uppercase tracking-tighter opacity-60">Différence</div>
                                            <div className="text-xl font-black tabular-nums">
                                                {formatCurrency(Math.abs(selectedEntry.total_debit - selectedEntry.total_credit))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-12">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <FileText size={40} />
                                </div>
                                <h3 className="text-xl font-black text-slate-400">Aucune écriture sélectionnée</h3>
                                <p className="text-slate-400 font-medium text-center max-w-xs mt-2">Sélectionnez une transaction dans la liste pour visualiser ses détails et ses imputations.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────

function FilterBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                }`}
        >
            {label}
        </button>
    );
}

function StatusBadge({ status, big = false }: { status: string; big?: boolean }) {
    const isPosted = status === 'POSTED';
    return (
        <span className={`rounded-full font-black uppercase tracking-widest flex items-center gap-1.5 ${big ? 'px-4 py-1.5 text-[10px]' : 'px-2 py-0.5 text-[8px]'
            } ${isPosted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
            <div className={`w-1 h-1 rounded-full ${isPosted ? 'bg-emerald-600' : 'bg-amber-600'}`} />
            {isPosted ? 'Comptabilisé' : 'Brouillon'}
        </span>
    );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                <div className="text-slate-300">{icon}</div>
                {label}
            </div>
            <div className="text-sm font-black text-slate-900">{value}</div>
        </div>
    );
}
