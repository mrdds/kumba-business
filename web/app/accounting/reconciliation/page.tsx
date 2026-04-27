'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/context/PreferencesContext';
import DashboardLayout from '@/app/dashboard-layout';
import {
    getJournalEntries,
    getAccounts,
    getReconciliationLines,
    getSmartMatches,
    matchTransaction,
    getBankAccounts,
    importBankStatement
} from '@/services/api';
import {
    Search,
    ArrowLeft,
    Check,
    X,
    History,
    ArrowRightLeft,
    ShieldCheck,
    Zap,
    AlertCircle,
    Wallet,
    FileUp,
    ChevronRight,
    HelpCircle,
    Info,
    CheckCircle2,
    Clock,
    Sparkles,
    FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ImportDataModal from '@/components/accounting/ImportDataModal';
import { exportToExcel } from '@/services/excelService';

// --- TYPES ---

interface BankTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'IN' | 'OUT';
    reference?: string;
    confidence?: number;
    suggestedEntryId?: number;
}

interface JournalEntry {
    id: number;
    date: string;
    reference: string;
    description: string;
    total_debit: number;
    total_credit: number;
    status: string;
}

interface ReconciliationLine {
    id: number;
    date: string;
    description: string;
    reference: string;
    amount: number;
    type: string;
    confidence_score: number;
    suggested_entry_id?: number;
}

// --- MOCK DATA FOR PROTOTYPE ---

const MOCK_BANK_TRANSACTIONS: BankTransaction[] = [
    { id: 'bt-1', date: '2026-04-20', description: 'VIREMENT RECU HUAWEI CI', amount: 4500000, type: 'IN', reference: 'VIR-99201', confidence: 0.95, suggestedEntryId: 101 },
    { id: 'bt-2', date: '2026-04-21', description: 'PAIEMENT LOYER AVRIL', amount: 350000, type: 'OUT', reference: 'CHQ-881', confidence: 0.88, suggestedEntryId: 102 },
    { id: 'bt-3', date: '2026-04-22', description: 'CASH DEPOSIT AGENCY', amount: 50000, type: 'IN', confidence: 0.45 },
    { id: 'bt-4', date: '2026-04-23', description: 'FEE BANK MONTHLY', amount: 15000, type: 'OUT', confidence: 0.99, suggestedEntryId: 104 },
];

