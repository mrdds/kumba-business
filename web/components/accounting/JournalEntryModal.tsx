'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, CheckCircle2, Search, Calculator } from 'lucide-react';
import { getAccounts, createJournalEntry } from '@/services/api';
import { usePreferences } from '@/context/PreferencesContext';

interface Account {
    id: number;
    code: string;
    name: string;
    type: string;
    balance: number;
}

interface JournalLine {
    account_id: number;
    debit: number;
    credit: number;
    description: string;
}

interface JournalEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function JournalEntryModal({ isOpen, onClose, onSuccess }: JournalEntryModalProps) {
    const { formatCurrency } = usePreferences();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        entry_type: 'MANUAL',
    });

    const [lines, setLines] = useState<JournalLine[]>([
        { account_id: 0, debit: 0, credit: 0, description: '' },
        { account_id: 0, debit: 0, credit: 0, description: '' },
    ]);

    useEffect(() => {
        if (isOpen) {
            fetchAccounts();
        }
    }, [isOpen]);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const data = await getAccounts();
            setAccounts(data);
        } catch (err) {
            console.error('Error fetching accounts:', err);
            setError('Impossible de charger le plan comptable.');
        } finally {
            setLoading(false);
        }
    };

    const addLine = () => {
        setLines([...lines, { account_id: 0, debit: 0, credit: 0, description: '' }]);
    };

    const removeLine = (index: number) => {
        if (lines.length <= 2) return;
        const newLines = [...lines];
        newLines.splice(index, 1);
        setLines(newLines);
    };

    const updateLine = (index: number, field: keyof JournalLine, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };
        
        // If debit is entered, clear credit and vice versa
        if (field === 'debit' && value > 0) {
            newLines[index].credit = 0;
        } else if (field === 'credit' && value > 0) {
            newLines[index].debit = 0;
        }
        
        setLines(newLines);
    };

    const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = totalDebit > 0 && totalDebit === totalCredit;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBalanced) {
            setError('L\'écriture doit être équilibrée (Débit = Crédit).');
            return;
        }

        const validLines = lines.filter(l => l.account_id !== 0 && (l.debit > 0 || l.credit > 0));
        if (validLines.length < 2) {
            setError('L\'écriture doit comporter au moins deux lignes valides.');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            await createJournalEntry({
                ...formData,
                lines: validLines
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error creating journal entry:', err);
            setError(err.response?.data?.message || 'Erreur lors de la création de l\'écriture.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl shadow-slate-950/20 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
                
                {/* --- HEADER --- */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
                            <Plus className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Nouvelle Écriture Journal</h2>
                            <p className="text-sm text-slate-500 font-medium">Saisie manuelle des transactions au livre journal</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in slide-in-from-top-2">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {/* --- MAIN INFO --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date d'opération</label>
                            <input 
                                type="date" 
                                required
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Référence (Optionnel)</label>
                            <input 
                                type="text" 
                                placeholder="ex: FA-2024-001"
                                value={formData.reference}
                                onChange={e => setFormData({...formData, reference: e.target.value})}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type d'écriture</label>
                            <select 
                                value={formData.entry_type}
                                onChange={e => setFormData({...formData, entry_type: e.target.value})}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                            >
                                <option value="MANUAL">Saisie Manuelle</option>
                                <option value="SALARY">Paie & Salaires</option>
                                <option value="TAX">Impôts & Taxes</option>
                                <option value="PURCHASE">Achat / Dépense</option>
                                <option value="SALE">Vente / Revenu</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Libellé Global</label>
                        <input 
                            type="text" 
                            required
                            placeholder="Description de la transaction..."
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>

                    {/* --- LINES TABLE --- */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Calculator size={18} className="text-blue-600" />
                                Imputations Comptables
                            </h3>
                            <button 
                                type="button"
                                onClick={addLine}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all active:scale-95"
                            >
                                <Plus size={14} /> Ajouter une ligne
                            </button>
                        </div>

                        <div className="rounded-[2rem] border border-slate-100 overflow-hidden bg-white shadow-sm">
                            <table className="w-full">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Compte</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Débit</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Crédit</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {lines.map((line, idx) => (
                                        <tr key={idx} className="group hover:bg-slate-50/30 transition-all">
                                            <td className="px-4 py-3">
                                                <select 
                                                    required
                                                    value={line.account_id}
                                                    onChange={e => updateLine(idx, 'account_id', Number(e.target.value))}
                                                    className="w-full bg-transparent border-none text-sm font-bold text-slate-900 focus:ring-0 cursor-pointer"
                                                >
                                                    <option value={0}>Sélectionner un compte...</option>
                                                    {accounts.map(acc => (
                                                        <option key={acc.id} value={acc.id}>
                                                            {acc.code} - {acc.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="text" 
                                                    placeholder="Détail (optionnel)"
                                                    value={line.description}
                                                    onChange={e => updateLine(idx, 'description', e.target.value)}
                                                    className="w-full bg-transparent border-none text-sm font-medium text-slate-600 focus:ring-0 placeholder:text-slate-300"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={line.debit || ''}
                                                    onChange={e => updateLine(idx, 'debit', Number(e.target.value))}
                                                    className="w-full bg-transparent border-none text-sm font-black text-slate-900 text-right focus:ring-0 tabular-nums placeholder:text-slate-300"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={line.credit || ''}
                                                    onChange={e => updateLine(idx, 'credit', Number(e.target.value))}
                                                    className="w-full bg-transparent border-none text-sm font-black text-slate-900 text-right focus:ring-0 tabular-nums placeholder:text-slate-300"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button 
                                                    type="button"
                                                    onClick={() => removeLine(idx)}
                                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-900 text-white">
                                    <tr>
                                        <td colSpan={2} className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Totaux de l'écriture</td>
                                        <td className="px-6 py-4 text-right font-black text-lg tabular-nums">{formatCurrency(totalDebit)}</td>
                                        <td className="px-6 py-4 text-right font-black text-lg tabular-nums">{formatCurrency(totalCredit)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* --- BALANCE CHECKER --- */}
                    <div className={`p-6 rounded-[2rem] border-2 transition-all duration-500 flex items-center justify-between ${isBalanced 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                        : 'bg-rose-50 border-rose-100 text-rose-700'
                    }`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl shadow-sm ${isBalanced ? 'bg-white text-emerald-600' : 'bg-white text-rose-600'}`}>
                                {isBalanced ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}
                            </div>
                            <div>
                                <div className="text-base font-black uppercase tracking-widest">
                                    {isBalanced ? 'Équilibre Parfait' : 'Déséquilibre Détecté'}
                                </div>
                                <p className="text-sm font-medium opacity-80 mt-0.5">
                                    {isBalanced 
                                        ? 'L\'écriture respecte le principe de la partie double.' 
                                        : `Il manque ${formatCurrency(difference)} pour équilibrer.`}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black uppercase tracking-tighter opacity-60">Différence</div>
                            <div className="text-3xl font-black tabular-nums tracking-tighter">
                                {formatCurrency(difference)}
                            </div>
                        </div>
                    </div>
                </form>

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
                        type="submit"
                        onClick={handleSubmit}
                        disabled={!isBalanced || submitting}
                        className="px-10 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-2xl font-black text-base shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-3"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <CheckCircle2 size={20} />
                        )}
                        Enregistrer l'Écriture
                    </button>
                </div>
            </div>
        </div>
    );
}
