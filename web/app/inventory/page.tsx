'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/dashboard-layout';
import {
    Box, Search, Filter, Plus, ArrowUpDown,
    AlertTriangle, CheckCircle2, TrendingUp, Package,
    ArrowUpRight, ArrowDownLeft, History, Settings, MapPin, RefreshCw,
    Download, LayoutGrid, List, MoreHorizontal, Sparkles, XCircle,
    Edit3, Trash2, AlertCircle
} from 'lucide-react';
import clsx from 'clsx';
import {
    getProducts, createProduct, updateProduct, deleteProduct,
    getInventoryMovements, recordMovement, getWorkSites, getFieldResources
} from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePreferences } from '@/context/PreferencesContext';
import { Outfit } from 'next/font/google';
import toast from 'react-hot-toast';

const displayFont = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '700', '800'] });

export default function InventoryPage() {
    const { formatCurrency } = usePreferences();
    const [products, setProducts] = useState < any[] > ([]);
    const [movements, setMovements] = useState < any[] > ([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState < 'grid' | 'list' > ('grid');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState < any > (null);
    const [deletingProduct, setDeletingProduct] = useState < any > (null);
    const [movementModal, setMovementModal] = useState < { product: any, type: 'IN' | 'OUT' } | null > (null);
    const [companyName, setCompanyName] = useState('OURSPACE ERP');
    const [companyLogo, setCompanyLogo] = useState<string | null>(null);
    const [companyActivity, setCompanyActivity] = useState('');

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
                        <div class="meta-value">${format(new Date(mv.date || new Date()), 'dd/MM/yyyy')}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Heure</div>
                        <div class="meta-value">${format(new Date(mv.date || new Date()), 'HH:mm')}</div>
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

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [productsData, movementsData, userData] = await Promise.all([
                getProducts(),
                getInventoryMovements(),
                import('@/services/api').then(m => m.getUserProfile())
            ]);
            setProducts(productsData);
            setMovements(movementsData);
            if (userData?.company?.name) {
                setCompanyName(userData.company.name);
                if (userData.company.logo) setCompanyLogo(userData.company.logo);
                if (userData.company.sector) setCompanyActivity(userData.company.sector);
            } else if (userData?.company_name) {
                setCompanyName(userData.company_name);
            }
        } catch (err) {
            console.error("Failed to fetch inventory data", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await deleteProduct(id);
            toast.success("Article supprimé");
            fetchData();
        } catch (err) {
            console.error("Failed to delete product", err);
            toast.error("Erreur lors de la suppression");
        } finally {
            setDeletingProduct(null);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = {
        totalItems: products.length,
        totalValue: products.reduce((acc, p) => acc + (parseFloat(p.current_stock || 0) * parseFloat(p.unit_price || 0)), 0),
        lowStock: products.filter(p => p.status === 'LOW_STOCK').length,
        outOfStock: products.filter(p => p.status === 'OUT_OF_STOCK').length,
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-1">
                        <h1 className={clsx("text-4xl font-black text-slate-900 tracking-tight", displayFont.className)}>
                            Gestion des Stocks
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-[3px]">
                            Logistique & Inventaire Centralisé
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchData}
                            className="bg-white border border-slate-100 p-4 rounded-2xl text-slate-400 hover:text-slate-900 shadow-sm transition-all"
                            disabled={loading}
                        >
                            <History size={20} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-slate-900 text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all active:scale-95"
                        >
                            <Plus size={18} />
                            Nouvel Article
                        </button>
                    </div>
                </div>

                {/* Categories Dictionary Ribbon */}
                <div className="flex flex-wrap gap-2 overflow-x-auto pb-4 no-scrollbar">
                    {Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort().map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSearchTerm(cat)}
                            className={clsx(
                                "px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                                searchTerm === cat
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                                    : "bg-white border-slate-100 text-slate-400 hover:border-indigo-100 hover:text-indigo-600"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-500 border border-rose-100"
                        >
                            Réinitialiser
                        </button>
                    )}
                </div>

                {loading && products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="h-12 w-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Chargement de l'inventaire...</p>
                    </div>
                ) : (
                    <>
                        {/* KPI Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <InventoryStat
                                label="Articles Uniques"
                                value={stats.totalItems}
                                icon={<Package />}
                                color="slate"
                            />
                            <InventoryStat
                                label="Valeur Totale Stock"
                                value={formatCurrency(stats.totalValue)}
                                icon={<TrendingUp />}
                                color="indigo"
                            />
                            <InventoryStat
                                label="Ruptures"
                                value={stats.outOfStock}
                                icon={<AlertTriangle />}
                                color="rose"
                                alert={stats.outOfStock > 0}
                            />
                            <InventoryStat
                                label="Stock Faible"
                                value={stats.lowStock}
                                icon={<ArrowDownLeft />}
                                color="amber"
                                alert={stats.lowStock > 0}
                            />
                        </div>

                        {/* Toolbar */}
                        <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1 group w-full">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Rechercher un produit, une référence ou catégorie..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                />
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={clsx(
                                        "p-4 rounded-[20px] transition-all",
                                        viewMode === 'grid' ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    <LayoutGrid size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={clsx(
                                        "p-4 rounded-[20px] transition-all",
                                        viewMode === 'list' ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    <List size={20} />
                                </button>
                                <div className="w-px h-10 bg-slate-100 mx-2" />
                                <button className="px-6 py-4 bg-slate-50 text-slate-400 rounded-[20px] flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                                    <Filter size={16} />
                                    Catégories
                                </button>
                            </div>
                        </div>

                        {/* Inventory List */}
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {products.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        formatCurrency={formatCurrency}
                                        onEdit={() => setEditingProduct(product)}
                                        onDelete={() => setDeletingProduct(product)}
                                        onMovement={(type: 'IN' | 'OUT') => setMovementModal({ product, type })}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produit</th>
                                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</th>
                                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Actuel</th>
                                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valeur</th>
                                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {products.map(product => (
                                            <tr key={product.id} className="group hover:bg-slate-50/50 transition-all">
                                                <td className="p-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                            <Box size={20} />
                                                        </div>
                                                        <p className="font-black text-slate-900 text-sm">{product.name}</p>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{product.category}</span>
                                                </td>
                                                <td className="p-8">
                                                    <p className="font-black text-slate-900">
                                                        {product.current_stock}
                                                        {product.unit !== 'Aucune' && (
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">{product.unit}</span>
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="p-8">
                                                    <p className="font-bold text-slate-600">{formatCurrency(product.unit_price)}</p>
                                                </td>
                                                <td className="p-8">
                                                    <StatusBadge status={product.status} />
                                                </td>
                                                <td className="p-8 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setEditingProduct(product)}
                                                            className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                        >
                                                            <Edit3 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingProduct(product)}
                                                            className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {isAddModalOpen && (
                            <AddProductModal
                                categories={Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort()}
                                onClose={() => setIsAddModalOpen(false)}
                                onSuccess={() => {
                                    setIsAddModalOpen(false);
                                    fetchData();
                                }}
                            />
                        )}
                    </>
                )}

                {editingProduct && (
                    <EditProductModal
                        product={editingProduct}
                        categories={Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort()}
                        onClose={() => setEditingProduct(null)}
                        onSuccess={() => {
                            setEditingProduct(null);
                            fetchData();
                        }}
                    />
                )}

                {deletingProduct && (
                    <DeleteConfirmModal
                        productName={deletingProduct.name}
                        onClose={() => setDeletingProduct(null)}
                        onConfirm={() => handleDelete(deletingProduct.id)}
                    />
                )}

                {movementModal && (
                    <MovementModal
                        product={movementModal.product}
                        type={movementModal.type}
                        onClose={() => setMovementModal(null)}
                        onSuccess={() => {
                            setMovementModal(null);
                            fetchData();
                        }}
                    />
                )}

                <div className="mt-20 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className={clsx("text-2xl font-black text-slate-900 tracking-tight", displayFont.className)}>Historique des Flux</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Journal d'audit de l'inventaire</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produit</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantité</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Raison</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsable & Équipe</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {movements.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                                Aucun mouvement enregistré
                                            </td>
                                        </tr>
                                    ) : (
                                        movements.slice(0, 10).map((movement: any) => (
                                            <tr key={movement.id} className="hover:bg-slate-50/50 transition-all">
                                                <td className="p-8">
                                                    <p className="text-xs font-bold text-slate-600">
                                                        {format(new Date(movement.date), 'dd MMM yyyy', { locale: fr })}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-medium">
                                                        {format(new Date(movement.date), 'HH:mm')}
                                                    </p>
                                                </td>
                                                <td className="p-8">
                                                    <p className="font-black text-slate-900 text-sm">{movement.product_name}</p>
                                                </td>
                                                <td className="p-8">
                                                    <span className={clsx(
                                                        "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[1px] border",
                                                        movement.type === 'IN' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                            movement.type === 'OUT' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                                "bg-slate-50 text-slate-600 border-slate-100"
                                                    )}>
                                                        {movement.type === 'IN' ? 'Entrée' : movement.type === 'OUT' ? 'Sortie' : 'Ajustement'}
                                                    </span>
                                                </td>
                                                <td className="p-8">
                                                    <p className={clsx(
                                                        "font-black text-sm",
                                                        movement.type === 'IN' ? "text-emerald-600" : "text-rose-600"
                                                    )}>
                                                        {movement.type === 'IN' ? '+' : '-'}{Number(movement.quantity).toFixed(2)} {movement.product_unit !== 'Aucune' ? (movement.product_unit === 'Nombre' ? '' : `${movement.product_unit}${Number(movement.quantity) > 1 ? '(s)' : ''}`) : ''}
                                                    </p>
                                                </td>
                                                <td className="p-8">
                                                    <p className="text-xs font-medium text-slate-500">{movement.reason}</p>
                                                </td>
                                                <td className="p-8">
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-bold text-slate-900">{movement.performed_by_name || 'Système'}</p>
                                                        <div className="flex flex-col gap-1">
                                                            {(movement.issued_to_name || movement.received_from_name) && (
                                                                <p className="text-[9px] font-black text-indigo-500 uppercase flex items-center gap-1">
                                                                    {movement.type === 'OUT' ? <ArrowUpRight size={10}/> : <ArrowDownLeft size={10}/>}
                                                                    {movement.issued_to_name || movement.received_from_name}
                                                                </p>
                                                            )}
                                                            {movement.team_name && (
                                                                <p className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block w-fit border border-emerald-100">
                                                                    Équipe: {movement.team_name}
                                                                </p>
                                                            )}
                                                            {movement.team_leader_name && (
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                                                    TL: {movement.team_leader_name}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8 text-right">
                                                    <button 
                                                        onClick={() => handlePrint(movement)}
                                                        className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                        title={`Télécharger Bon de ${movement.type === "OUT" ? "Sortie" : "Mouvement"}`}
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function AddProductModal({ categories, onClose, onSuccess }: { categories: string[], onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        unit: 'Unité',
        current_stock: 0,
        min_stock: 0,
        unit_price: 0
    });
    const [customCategory, setCustomCategory] = useState('');
    const [customUnit, setCustomUnit] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const dataToSubmit = {
                ...formData,
                category: formData.category === 'Autre' ? customCategory : formData.category,
                unit: formData.unit === 'Autre' ? customUnit : formData.unit
            };
            await createProduct(dataToSubmit);
            toast.success("Article créé avec succès");
            onSuccess();
        } catch (err) {
            console.error("Failed to create product", err);
            toast.error("Erreur lors de la création");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[48px] w-full max-w-2xl max-h-[95vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col">
                <div className="p-12 space-y-10 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h2 className={clsx("text-3xl font-black text-slate-900", displayFont.className)}>Nouvel Article</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enregistrement dans l'inventaire</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du Produit</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="ex: Ciment CPJ45"
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                                <div className="relative">
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner appearance-none pr-12"
                                    >
                                        <option value="">Sélectionner une catégorie</option>

                                        {categories.length > 0 && (
                                            <optgroup label="Catégories Existantes (Dictionnaire)">
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </optgroup>
                                        )}

                                        <optgroup label="BTP & Génie Civil">
                                            <option value="Matériaux">Matériaux (Ciment, Sable, Gravier)</option>
                                            <option value="Quincaillerie">Quincaillerie & Visserie</option>
                                            <option value="Électricité">Électricité & Éclairage</option>
                                            <option value="Plomberie">Plomberie & Sanitaire</option>
                                            <option value="Peinture">Peinture & Étanchéité</option>
                                            <option value="Bois">Bois & Charpente</option>
                                            <option value="Carrelage">Carrelage & Revêtements</option>
                                            <option value="Vitrerie">Vitrerie & Miroiterie</option>
                                            <option value="Finition">Décoration & Finition</option>
                                        </optgroup>
                                        <optgroup label="Industrie & Énergie">
                                            <option value="Outillage">Outillage & Machines-Outils</option>
                                            <option value="Sécurité">Sécurité & EPI</option>
                                            <option value="Solaire">Énergie Solaire & Batteries</option>
                                            <option value="Climatisation">HVAC / Climatisation</option>
                                            <option value="Mécanique">Mécanique & Lubrifiants</option>
                                            <option value="Chimie">Produits Chimiques & Labo</option>
                                        </optgroup>
                                        <optgroup label="Télécommunications">
                                            <option value="Fibre">Fibre Optique & Câblage</option>
                                            <option value="Reseau">Équipements Réseau (Routeurs, Switchs)</option>
                                            <option value="Telecom">Antennes & Pylônes</option>
                                            <option value="Terminaux">Téléphonie & Mobilité</option>
                                        </optgroup>
                                        <optgroup label="Agriculture & Environnement">
                                            <option value="Agriculture">Intrants, Engrais & Semences</option>
                                            <option value="Irrigation">Systèmes d'Irrigation</option>
                                            <option value="Elevage">Élevage & Nutrition Animale</option>
                                        </optgroup>
                                        <optgroup label="TIC, Santé & Services">
                                            <option value="Informatique">Matériel Info & Serveurs</option>
                                            <option value="Bureautique">Mobilier & Papeterie</option>
                                            <option value="Medical">Dispositifs Médicaux</option>
                                            <option value="Pharma">Pharmacie & Parapharmacie</option>
                                        </optgroup>
                                        <optgroup label="Commerce, Horeca & Logistique">
                                            <option value="Restauration">Cuisine & Équipements Horeca</option>
                                            <option value="Textile">Uniforme, Linge & Textile</option>
                                            <option value="Emballage">Emballage & Conditionnement</option>
                                            <option value="Logistique">Manutention & Transport</option>
                                        </optgroup>
                                        <option value="Autre">+ Nouvelle catégorie...</option>
                                    </select>
                                    <ArrowUpDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                                {formData.category === 'Autre' && (
                                    <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                        <input
                                            required
                                            value={customCategory}
                                            onChange={e => setCustomCategory(e.target.value)}
                                            placeholder="Préciser la catégorie..."
                                            className="w-full p-6 bg-indigo-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unité de mesure</label>
                                <div className="relative">
                                    <select
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner appearance-none pr-12"
                                    >
                                        <option value="Unité">Unité</option>
                                        <option value="Nombre">Nombre</option>
                                        <option value="Aucune">Aucune (Pas de mesure)</option>
                                        <option value="Sacs">Sacs</option>
                                        <option value="Barres">Barres</option>
                                        <option value="Bidons">Bidons</option>
                                        <option value="kg">Kilogrammes (kg)</option>
                                        <option value="m">Mètres (m)</option>
                                        <option value="m2">Mètres Carrés (m²)</option>
                                        <option value="L">Litres (L)</option>
                                        <option value="Rouleaux">Rouleaux</option>
                                        <option value="Autre">Autre (Préciser...)</option>
                                    </select>
                                    <ArrowUpDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                                {formData.unit === 'Autre' && (
                                    <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                        <input
                                            required
                                            value={customUnit}
                                            onChange={e => setCustomUnit(e.target.value)}
                                            placeholder="Préciser l'unité..."
                                            className="w-full p-6 bg-indigo-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Actuel</label>
                                <input
                                    type="number"
                                    value={formData.current_stock}
                                    onChange={e => setFormData({ ...formData, current_stock: Number(e.target.value) })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Minimum Alerte</label>
                                <input
                                    type="number"
                                    value={formData.min_stock}
                                    onChange={e => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                />
                            </div>
                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prix Unitaire Estimé (CFA)</label>
                                <input
                                    type="number"
                                    value={formData.unit_price}
                                    onChange={e => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 p-6 bg-slate-50 text-slate-500 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-[2] p-6 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all disabled:opacity-50"
                            >
                                {submitting ? "Création..." : "Enregistrer l'Article"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function EditProductModal({ product, categories, onClose, onSuccess }: { product: any, categories: string[], onClose: () => void, onSuccess: () => void }) {
    const predefinedCategories = [
        'Matériaux', 'Quincaillerie', 'Électricité', 'Plomberie', 'Peinture', 'Bois', 'Carrelage', 'Vitrerie', 'Finition',
        'Outillage', 'Sécurité', 'Solaire', 'Climatisation', 'Mécanique', 'Chimie',
        'Fibre', 'Reseau', 'Telecom', 'Terminaux',
        'Agriculture', 'Irrigation', 'Elevage',
        'Informatique', 'Bureautique', 'Medical', 'Pharma',
        'Restauration', 'Textile', 'Emballage', 'Logistique'
    ];

    const initialIsCustom = product.category && !predefinedCategories.includes(product.category) && !categories.includes(product.category);
    const predefinedUnits = ['Unité', 'Nombre', 'Aucune', 'Sacs', 'Barres', 'Bidons', 'kg', 'm', 'm2', 'L', 'Rouleaux'];
    const initialIsCustomUnit = product.unit && !predefinedUnits.includes(product.unit);

    const [formData, setFormData] = useState({
        name: product.name,
        category: initialIsCustom ? 'Autre' : product.category,
        unit: initialIsCustomUnit ? 'Autre' : product.unit,
        current_stock: product.current_stock,
        min_stock: product.min_stock,
        unit_price: product.unit_price
    });

    const [customCategory, setCustomCategory] = useState(initialIsCustom ? product.category : '');
    const [customUnit, setCustomUnit] = useState(initialIsCustomUnit ? product.unit : '');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const dataToSubmit = {
                ...formData,
                category: formData.category === 'Autre' ? customCategory : formData.category,
                unit: formData.unit === 'Autre' ? customUnit : formData.unit
            };
            await updateProduct(product.id, dataToSubmit);
            toast.success("Article mis à jour");
            onSuccess();
        } catch (err) {
            console.error("Failed to update product", err);
            toast.error("Erreur lors de la modification");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[48px] w-full max-w-2xl max-h-[95vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col">
                <div className="p-12 space-y-10 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h2 className={clsx("text-3xl font-black text-slate-900", displayFont.className)}>Modifier l'Article</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mise à jour des informations</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du Produit</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="ex: Ciment CPJ45"
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                                <div className="relative">
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner appearance-none pr-12"
                                    >
                                        <option value="">Sélectionner une catégorie</option>

                                        {categories.length > 0 && (
                                            <optgroup label="Catégories Existantes (Dictionnaire)">
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </optgroup>
                                        )}

                                        <optgroup label="BTP, Génie Civil & Mines">
                                            <option value="Materiaux_Gros_Oeuvre">Gros Œuvre (Acier, Ciment, Agrégats, Adjuvants)</option>
                                            <option value="Second_Oeuvre">Second Œuvre (Isolants, Plâtrerie, Étanchéité)</option>
                                            <option value="Quincaillerie_Visserie">Quincaillerie, Visserie & Fixations Professionnelles</option>
                                            <option value="Electricite_BTP">Électricité (Câbles, Armoires, Appareillage, Éclairage)</option>
                                            <option value="Plomberie_Sanitaire">Plomberie, Tuyauterie, Pompes & Sanitaires</option>
                                            <option value="Peinture_Revetement">Peinture, Sol, Carrelage & Revêtements muraux</option>
                                            <option value="Menuiserie_Bois_Alu">Menuiserie (Bois, Alu, PVC) & Charpente</option>
                                            <option value="Vitrerie_Miroiterie">Vitrerie, Miroiterie & Façades vitrées</option>
                                            <option value="VRD_Assainissement">VRD (Canalisations, Bordures, Regards, Assainissement)</option>
                                            <option value="Equipements_Mines">Équipements Miniers & Forage (Explosifs, Consommables forage)</option>
                                        </optgroup>

                                        <optgroup label="Industrie, Énergie & Maintenance (MRO)">
                                            <option value="Outillage_Machines">Outillage Électroportatif & Machines-Outils</option>
                                            <option value="Mecanique_Transmission">Mécanique (Roulements, Courroies, Moteurs, Automates)</option>
                                            <option value="Hydraulique_Pneumatique">Systèmes Hydrauliques & Pneumatiques (Vrins, Flexibles)</option>
                                            <option value="Maintenance_Lubrification">Produits de Maintenance (Lubrifiants, Graisses, Colles)</option>
                                            <option value="Energie_Solaire">Solaire & Énergies Renouvelables (Panneaux, Batteries, Onduleurs)</option>
                                            <option value="Groupes_Froid">Groupes Électrogènes, HVAC & Climatisation Industrielle</option>
                                            <option value="Chimie_Labo">Produits Chimiques, Gaz Industriels & Réactifs Labo</option>
                                        </optgroup>

                                        <optgroup label="Télécommunications & Sécurité">
                                            <option value="Fibre_Cablage">Fibre Optique, Câblage Réseau & Data Centers</option>
                                            <option value="Infrastructures_Telecom">Infrastructures (Antennes, Pylônes, Shelters, Mats)</option>
                                            <option value="Reseaux_Actifs">Équipements Réseau (Routeurs, Switchs, Firewalls)</option>
                                            <option value="Surveillance_Acces">Sécurité (Vidéosurveillance, Alarmes, Contrôle d'accès)</option>
                                            <option value="Terminaux_Mobilité">Terminaux (Téléphonie IP, Mobilité, Tablettes de terrain)</option>
                                        </optgroup>

                                        <optgroup label="Logistique, Transport & Flotte">
                                            <option value="Manutention_Levage">Manutention (Chariots, Transpalettes, Levage)</option>
                                            <option value="Emballage_Conditionnement">Emballage (Cartons, Palettes, Films, Étiquetage)</option>
                                            <option value="Parc_Automobile">Parc Auto (Pièces de rechange, Pneus, Consommables Flotte)</option>
                                            <option value="Equipement_Entreposage">Stockage (Rayonnages, Racks, Mezzanines)</option>
                                        </optgroup>

                                        <optgroup label="Agriculture & Environnement">
                                            <option value="Intrants_Semences">Intrants (Engrais, Semences, Produits Phytosanitaires)</option>
                                            <option value="Irrigation_Pompage">Irrigation (Goutte-à-goutte, Pompes, Forage)</option>
                                            <option value="Elevage_Sante">Élevage (Nutrition, Santé Animale, Équipements fermes)</option>
                                            <option value="Espaces_Verts">Espaces Verts & Aménagement Paysager</option>
                                            <option value="Gestion_Dechets">Gestion des Déchets & Recyclage</option>
                                        </optgroup>

                                        <optgroup label="Santé & Hygiène">
                                            <option value="Dispositifs_Medicaux">Dispositifs Médicaux & Instrumentation</option>
                                            <option value="Consommables_Medicaux">Consommables Médicaux (Gants, Pansements, Seringues)</option>
                                            <option value="Pharmacie">Pharmacie, Parapharmacie & Réactifs</option>
                                            <option value="Hygiene_Entretien">Hygiène Professionnelle (Produits d'entretien, Désinfection)</option>
                                        </optgroup>

                                        <optgroup label="TIC, Bureautique & Services">
                                            <option value="Informatique_Hardware">Hardware (Ordinateurs, Serveurs, Périphériques)</option>
                                            <option value="Bureautique_Papeterie">Papeterie, Fournitures de Bureau & Consommables</option>
                                            <option value="Mobilier_Amenagement">Mobilier de Bureau & Aménagement d'espaces</option>
                                            <option value="Logiciels_Licences">Actifs Immatériels (Logiciels, Licences, SaaS)</option>
                                        </optgroup>

                                        <optgroup label="Commerce, Horeca & Textile">
                                            <option value="Equipement_Cuisine">Cuisine Professionnelle & Équipements Horeca</option>
                                            <option value="Arts_Table">Arts de la Table & Verrerie</option>
                                            <option value="Textile_Habillement">Textile (Uniformes, ÉPI Souples, Linge de maison)</option>
                                            <option value="Evenementiel_Stand">Événementiel (Mobilier de réception, Stands, Audiovisuel)</option>
                                        </optgroup>

                                        <optgroup label="Protection & Sécurité (EPI)">
                                            <option value="EPI_Corps">Protection Corps (Vêtements, Chaussures de sécurité)</option>
                                            <option value="EPI_Tete_Mains">Protection Tête, Yeux & Mains</option>
                                            <option value="Securite_Incendie">Sécurité Incendie (Extincteurs, Signalisation, RIA)</option>
                                        </optgroup>
                                        <option value="Autre">+ Nouvelle catégorie...</option>
                                    </select>
                                    <ArrowUpDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                                {formData.category === 'Autre' && (
                                    <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                        <input
                                            required
                                            value={customCategory}
                                            onChange={e => setCustomCategory(e.target.value)}
                                            placeholder="Préciser la catégorie..."
                                            className="w-full p-6 bg-indigo-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unité de mesure</label>
                                <div className="relative">
                                    <select
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner appearance-none pr-12"
                                    >
                                        <option value="Unité">Unité</option>
                                        <option value="Nombre">Nombre</option>
                                        <option value="Aucune">Aucune (Pas de mesure)</option>
                                        <option value="Sacs">Sacs</option>
                                        <option value="Barres">Barres</option>
                                        <option value="Bidons">Bidons</option>
                                        <option value="kg">Kilogrammes (kg)</option>
                                        <option value="m">Mètres (m)</option>
                                        <option value="m2">Mètres Carrés (m²)</option>
                                        <option value="L">Litres (L)</option>
                                        <option value="Rouleaux">Rouleaux</option>
                                        <option value="Autre">Autre (Préciser...)</option>
                                    </select>
                                    <ArrowUpDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                                {formData.unit === 'Autre' && (
                                    <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                        <input
                                            required
                                            value={customUnit}
                                            onChange={e => setCustomUnit(e.target.value)}
                                            placeholder="Préciser l'unité..."
                                            className="w-full p-6 bg-indigo-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Actuel</label>
                                <input
                                    type="number"
                                    value={formData.current_stock}
                                    onChange={e => setFormData({ ...formData, current_stock: Number(e.target.value) })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Minimum Alerte</label>
                                <input
                                    type="number"
                                    value={formData.min_stock}
                                    onChange={e => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                />
                            </div>
                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prix Unitaire Estimé (CFA)</label>
                                <input
                                    type="number"
                                    value={formData.unit_price}
                                    onChange={e => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 p-6 bg-slate-50 text-slate-500 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-[2] p-6 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all disabled:opacity-50"
                            >
                                {submitting ? "Mise à jour..." : "Enregistrer les modifications"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function InventoryStat({ label, value, icon, color, alert }: any) {
    return (
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-100 transition-all group relative overflow-hidden">
            <div className={clsx("absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity",
                color === 'indigo' ? 'bg-indigo-600' :
                    color === 'rose' ? 'bg-rose-600' :
                        color === 'amber' ? 'bg-amber-600' : 'bg-slate-600'
            )}></div>

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className={clsx("p-3 rounded-2xl",
                    color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                        color === 'rose' ? 'bg-rose-50 text-rose-600' :
                            color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                )}>{icon}</div>
                {alert && <div className="h-2 w-2 bg-rose-500 rounded-full animate-pulse" />}
            </div>

            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <h3 className={clsx("text-2xl font-black text-slate-900 tracking-tight", displayFont.className)}>{value}</h3>
            </div>
        </div>
    );
}

function ProductCard({ product, formatCurrency, onEdit, onDelete, onMovement }: any) {
    const isOut = product.status === 'OUT_OF_STOCK';
    const isLow = product.status === 'LOW_STOCK';
    const [showActions, setShowActions] = useState(false);

    return (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/40 transition-all group overflow-hidden flex flex-col relative">
            <div className="p-8 flex-grow">
                <div className="flex justify-between items-start mb-8">
                    <StatusBadge status={product.status} />
                    <div className="relative">
                        <button
                            onClick={() => setShowActions(!showActions)}
                            className="h-10 w-10 flex items-center justify-center bg-slate-50 text-slate-300 hover:text-slate-900 rounded-xl transition-all"
                        >
                            <MoreHorizontal size={18} />
                        </button>
                        {showActions && (
                            <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => { onEdit(); setShowActions(false); }}
                                    className="w-full px-6 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-3 transition-colors"
                                >
                                    <Edit3 size={14} /> Modifier
                                </button>
                                <button
                                    onClick={() => { onDelete(); setShowActions(false); }}
                                    className="w-full px-6 py-3 text-left text-xs font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-3 transition-colors"
                                >
                                    <Trash2 size={14} /> Supprimer
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-5 mb-8">
                    <div className="h-16 w-16 bg-slate-50 rounded-[20px] flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                        <Box size={28} />
                    </div>
                    <div>
                        <h3 className={clsx("text-xl font-black text-slate-900 tracking-tight", displayFont.className)}>{product.name}</h3>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[2px] mt-1">{product.category}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Stock</p>
                        <p className={clsx("text-2xl font-black tracking-tighter", isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-slate-900", displayFont.className)}>
                            {product.current_stock}
                            {product.unit !== 'Aucune' && (
                                <span className="text-xs font-bold text-slate-400 ml-1">{product.unit}</span>
                            )}
                        </p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix Unitaire</p>
                        <p className="text-lg font-bold text-slate-900 tracking-tight">{formatCurrency(product.unit_price)}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span>Alerte à {product.min_stock} {product.unit !== 'Aucune' ? product.unit : ''}</span>
                        <span>{product.min_stock > 0 ? Math.min(Math.round((Number(product.current_stock) / (Number(product.min_stock) * 2)) * 100), 100) : 100}%</span>
                    </div>
                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                        <div
                            className={clsx(
                                "h-full rounded-full transition-all duration-1000",
                                isOut ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${product.min_stock > 0 ? Math.min((Number(product.current_stock) / (Number(product.min_stock) * 2)) * 100, 100) : 100}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center mt-auto">
                <button
                    onClick={() => onMovement('OUT')}
                    className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-rose-600 transition-colors uppercase tracking-widest"
                >
                    <ArrowDownLeft size={14} className="text-rose-500" /> Sortie
                </button>
                <div className="w-px h-4 bg-slate-200" />
                <button
                    onClick={() => onMovement('IN')}
                    className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest"
                >
                    <ArrowUpRight size={14} className="text-emerald-500" /> Entrée
                </button>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'IN_STOCK':
            return <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-[2px] border border-emerald-100 flex items-center gap-1.5"><CheckCircle2 size={10} /> En Stock</div>;
        case 'LOW_STOCK':
            return <div className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-[2px] border border-amber-100 flex items-center gap-1.5"><AlertTriangle size={10} /> Stock Faible</div>;
        case 'OUT_OF_STOCK':
            return <div className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-[2px] border border-rose-100 flex items-center gap-1.5"><XCircle size={10} /> Rupture</div>;
        default:
            return null;
    }
}

function MovementModal({ product, type, onClose, onSuccess }: any) {
    const [quantity, setQuantity] = useState(1);
    const [reasonType, setReasonType] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [projects, setProjects] = useState < any[] > ([]);
    const [resources, setResources] = useState < any[] > ([]);
    const [submitting, setSubmitting] = useState(false);

    // Traceability fields
    const [issuedToId, setIssuedToId] = useState('');
    const [receivedFromId, setReceivedFromId] = useState('');
    const [approvedById, setApprovedById] = useState('');
    const [missionId, setMissionId] = useState('');
    const [conditionOut, setConditionOut] = useState('GOOD');
    const [conditionReturn, setConditionReturn] = useState('GOOD');
    const [damageNotes, setDamageNotes] = useState('');

    const reasonOptions = type === 'IN' ? [
        { id: 'VENDOR', label: 'Réception Fournisseur', icon: <Package size={14} /> },
        { id: 'RETURN', label: 'Retour de Chantier', icon: <History size={14} /> },
        { id: 'ADJUST', label: 'Ajustement Inventaire', icon: <RefreshCw size={14} /> },
        { id: 'OTHER', label: 'Autre motif', icon: <MoreHorizontal size={14} /> }
    ] : [
        { id: 'SITE', label: 'Affectation Chantier', icon: <MapPin size={14} /> },
        { id: 'LOSS', label: 'Perte / Casse', icon: <AlertTriangle size={14} /> },
        { id: 'MAINTENANCE', label: 'Maintenance Interne', icon: <Settings size={14} /> },
        { id: 'ADJUST', label: 'Ajustement Inventaire', icon: <RefreshCw size={14} /> },
        { id: 'OTHER', label: 'Autre motif', icon: <MoreHorizontal size={14} /> }
    ];

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [wsData, frData] = await Promise.all([
                    getWorkSites(),
                    getFieldResources()
                ]);
                setProjects(wsData);
                setResources(frData);
            } catch (err) {
                console.error("Failed to fetch initial data", err);
            }
        };
        fetchInitialData();
    }, [type, reasonType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (quantity <= 0) {
            toast.error("La quantité doit être supérieure à 0");
            return;
        }
        if (!reasonType) {
            toast.error("Veuillez sélectionner un motif");
            return;
        }

        setSubmitting(true);
        try {
            // Find team info if project and resource are selected
            let teamInfo = { name: '', leader_name: '' };
            if (selectedProjectId && (issuedToId || receivedFromId)) {
                const resId = type === 'OUT' ? issuedToId : receivedFromId;
                const project = projects.find(p => String(p.id) === selectedProjectId);
                const resource = resources.find(r => String(r.id) === String(resId));
                
                if (project && project.teams && resource) {
                    const empId = resource.employee_id;
                    const team = project.teams.find((t: any) => 
                        Number(t.leader_id) === Number(empId) || 
                        t.member_ids.map(Number).includes(Number(empId))
                    );
                    
                    if (team) {
                        teamInfo.name = team.name;
                        const leader = resources.find(r => Number(r.employee_id) === Number(team.leader_id));
                        teamInfo.leader_name = leader ? (leader.employee ? `${leader.employee.first_name} ${leader.employee.last_name}` : (leader.contractor_company || 'Freelance')) : '';
                    }
                }
            }

            let finalReason = reasonOptions.find(o => o.id === reasonType)?.label || '';
            if (reasonType === 'SITE' && selectedProjectId) {
                const project = projects.find(p => String(p.id) === selectedProjectId);
                if (project) finalReason += `: ${project.name}`;
            }
            if (reasonType === 'RETURN' && selectedProjectId) {
                const project = projects.find(p => String(p.id) === selectedProjectId);
                if (project) finalReason += ` de ${project.name}`;
            }

            if (notes) finalReason += ` (${notes})`;

            await recordMovement({
                product_id: product.id,
                quantity,
                type,
                reason: finalReason,
                reference_id: reference,
                issued_to_id: issuedToId ? Number(issuedToId) : null,
                received_from_id: receivedFromId ? Number(receivedFromId) : null,
                approved_by_id: approvedById ? Number(approvedById) : null,
                work_site_id: selectedProjectId ? Number(selectedProjectId) : null,
                mission_id: missionId,
                condition_out: conditionOut,
                condition_return: conditionReturn,
                damage_notes: damageNotes,
                team_name: teamInfo.name,
                team_leader_name: teamInfo.leader_name
            });

            toast.success(type === 'IN' ? "Stock ajouté" : "Stock déduit");
            onSuccess();
        } catch (err) {
            console.error("Failed to record movement", err);
            toast.error("Erreur lors de l'enregistrement");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[48px] w-full max-w-2xl max-h-[95vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col">
                <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h2 className={clsx("text-3xl font-black text-slate-900", displayFont.className)}>
                                {type === 'IN' ? 'Réception Stock' : 'Sortie / Affectation'}
                            </h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Box size={14} className="text-indigo-500" /> {product.name}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Quantity Input - Full width in its own row if needed, but let's put it next to reference */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantité {product.unit !== 'Aucune' ? `(${product.unit})` : ''}</label>
                                <input
                                    type="number"
                                    required
                                    autoFocus
                                    value={quantity}
                                    onChange={e => setQuantity(Number(e.target.value))}
                                    className={clsx(
                                        "w-full p-6 bg-slate-50 border-none rounded-[24px] text-3xl font-black outline-none focus:ring-4 transition-all shadow-inner text-center",
                                        type === 'IN' ? "text-emerald-600 focus:ring-emerald-500/10" : "text-rose-600 focus:ring-rose-500/10"
                                    )}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Réf. Document (BL / Facture)</label>
                                <input
                                    value={reference}
                                    onChange={e => setReference(e.target.value)}
                                    placeholder="ex: BL-2024-001"
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pourquoi cette {type === 'IN' ? 'entrée' : 'sortie'} ? (Motif)</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {reasonOptions.map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setReasonType(opt.id)}
                                            className={clsx(
                                                "p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-2 text-center",
                                                reasonType === opt.id
                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200"
                                                    : "bg-white border-slate-100 text-slate-400 hover:border-indigo-100 hover:text-indigo-600"
                                            )}
                                        >
                                            {opt.icon}
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {(reasonType === 'SITE' || reasonType === 'RETURN') && (
                                <div className="space-y-3 md:col-span-2 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sélectionner le Chantier / Projet</label>
                                    <select
                                        required
                                        value={selectedProjectId}
                                        onChange={e => setSelectedProjectId(e.target.value)}
                                        className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner appearance-none"
                                    >
                                        <option value="">Choisir un chantier...</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-3 md:col-span-2 pt-4 border-t border-slate-50">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Traçabilité & Responsabilité</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {type === 'OUT' ? (
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Remis à (Ressource) <span className="text-rose-500">*</span></label>
                                            <select
                                                required
                                                value={issuedToId}
                                                onChange={e => setIssuedToId(e.target.value)}
                                                className="w-full p-5 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                                            >
                                                <option value="">Sélectionner une ressource...</option>
                                                {resources.map(r => (
                                                    <option key={r.id} value={r.id}>{r.resource_uid} - {r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : (r.contractor_company || 'Freelance')}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Reçu de (Ressource)</label>
                                            <select
                                                value={receivedFromId}
                                                onChange={e => setReceivedFromId(e.target.value)}
                                                className="w-full p-5 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                                            >
                                                <option value="">Sélectionner une ressource...</option>
                                                {resources.map(r => (
                                                    <option key={r.id} value={r.id}>{r.resource_uid} - {r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : (r.contractor_company || 'Freelance')}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Approuvé par (Responsable)</label>
                                        <select
                                            value={approvedById}
                                            onChange={e => setApprovedById(e.target.value)}
                                            className="w-full p-5 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                                        >
                                            <option value="">Sélectionner un responsable...</option>
                                            {resources.filter(r => r.can_approve_inventory || r.can_lead_team).map(r => (
                                                <option key={r.id} value={r.id}>{r.resource_uid} - {r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : (r.contractor_company || 'Freelance')}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Mission / Chantier</label>
                                        <input
                                            value={missionId}
                                            onChange={e => setMissionId(e.target.value)}
                                            placeholder="Ex: M-2024-042"
                                            className="w-full p-5 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">État {type === 'OUT' ? 'au départ' : 'au retour'}</label>
                                        <select
                                            value={type === 'OUT' ? conditionOut : conditionReturn}
                                            onChange={e => type === 'OUT' ? setConditionOut(e.target.value) : setConditionReturn(e.target.value)}
                                            className="w-full p-5 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                                        >
                                            <option value="GOOD">Bon état</option>
                                            <option value="NEW">Neuf</option>
                                            <option value="DAMAGED">Endommagé</option>
                                            <option value="POOR">Mauvais état</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes Additionnelles / Dommages</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Précisez le contexte ou l'état du matériel..."
                                    rows={2}
                                    className="w-full p-6 bg-slate-50 border-none rounded-[24px] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 p-6 bg-slate-50 text-slate-500 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className={clsx(
                                    "flex-[2] p-6 text-white rounded-[24px] font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-2xl",
                                    type === 'IN' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20" : "bg-rose-500 hover:bg-rose-600 shadow-rose-900/20"
                                )}
                            >
                                {submitting ? "Enregistrement..." : `Confirmer la ${type === 'IN' ? 'Réception' : 'Sortie'}`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function DeleteConfirmModal({ productName, onClose, onConfirm }: { productName: string, onClose: () => void, onConfirm: () => void }) {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] w-full max-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-10 text-center space-y-6">
                    <div className="h-20 w-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-2">
                        <AlertCircle size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className={clsx("text-2xl font-black text-slate-900", displayFont.className)}>Supprimer l'article ?</h3>
                        <p className="text-sm font-medium text-slate-500">
                            Êtes-vous sûr de vouloir supprimer <span className="font-bold text-slate-900">"{productName}"</span> ? Cette action est irréversible.
                        </p>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 p-5 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 p-5 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
                        >
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}