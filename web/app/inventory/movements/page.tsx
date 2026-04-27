'use client';

import { useState } from 'react';
import DashboardLayout from '@/app/dashboard-layout';
import { 
    ArrowLeft, Search, Filter, ArrowUpRight, ArrowDownLeft, 
    Download, Calendar, Box, User, History, TrendingUp,
    Sparkles, MoreHorizontal, Package, XCircle, Clock, FileText,
    CheckCircle2, AlertCircle, Info, Printer
} from 'lucide-react';
import { usePreferences } from '@/context/PreferencesContext';
import { Outfit } from 'next/font/google';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';
import Link from 'next/link';
import { getInventoryMovements, getUserProfile } from '@/services/api';
import { useEffect } from 'react';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function StockMovementsPage() {
    const { formatCurrency } = usePreferences();
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState<'all' | '7d' | '30d'>('all');
    const [activeActionMenu, setActiveActionMenu] = useState<number | null>(null);
    const [viewingMovement, setViewingMovement] = useState<any>(null);
    const [companyName, setCompanyName] = useState('OURSPACE ERP');
    const [companyLogo, setCompanyLogo] = useState<string | null>(null);
    const [companyActivity, setCompanyActivity] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mvData, userData] = await Promise.all([
                    getInventoryMovements(),
                    getUserProfile()
                ]);
                setMovements(mvData);
                if (userData?.company?.name) {
                    setCompanyName(userData.company.name);
                    if (userData.company.logo) setCompanyLogo(userData.company.logo);
                    if (userData.company.sector) setCompanyActivity(userData.company.sector);
                } else if (userData?.company_name) {
                    setCompanyName(userData.company_name);
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredMovements = movements.filter(m => {
        const matchesSearch = m.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             m.reason.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (timeFilter === 'all') return matchesSearch;
        
        const mDate = new Date(m.date);
        const now = new Date();
        const diffDays = Math.ceil((now.getTime() - mDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (timeFilter === '7d') return matchesSearch && diffDays <= 7;
        if (timeFilter === '30d') return matchesSearch && diffDays <= 30;
        
        return matchesSearch;
    });

    const stats = {
        in: filteredMovements.filter(m => m.type === 'IN').reduce((acc, m) => acc + Number(m.quantity), 0),
        out: filteredMovements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + Number(m.quantity), 0),
    };

    const handleGenerateMonthlyReport = () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthMovements = movements.filter(m => {
            const d = new Date(m.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const monthStats = {
            in: monthMovements.filter(m => m.type === 'IN').reduce((acc, m) => acc + Number(m.quantity), 0),
            out: monthMovements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + Number(m.quantity), 0),
        };

        const win = window.open('', '_blank');
        if (!win) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Rapport Logistique - ${format(now, 'MMMM yyyy', { locale: fr })}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700;900&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Outfit', sans-serif; color: #0f172a; margin: 0; padding: 50px; line-height: 1.5; background: #fff; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #4f46e5; padding-bottom: 30px; margin-bottom: 40px; }
                    .logo-box { display: flex; align-items: center; gap: 10px; }
                    .company { font-weight: 800; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
                    .report-title { text-align: right; }
                    .report-title h1 { margin: 0; font-size: 28px; font-weight: 900; text-transform: uppercase; color: #1e293b; }
                    .report-title p { margin: 5px 0 0; color: #4f46e5; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
                    
                    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 50px; }
                    .kpi-card { padding: 30px; border-radius: 32px; background: #f8fafc; border: 1px solid #f1f5f9; position: relative; overflow: hidden; }
                    .kpi-card::after { content: ''; position: absolute; right: -20px; top: -20px; width: 60px; height: 60px; background: #4f46e5; opacity: 0.05; border-radius: 50%; }
                    .kpi-label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin-bottom: 10px; letter-spacing: 1px; }
                    .kpi-value { font-size: 36px; font-weight: 900; color: #1e293b; letter-spacing: -1px; }
                    .kpi-sub { font-size: 11px; font-weight: 700; color: #64748b; }
                    
                    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 30px; border: 1px solid #f1f5f9; border-radius: 24px; overflow: hidden; }
                    th { text-align: left; padding: 20px; background: #f8fafc; border-bottom: 2px solid #f1f5f9; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
                    td { padding: 20px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #334155; }
                    tr:last-child td { border-bottom: none; }
                    tr:nth-child(even) { background: #fcfdfe; }
                    
                    .type-in { color: #10b981; font-weight: 900; }
                    .type-out { color: #ef4444; font-weight: 900; }
                    
                    .footer { margin-top: 60px; padding-top: 30px; border-top: 2px solid #f1f5f9; font-size: 10px; color: #94a3b8; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
                    @media print { body { padding: 30px; } .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo-box">
                        ${companyLogo ? `<img src="${companyLogo}" style="height: 45px; object-fit: contain;" />` : ''}
                        <div class="company-name">
                            <div>${companyName}</div>
                            ${companyActivity ? `<div style="font-size: 10px; font-weight: 700; color: #64748b; margin-top: 2px;">${companyActivity}</div>` : ''}
                        </div>
                    </div>
                    <div class="report-title">
                        <h1>Rapport d'Activité Logistique</h1>
                        <p>Période : ${format(now, 'MMMM yyyy', { locale: fr })}</p>
                    </div>
                </div>

                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-label">Volume Entrées</div>
                        <div class="kpi-value">${monthStats.in.toFixed(2)}</div>
                        <div class="kpi-sub">Articles réceptionnés</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Volume Sorties</div>
                        <div class="kpi-value">${monthStats.out.toFixed(2)}</div>
                        <div class="kpi-sub">Articles consommés</div>
                    </div>
                    <div class="kpi-card" style="background: #1e293b; color: white;">
                        <div class="kpi-label" style="color: #94a3b8;">Taux d'Utilisation</div>
                        <div class="kpi-value" style="color: white;">${monthStats.in + monthStats.out > 0 ? Math.round((monthStats.out / (monthStats.in + monthStats.out)) * 100) : 0}%</div>
                        <div class="kpi-sub" style="color: #64748b;">Efficacité flux</div>
                    </div>
                </div>

                <h2 style="font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Historique des Mouvements</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Article</th>
                            <th>Type</th>
                            <th>Quantité</th>
                            <th>Responsable</th>
                            <th>Motif / Chantier</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${monthMovements.map(m => `
                            <tr>
                                <td>${format(new Date(m.date), 'dd/MM/yy')}</td>
                                <td>${m.product_name}</td>
                                <td class="${m.type === 'IN' ? 'type-in' : 'type-out'}">${m.type === 'IN' ? 'ENTRÉE' : 'SORTIE'}</td>
                                <td>${m.quantity} ${m.product_unit}</td>
                                <td>${m.performed_by_name || 'Système'}</td>
                                <td style="font-style: italic; color: #64748b;">${m.reason}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    Document généré le ${format(new Date(), 'dd/MM/yyyy HH:mm')} par OurSpace ERP
                </div>

                <script>window.onload = () => window.print();</script>
            </body>
            </html>
        `;
        win.document.write(html);
        win.document.close();
    };

    const handlePrint = (mv: any) => {
        const win = window.open('', '_blank');
        if (!win) return;

        const accentColor = mv.type === 'IN' ? '#10b981' : mv.type === 'OUT' ? '#f43f5e' : '#4f46e5';
        const docTitle = mv.type === 'IN' ? 'Bon d\'Entrée' : mv.type === 'OUT' ? 'Bon de Sortie' : 'Bon de Mouvement';
        const resourceLabel = mv.type === 'OUT' ? 'Destinataire' : mv.type === 'IN' ? 'Provenance' : 'Ressource';

        const html = `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <title>${docTitle} #${mv.id}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --slate-900: #0f172a;
                        --slate-600: #475569;
                        --slate-400: #94a3b8;
                        --slate-50: #f8fafc;
                        --accent: ${accentColor};
                        --border: #e2e8f0;
                    }
                    body { 
                        font-family: 'Outfit', sans-serif; 
                        color: var(--slate-900); 
                        margin: 0; 
                        padding: 40px; 
                        line-height: 1.4; 
                        background: #fff;
                        -webkit-print-color-adjust: exact;
                    }
                    .header { 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: flex-start; 
                        margin-bottom: 40px; 
                        border-bottom: 2px solid var(--slate-900);
                        padding-bottom: 30px;
                    }
                    .logo-section { display: flex; align-items: center; gap: 20px; }
                    .logo-placeholder { 
                        width: 60px; 
                        height: 60px; 
                        background: var(--slate-900); 
                        border-radius: 16px; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        color: white; 
                        font-weight: 900; 
                        font-size: 24px; 
                    }
                    .company-info .name { font-size: 18px; font-weight: 900; color: var(--slate-600); text-transform: uppercase; letter-spacing: 1px; }
                    .company-info .sub { font-size: 10px; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
                    
                    .doc-info { text-align: right; }
                    .doc-info h1 { margin: 0; font-size: 38px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; line-height: 0.9; }
                    .doc-info .ref { margin-top: 10px; font-size: 14px; font-weight: 800; color: var(--slate-400); text-transform: uppercase; letter-spacing: 2px; }

                    .meta-grid { 
                        display: grid; 
                        grid-template-columns: repeat(4, 1fr); 
                        gap: 1px; 
                        background: var(--border);
                        border: 1px solid var(--border);
                        margin-bottom: 40px;
                        border-radius: 20px;
                        overflow: hidden;
                    }
                    .meta-item { background: white; padding: 20px; }
                    .meta-label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: var(--slate-400); margin-bottom: 6px; }
                    .meta-value { font-size: 14px; font-weight: 700; color: var(--slate-900); }

                    .stakeholders { 
                        display: grid; 
                        grid-template-columns: 1fr 1fr; 
                        gap: 20px; 
                        margin-bottom: 40px; 
                    }
                    .stakeholder-card { 
                        background: var(--slate-50); 
                        padding: 25px; 
                        border-radius: 24px; 
                        border: 1px solid var(--border);
                    }
                    .stakeholder-title { font-size: 10px; font-weight: 900; text-transform: uppercase; color: var(--slate-400); margin-bottom: 12px; letter-spacing: 1px; }
                    .stakeholder-name { font-size: 18px; font-weight: 800; color: var(--slate-900); }
                    .stakeholder-detail { font-size: 12px; font-weight: 600; color: var(--slate-600); margin-top: 4px; }
                    .team-badge { 
                        display: inline-block; 
                        padding: 4px 10px; 
                        background: white; 
                        border: 1px solid var(--border); 
                        border-radius: 8px; 
                        font-size: 10px; 
                        font-weight: 800; 
                        color: var(--accent); 
                        margin-top: 10px; 
                        text-transform: uppercase;
                    }

                    .main-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                    .main-table th { 
                        text-align: left; 
                        padding: 15px 20px; 
                        background: var(--slate-900); 
                        color: white; 
                        font-size: 10px; 
                        font-weight: 800; 
                        text-transform: uppercase; 
                        letter-spacing: 1.5px;
                    }
                    .main-table td { 
                        padding: 25px 20px; 
                        border-bottom: 1px solid var(--border); 
                        font-size: 15px; 
                        font-weight: 700; 
                    }
                    .qty-cell { font-size: 28px !important; font-weight: 900 !important; color: var(--accent); text-align: right; }

                    .reason-section { 
                        padding: 30px; 
                        border-radius: 24px; 
                        border: 1px solid var(--border); 
                        margin-bottom: 60px;
                        position: relative;
                    }
                    .reason-label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: var(--slate-400); margin-bottom: 15px; letter-spacing: 1px; }
                    .reason-text { font-size: 18px; font-weight: 500; font-style: italic; color: var(--slate-600); }

                    .signatures { 
                        display: grid; 
                        grid-template-columns: repeat(3, 1fr); 
                        gap: 40px; 
                        margin-top: 80px; 
                    }
                    .sig-block { border-top: 2px solid var(--border); padding-top: 15px; text-align: center; }
                    .sig-label { font-size: 11px; font-weight: 900; text-transform: uppercase; color: var(--slate-400); letter-spacing: 1px; }
                    .sig-space { height: 60px; }

                    .footer { 
                        position: fixed; 
                        bottom: 30px; 
                        left: 40px; 
                        right: 40px; 
                        text-align: center; 
                        font-size: 9px; 
                        color: var(--slate-400); 
                        font-weight: 700; 
                        text-transform: uppercase; 
                        letter-spacing: 1.5px; 
                        border-top: 1px solid var(--slate-50);
                        padding-top: 15px;
                    }
                    @media print { 
                        body { padding: 0; } 
                        .no-print { display: none; } 
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo-section">
                        ${companyLogo ? `<img src="${companyLogo}" style="height: 60px; object-fit: contain;" />` : `
                        <div class="logo-placeholder">${companyName.charAt(0)}</div>
                        `}
                        <div class="company-info">
                            <div class="name">${companyName}</div>
                            ${companyActivity ? `<div class="sub">${companyActivity}</div>` : ''}
                        </div>
                    </div>
                    <div class="doc-info">
                        <h1>${docTitle}</h1>
                        <div class="ref">DOCUMENT N° ${mv.id.toString().padStart(6, '0')}</div>
                    </div>
                </div>

                <div class="meta-grid">
                    <div class="meta-item">
                        <div class="meta-label">Date</div>
                        <div class="meta-value">${format(new Date(mv.date), 'dd/MM/yyyy')}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Heure</div>
                        <div class="meta-value">${format(new Date(mv.date), 'HH:mm')}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Référence</div>
                        <div class="meta-value">${mv.reference_id || '---'}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Statut</div>
                        <div class="meta-value" style="color: var(--accent)">VALIDÉ</div>
                    </div>
                </div>

                <div class="stakeholders">
                    <div class="stakeholder-card">
                        <div class="stakeholder-title">Responsable Émetteur</div>
                        <div class="stakeholder-name">${mv.performed_by_name || 'Système'}</div>
                        <div class="stakeholder-detail">Logistique Centrale</div>
                    </div>
                    <div class="stakeholder-card">
                        <div class="stakeholder-title">${resourceLabel}</div>
                        <div class="stakeholder-name">${mv.issued_to_name || mv.received_from_name || 'Stock Interne'}</div>
                        ${mv.team_name ? `
                            <div class="team-badge">Équipe: ${mv.team_name}</div>
                            <div class="stakeholder-detail" style="margin-top: 8px;">TL: ${mv.team_leader_name || 'N/A'}</div>
                        ` : ''}
                    </div>
                </div>

                <table class="main-table">
                    <thead>
                        <tr>
                            <th style="width: 60%">Désignation de l'Article</th>
                            <th style="width: 20%">Catégorie</th>
                            <th style="width: 20%; text-align: right;">Quantité</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div style="font-size: 18px;">${mv.product_name}</div>
                                <div style="font-size: 11px; color: var(--slate-400); margin-top: 5px;">Réf: PRD-${mv.product_id || '000'}</div>
                            </td>
                            <td><div style="font-size: 13px; color: var(--slate-600);">${mv.category || 'Stock'}</div></td>
                            <td class="qty-cell">${mv.quantity} <span style="font-size: 12px; color: var(--slate-400);">${mv.product_unit}</span></td>
                        </tr>
                    </tbody>
                </table>

                <div class="reason-section">
                    <div class="reason-label">Motif & Justification de l'opération</div>
                    <div class="reason-text">"${mv.reason}"</div>
                </div>

                <div class="signatures">
                    <div class="sig-block">
                        <div class="sig-space"></div>
                        <div class="sig-label">Visa Émetteur</div>
                    </div>
                    <div class="sig-block">
                        <div class="sig-space"></div>
                        <div class="sig-label">Visa Team Leader</div>
                    </div>
                    <div class="sig-block">
                        <div class="sig-space"></div>
                        <div class="sig-label">Visa Réceptionnaire</div>
                    </div>
                </div>

                <div class="footer">
                    Document officiel généré par OurSpace ERP - Version 2.0 Premium. Propriété de ${companyName}.
                </div>

                <script>
                    window.onload = () => {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;
        win.document.write(html);
        win.document.close();
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-1">
                        <Link href="/inventory" className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest mb-4">
                            <ArrowLeft size={14} /> Inventaire
                        </Link>
                        <h1 className={clsx("text-4xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            Flux Logistiques
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-[3px]">
                            Historique des Entrées & Sorties
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleGenerateMonthlyReport}
                            className="bg-slate-900 text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all"
                        >
                            <Download size={18} />
                            Rapport Mensuel
                        </button>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                        <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-[24px] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            <ArrowUpRight size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entrées (Total)</p>
                            <h3 className={clsx("text-3xl font-black text-slate-900", displayFont.className)}>{stats.in} <span className="text-sm font-bold text-slate-400">unités</span></h3>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                        <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-[24px] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            <ArrowDownLeft size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sorties (Total)</p>
                            <h3 className={clsx("text-3xl font-black text-slate-900", displayFont.className)}>{stats.out} <span className="text-sm font-bold text-slate-400">unités</span></h3>
                        </div>
                    </div>
                    <div className="bg-slate-900 p-8 rounded-[40px] text-white flex items-center gap-6 shadow-2xl shadow-slate-200">
                        <div className="h-16 w-16 bg-indigo-500/20 text-indigo-400 rounded-[24px] flex items-center justify-center shadow-inner">
                            <TrendingUp size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Taux de Sortie</p>
                            <h3 className={clsx("text-3xl font-black text-white", displayFont.className)}>
                                {stats.in + stats.out > 0 
                                    ? Math.round((stats.out / (stats.in + stats.out)) * 100) 
                                    : 0}% 
                                <span className="text-sm font-bold text-slate-500"> actif</span>
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between gap-6 items-center">
                        <div className="relative flex-1 group w-full max-w-lg">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Filtrer par produit ou motif..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                            />
                        </div>
                        <div className="flex gap-4">
                            <select 
                                value={timeFilter}
                                onChange={(e: any) => setTimeFilter(e.target.value)}
                                className="px-6 py-4 bg-slate-50 text-slate-900 border-none rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all outline-none"
                            >
                                <option value="all">Toutes Périodes</option>
                                <option value="7d">7 derniers jours</option>
                                <option value="30d">30 derniers jours</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Flux</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produit & Unité</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsable</th>
                                    <th className="p-8 text-[10px) font-black text-slate-400 uppercase tracking-widest">Motif / Destination</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredMovements.map(mv => (
                                    <tr key={mv.id} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="p-8">
                                            <div className={clsx(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                                                mv.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                            )}>
                                                {mv.type === 'IN' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="space-y-1">
                                                <p className="font-black text-slate-900 text-base tracking-tight">{mv.product_name}</p>
                                                <p className={clsx(
                                                    "text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                                                    mv.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                                                )}>
                                                    {mv.type === 'IN' ? '+' : '-'}{Number(mv.quantity).toFixed(2)} {mv.product_unit !== 'Aucune' ? (mv.product_unit === 'Nombre' ? '' : `${mv.product_unit}${Number(mv.quantity) > 1 ? '(s)' : ''}`) : ''}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-8 text-slate-900 font-bold text-xs">
                                            {mv.performed_by_name || 'Système'}
                                        </td>
                                        <td className="p-8">
                                            <p className="text-sm font-medium text-slate-500 line-clamp-1 italic">"{mv.reason}"</p>
                                        </td>
                                        <td className="p-8">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-slate-900">{new Date(mv.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(mv.date).getFullYear()}</p>
                                            </div>
                                        </td>
                                        <td className="p-8 text-center relative">
                                            <button 
                                                onClick={() => setActiveActionMenu(activeActionMenu === mv.id ? null : mv.id)}
                                                className="h-10 w-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-300 group-hover:text-slate-900 group-hover:bg-white transition-all shadow-sm mx-auto"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>
                                            
                                            {activeActionMenu === mv.id && (
                                                <div className="absolute right-8 top-16 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <button 
                                                        onClick={() => { setViewingMovement(mv); setActiveActionMenu(null); }}
                                                        className="w-full px-6 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-3 transition-colors"
                                                    >
                                                        <Info size={14} /> Détails
                                                    </button>
                                                    <button 
                                                        onClick={() => { handlePrint(mv); setActiveActionMenu(null); }}
                                                        className="w-full px-6 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-3 transition-colors"
                                                    >
                                                        <Printer size={14} /> Imprimer
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {viewingMovement && (
                <MovementDetailsModal 
                    movement={viewingMovement} 
                    onClose={() => setViewingMovement(null)} 
                    onPrint={() => handlePrint(viewingMovement)}
                />
            )}
        </DashboardLayout>
    );
}

function MovementDetailsModal({ movement, onClose, onPrint }: any) {
    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[48px] w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-10 space-y-8">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className={clsx(
                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block border mb-2",
                                movement.type === 'IN' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                            )}>
                                {movement.type === 'IN' ? 'Entrée de Stock' : 'Sortie de Stock'}
                            </div>
                            <h2 className={clsx("text-2xl font-black text-slate-900", displayFont.className)}>Détails du Flux</h2>
                        </div>
                        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <div className="bg-slate-50 rounded-[32px] p-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-600">
                                <Package size={28} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produit</p>
                                <p className="text-lg font-black text-slate-900">{movement.product_name}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-4 bg-white rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantité</p>
                                <p className={clsx("text-xl font-black", movement.type === 'IN' ? 'text-emerald-600' : 'text-rose-600')}>
                                    {movement.type === 'IN' ? '+' : '-'}{movement.quantity} {movement.product_unit}
                                </p>
                            </div>
                            <div className="p-4 bg-white rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date & Heure</p>
                                <p className="text-sm font-bold text-slate-900">
                                    {format(new Date(movement.date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Clock size={16} className="text-slate-400 mt-1" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsable</p>
                                    <p className="text-sm font-bold text-slate-900">{movement.performed_by_name || 'Système'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Info size={16} className="text-slate-400 mt-1" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motif / Destination</p>
                                    <p className="text-sm font-medium text-slate-600 italic">"{movement.reason}"</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <FileText size={16} className="text-slate-400 mt-1" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence Documentaire</p>
                                    <p className="text-sm font-bold text-slate-900">{movement.reference_id || 'Aucune référence'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 p-5 bg-slate-50 text-slate-500 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                        >
                            Fermer
                        </button>
                        <button
                            onClick={onPrint}
                            className="flex-[2] p-5 bg-slate-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Printer size={16} /> Imprimer le Bon
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