export default function ReconciliationHub() {
    const router = useRouter();
    const { t } = useTranslation();
    const { formatCurrency } = usePreferences();

    const [recoLines, setRecoLines] = useState < ReconciliationLine[] > ([]);
    const [loading, setLoading] = useState(true);
    const [journalEntries, setJournalEntries] = useState < any[] > ([]);
    const [activeLineIndex, setActiveLineIndex] = useState(0);
    const [matchingSuggestions, setMatchingSuggestions] = useState < any[] > ([]);
    const [isMatching, setIsMatching] = useState(false);
    const [stats, setStats] = useState({ matched: 12, pending: 4, skipped: 2 });
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [entries, lines, accounts] = await Promise.all([
                    getJournalEntries('POSTED'),
                    getReconciliationLines(),
                    getBankAccounts()
                ]);
                setJournalEntries(entries);
                setRecoLines(lines);
                setBankAccounts(accounts);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Fetch smart matches when active line changes
    useEffect(() => {
        const fetchMatches = async () => {
            if (recoLines.length > 0 && recoLines[activeLineIndex]) {
                try {
                    setIsMatching(true);
                    const matches = await getSmartMatches(recoLines[activeLineIndex].id);
                    setMatchingSuggestions(matches);
                } catch (error) {
                    console.error('Error fetching matches:', error);
                } finally {
                    setIsMatching(false);
                }
            }
        };
        fetchMatches();
    }, [activeLineIndex, recoLines]);

    const activeLine = recoLines[activeLineIndex];
    const suggestedEntry = journalEntries.find(e => e.id === activeLine?.suggested_entry_id);

    const handleMatch = async (entryId: number) => {
        if (!activeLine) return;

        try {
            await matchTransaction(activeLine.id, entryId);
            setStats(prev => ({ ...prev, matched: prev.matched + 1, pending: prev.pending - 1 }));

            // Move to next line
            if (activeLineIndex < recoLines.length - 1) {
                setActiveLineIndex(prev => prev + 1);
            } else {
                // All done! (Or refresh)
                const freshLines = await getReconciliationLines();
                setRecoLines(freshLines);
                setActiveLineIndex(0);
            }
        } catch (error) {
            console.error('Error matching transaction:', error);
        }
    };

    const handleSkip = () => {
        setStats(prev => ({ ...prev, skipped: prev.skipped + 1, pending: prev.pending - 1 }));
        if (activeLineIndex < recoLines.length - 1) {
            setActiveLineIndex(prev => prev + 1);
        } else {
            setActiveLineIndex(-1);
        }
    };

    const handleImportStatement = async (data: any[]) => {
        if (bankAccounts.length === 0) return;
        
        // Pick first account for now
        const bankAccountId = bankAccounts[0].id;
        
        const lines = data.map(row => ({
            date: row.date || row.Date || new Date().toISOString().split('T')[0],
            description: row.description || row.Description || row.Libelle || '',
            reference: String(row.reference || row.Reference || ''),
            amount: Number(row.amount || row.Amount || row.Montant || 0),
            type: (row.type || row.Type || (Number(row.amount || 0) > 0 ? 'IN' : 'OUT'))
        }));

        await importBankStatement({
            bank_account_id: bankAccountId,
            file_name: 'Import Excel',
            start_date: lines[0]?.date,
            end_date: lines[lines.length - 1]?.date,
            lines: lines
        });

        // Refresh
        const freshLines = await getReconciliationLines();
        setRecoLines(freshLines);
        setActiveLineIndex(0);
    };

    const handleExport = () => {
        const dataToExport = recoLines.map(line => ({
            Date: line.date,
            Description: line.description,
            Reference: line.reference,
            Montant: line.amount,
            Type: line.type,
            Score_IA: line.confidence_score
        }));
        exportToExcel(dataToExport, `Rapprochement_${new Date().toISOString().split('T')[0]}`);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">Initialisation de l'IA de rapprochement...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto space-y-8 pb-12">

                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <button
                            onClick={() => router.push('/accounting')}
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm mb-4 transition-colors group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Retour au Cockpit
                        </button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hub de Rapprochement</h1>
                            <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100 flex items-center gap-1.5 shadow-sm">
                                <Zap size={12} className="fill-blue-600" />
                                Smart Match Activé
                            </div>
                        </div>
                        <p className="text-slate-500 font-medium mt-1">Validez vos transactions bancaires par glissement intelligent</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                        <StatMini label="Matchs" value={stats.matched} color="text-emerald-600" />
                        <div className="w-px h-8 bg-slate-100" />
                        <StatMini label="En attente" value={stats.pending} color="text-amber-600" />
                        <div className="w-px h-8 bg-slate-100" />
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all"
                        >
                            <FileSpreadsheet size={14} />
                            Exporter
                        </button>
                        <button 
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs transition-all hover:scale-105 active:scale-95"
                        >
                            <FileUp size={14} />
                            Importer Relevé
                        </button>
                    </div>
                </div>

                <ImportDataModal 
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={handleImportStatement}
                    title="Importer un Relevé Bancaire"
                    description="Téléchargez votre relevé au format Excel. Colonnes attendues: 'date', 'description', 'amount'."
                />

                {/* --- MAIN HUB AREA --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center min-h-[500px]">

                    {/* LEFT: BANK STATEMENT CONTEXT */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Wallet size={16} />
                                Source de Données
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 text-sm">SGCI - Main Account</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">.... 8829-01</div>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] text-slate-400 font-black uppercase mb-1">Dernière Sync</div>
                                    <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                        <Clock size={12} />
                                        Aujourd'hui, 09:45
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles size={18} />
                                <h3 className="text-xs font-black uppercase tracking-widest">Assistant IA</h3>
                            </div>
                            <p className="text-xs font-medium text-blue-100 leading-relaxed mb-4">
                                J'ai analysé votre relevé et trouvé 12 correspondances exactes. Validez les 4 restantes pour clôturer votre période.
                            </p>
                            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '75%' }}
                                    className="h-full bg-white rounded-full"
                                />
                            </div>
                            <div className="mt-2 text-[10px] font-bold text-right">75% Clôturé</div>
                        </div>
                    </div>

                    {/* CENTER: THE SWIPE ENGINE */}
                    <div className="lg:col-span-6 relative perspective-1000">
                        <AnimatePresence mode="wait">
                            {activeLineIndex !== -1 && activeLine ? (
                                <motion.div
                                    key={activeLine.id}
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 1.1, x: 200, rotate: 10 }}
                                    className="relative"
                                >
                                    {/* THE MATCHING CARD */}
                                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
                                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">

                                            {/* LEFT SIDE: BANK (REALITY) */}
                                            <div className="p-10 space-y-8">
                                                <div className="space-y-1">
                                                    <div className="px-3 py-1 bg-slate-100 rounded-full w-fit text-[10px] font-black text-slate-500 uppercase tracking-widest">Relevé Bancaire</div>
                                                    <h4 className="text-2xl font-black text-slate-900 leading-tight pt-2">{activeLine.description}</h4>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                                                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Date</span>
                                                        <span className="text-slate-900 font-black">{activeLine.date}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                                                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Référence</span>
                                                        <span className="text-slate-900 font-black">{activeLine.reference || '—'}</span>
                                                    </div>
                                                </div>

                                                <div className="pt-4">
                                                    <div className={`text-4xl font-black tabular-nums ${activeLine.type === 'IN' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                        {activeLine.type === 'IN' ? '+' : '−'} {formatCurrency(activeLine.amount)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIGHT SIDE: ERP (SUGGESTION) */}
                                            <div className="p-10 bg-slate-50/50 flex flex-col justify-between">
                                                {isMatching ? (
                                                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                                                        <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recherche de correspondances...</p>
                                                    </div>
                                                ) : suggestedEntry || matchingSuggestions.length > 0 ? (
                                                    <div className="space-y-6">
                                                        <div className="flex justify-between items-start">
                                                            <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full w-fit text-[10px] font-black uppercase tracking-widest">Suggestion IA</div>
                                                            <div className="flex items-center gap-1 text-emerald-600 font-black text-xs">
                                                                <Zap size={12} className="fill-emerald-600" />
                                                                {Math.round((matchingSuggestions[0]?.confidence || activeLine.confidence_score || 0.9) * 100)}% Match
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            {(matchingSuggestions.length > 0 ? matchingSuggestions : [suggestedEntry]).filter(Boolean).map((match: any, idx: number) => (
                                                                <button
                                                                    key={match.entry_id || match.id}
                                                                    onClick={() => handleMatch(match.entry_id || match.id)}
                                                                    className={`w-full p-4 text-left rounded-2xl border transition-all group ${idx === 0
                                                                        ? 'bg-white border-emerald-100 shadow-sm shadow-emerald-100 hover:border-emerald-300'
                                                                        : 'bg-white/50 border-slate-200 hover:border-blue-300 hover:bg-white'
                                                                        }`}
                                                                >
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                            {idx === 0 ? 'Meilleur Match' : 'Alternative'}
                                                                        </div>
                                                                        {match.confidence && (
                                                                            <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">
                                                                                Confiance {match.confidence}%
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="font-bold text-slate-900 text-xs line-clamp-1">{match.description}</div>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="font-mono font-black text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                                                            {match.reference || `JE-${match.entry_id || match.id}`}
                                                                        </span>
                                                                        <span className="text-[9px] text-slate-400 font-bold">{match.date}</span>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                                        <div className="p-4 bg-slate-100 rounded-full">
                                                            <Search className="text-slate-400" size={32} />
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-900">Aucun Match Auto</div>
                                                            <p className="text-xs text-slate-500 mt-1">Créez une nouvelle écriture ou recherchez manuellement.</p>
                                                        </div>
                                                        <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-50 transition-all">
                                                            Saisie Manuelle
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between gap-4">
                                            <button
                                                onClick={handleSkip}
                                                className="flex-1 py-4 px-6 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <X size={20} />
                                                Passer
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const match = matchingSuggestions[0] || suggestedEntry;
                                                    if (match) handleMatch(match.entry_id || match.id);
                                                }}
                                                disabled={!suggestedEntry && matchingSuggestions.length === 0}
                                                className="flex-[2] py-4 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                                            >
                                                <CheckCircle2 size={24} />
                                                Valider Meilleur Match
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-16 text-center space-y-6"
                                >
                                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check size={48} className="stroke-[3]" />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900">Session Clôturée !</h2>
                                    <p className="text-slate-500 font-medium max-w-sm mx-auto">
                                        Toutes les transactions de la période ont été rapprochées avec succès. Votre comptabilité est à jour.
                                    </p>
                                    <button
                                        onClick={() => router.push('/accounting')}
                                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95"
                                    >
                                        Retour au Cockpit
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* RIGHT: SHORTCUTS & HISTORY */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <History size={16} />
                                Récemment Matchés
                            </h3>
                            <div className="space-y-4">
                                <MatchedItem label="Huawei CI - Fact. 882" amount={4500000} date="Il y a 2 min" />
                                <MatchedItem label="SGCI Bank Fees" amount={15000} date="Il y a 5 min" />
                                <MatchedItem label="Payroll Mars 2026" amount={12800000} date="Hier" />
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-3xl p-6 text-white">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Raccourcis</h3>
                            <div className="space-y-2">
                                <ShortcutBtn icon={<FileUp size={14} />} label="Nouveau Relevé" />
                                <ShortcutBtn icon={<ArrowRightLeft size={14} />} label="Historique Lettrage" />
                                <ShortcutBtn icon={<HelpCircle size={14} />} label="Centre d'Aide" />
                            </div>
                        </div>
                    </div>

                </div>

                <style jsx global>{`
                .perspective-1000 {
                    perspective: 1000px;
                }
            `}
                </style>
            </div>
        </DashboardLayout>
    );
}

// --- SUB-COMPONENTS ---

function StatMini({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="px-4 text-center">
            <div className={`text-xl font-black tabular-nums ${color}`}>{value}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</div>
        </div>
    );
}

function MatchedItem({ label, amount, date }: { label: string; amount: number; date: string }) {
    const { formatCurrency } = usePreferences();
    return (
        <div className="flex justify-between items-center gap-3">
            <div className="min-w-0">
                <div className="text-xs font-black text-slate-900 truncate">{label}</div>
                <div className="text-[10px] text-slate-400 font-bold">{date}</div>
            </div>
            <div className="text-xs font-black text-emerald-600 tabular-nums">
                {formatCurrency(amount)}
            </div>
        </div>
    );
}

function ShortcutBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <button className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all text-xs font-bold text-slate-300 hover:text-white group">
            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-blue-600 transition-colors">
                {icon}
            </div>
            {label}
        </button>
    );
}
