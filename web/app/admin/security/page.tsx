'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { Shield, Lock, Globe, Users, User, Plus, Check, ChevronRight, Settings, Save, Trash2, X, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import clsx from 'clsx';

const SCOPES = [
    { id: 'self', label: 'Soi-même', icon: User },
    { id: 'team', label: 'Équipe', icon: Users },
    { id: 'department', label: 'Département', icon: Globe },
    { id: 'organization', label: 'Organisation', icon: Shield },
];

export default function SecurityAdmin() {
    const [discovery, setDiscovery] = useState<any>(null);
    const [roles, setRoles] = useState<any[]>([]);
    const [selectedRole, setSelectedRole] = useState<any>(null);
    const [rolePermissions, setRolePermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    async function fetchInitialData() {
        try {
            const [discRes, rolesRes] = await Promise.all([
                api.get('/security/discovery'),
                api.get('/security/roles')
            ]);
            setDiscovery(discRes.data);
            setRoles(rolesRes.data);
            if (rolesRes.data.length > 0) {
                selectRole(rolesRes.data[0]);
            }
        } catch (err) {
            console.error("Error fetching initial data:", err);
        } finally {
            setLoading(false);
        }
    }

    async function selectRole(role: any) {
        setSelectedRole(role);
        try {
            const res = await api.get(`/security/roles/${role.id}/permissions`);
            setRolePermissions(res.data);
        } catch (err) {
            console.error("Error fetching role permissions:", err);
        }
    }

    const hasPermission = (resource: string, action: string) => {
        return rolePermissions.some(p => p.resource === resource && p.action === action);
    };

    const getScope = (resource: string, action: string) => {
        return rolePermissions.find(p => p.resource === resource && p.action === action)?.scope || 'organization';
    };

    const togglePermission = (resource: string, action: string) => {
        if (hasPermission(resource, action)) {
            setRolePermissions(prev => prev.filter(p => !(p.resource === resource && p.action === action)));
        } else {
            setRolePermissions(prev => [...prev, { resource, action, scope: 'organization', conditions: {} }]);
        }
    };

    const updateScope = (resource: string, action: string, scope: string) => {
        setRolePermissions(prev => prev.map(p => 
            (p.resource === resource && p.action === action) ? { ...p, scope } : p
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post(`/security/roles/${selectedRole.id}/permissions`, rolePermissions);
            // Refresh list
            const rolesRes = await api.get('/security/roles');
            setRoles(rolesRes.data);
            alert("Permissions sauvegardées avec succès !");
        } catch (err) {
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Initialisation de la matrice de sécurité...</div>;

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">Sécurité & Rôles</h1>
                        <p className="text-gray-500 font-medium">Contrôle d'accès granulaire RBAC / ABAC</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
                            <Plus size={18} /> Nouveau Rôle
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                            Sauvegarder les modifications
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* Left: Roles List */}
                    <div className="col-span-12 lg:col-span-3 space-y-4">
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Rôles de l'entreprise</h2>
                        <div className="space-y-2">
                            {roles.map(role => (
                                <button
                                    key={role.id}
                                    onClick={() => selectRole(role)}
                                    className={clsx(
                                        "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group",
                                        selectedRole?.id === role.id 
                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
                                            : "bg-white border-gray-100 text-gray-700 hover:border-indigo-200"
                                    )}
                                >
                                    <div className="min-w-0">
                                        <p className="font-bold truncate">{role.name}</p>
                                        <p className={clsx("text-[10px] font-bold uppercase tracking-wider", selectedRole?.id === role.id ? "text-indigo-100" : "text-gray-400")}>
                                            {role.permissions_count} permissions
                                        </p>
                                    </div>
                                    <ChevronRight size={16} className={clsx("transition-transform", selectedRole?.id === role.id ? "translate-x-1" : "text-gray-300 group-hover:text-indigo-400")} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Permission Matrix */}
                    <div className="col-span-12 lg:col-span-9">
                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-gray-900 flex items-center gap-2">
                                        Configuration : <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">{selectedRole?.name}</span>
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">{selectedRole?.description || "Aucune description fournie"}</p>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-indigo-600" /> Actif
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-gray-200" /> Inactif
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Ressource</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Permission</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Scope (Portée)</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">ABAC</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {discovery && Object.entries(discovery).map(([resName, data]: [string, any]) => (
                                            <React.Fragment key={resName}>
                                                <tr className="bg-gray-50/30">
                                                    <td colSpan={4} className="px-6 py-2">
                                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{data.module}</span>
                                                    </td>
                                                </tr>
                                                {data.actions.map((action: string) => {
                                                    const active = hasPermission(resName, action);
                                                    const currentScope = getScope(resName, action);
                                                    return (
                                                        <tr key={`${resName}-${action}`} className="hover:bg-gray-50/50 transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={clsx("p-2 rounded-xl transition-all", active ? "bg-indigo-50 text-indigo-600" : "bg-gray-50 text-gray-300")}>
                                                                        <Lock size={14} />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-black text-gray-700 uppercase tracking-tight">{action}</span>
                                                                        <span className="text-[10px] font-bold text-gray-400 capitalize">{resName}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <button
                                                                    onClick={() => togglePermission(resName, action)}
                                                                    className={clsx(
                                                                        "w-10 h-5 rounded-full transition-all relative inline-flex items-center px-1",
                                                                        active ? "bg-indigo-600 shadow-inner" : "bg-gray-200"
                                                                    )}
                                                                >
                                                                    <div className={clsx(
                                                                        "h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
                                                                        active ? "translate-x-4.5" : "translate-x-0"
                                                                    )} />
                                                                </button>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className={clsx("flex items-center gap-1 transition-opacity", !active && "opacity-20 pointer-events-none")}>
                                                                    {SCOPES.map(s => {
                                                                        const SIcon = s.icon;
                                                                        return (
                                                                            <button
                                                                                key={s.id}
                                                                                onClick={() => updateScope(resName, action, s.id)}
                                                                                title={s.label}
                                                                                className={clsx(
                                                                                    "p-1.5 rounded-lg border-2 transition-all",
                                                                                    currentScope === s.id 
                                                                                        ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                                                                                        : "bg-white border-transparent text-gray-400 hover:bg-gray-50"
                                                                                )}
                                                                            >
                                                                                <SIcon size={14} />
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <button className={clsx("p-2 rounded-lg border border-dashed text-gray-400 hover:border-indigo-300 hover:text-indigo-600 transition-all", !active && "opacity-20 pointer-events-none")}>
                                                                    <Settings size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                            <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-800 leading-relaxed">
                                <span className="font-bold">Attention :</span> Les modifications apportées aux rôles système (SUPER_ADMIN, ADMIN) affectent immédiatement tous les utilisateurs associés. Assurez-vous de bien comprendre la portée de chaque permission avant de sauvegarder.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

import React from 'react';
