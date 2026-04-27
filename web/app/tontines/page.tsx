'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '../dashboard-layout';
import { getTontineGroups, createTontineGroup, getTontineMembers, addTontineMember, getContributions, recordContribution } from '../../services/api';
import { Loader2, Plus, Users, Calendar, Coins, CheckCircle, XCircle } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { useTranslation } from 'react-i18next';

export default function TontinesPage() {
    const { t } = useTranslation();
    const { showToast } = useNotification();
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [contributions, setContributions] = useState<any[]>([]);

    // Modal States
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [showContribute, setShowContribute] = useState(false);

    // Form Data
    const [groupForm, setGroupForm] = useState({ name: '', contribution_amount: '', frequency: 'MONTHLY', start_date: new Date().toISOString().split('T')[0] });
    const [memberForm, setMemberForm] = useState({ name: '', phone: '' });
    const [contribForm, setContribForm] = useState({ member_id: '', date: new Date().toISOString().split('T')[0], status: 'PAID' });

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            fetchDetails(selectedGroup.id);
        }
    }, [selectedGroup]);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const data = await getTontineGroups();
            setGroups(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async (groupId: number) => {
        try {
            const mData = await getTontineMembers(groupId);
            setMembers(mData);
            const cData = await getContributions(groupId);
            setContributions(cData);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createTontineGroup({ ...groupForm, contribution_amount: parseFloat(groupForm.contribution_amount) });
            setShowCreateGroup(false);
            fetchGroups();
            showToast(t('tontines.toast.group_success'), 'success');
        } catch (error) {
            showToast(t('tontines.toast.group_error'), 'error');
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addTontineMember(selectedGroup.id, memberForm);
            setShowAddMember(false);
            setMemberForm({ name: '', phone: '' });
            fetchDetails(selectedGroup.id);
            showToast(t('tontines.toast.member_success'), 'success');
        } catch (error) {
            showToast(t('tontines.toast.member_error'), 'error');
        }
    };

    const handleContribute = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await recordContribution(selectedGroup.id, {
                ...contribForm,
                amount: selectedGroup.contribution_amount,
                member_id: parseInt(contribForm.member_id)
            });
            setShowContribute(false);
            fetchDetails(selectedGroup.id);
            showToast(t('tontines.toast.contrib_success'), 'success');
        } catch (error) {
            showToast(t('tontines.toast.contrib_error'), 'error');
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-lg font-bold text-gray-900">{t('tontines.title')}</h1>
                    <p className="text-gray-500">{t('tontines.subtitle')}</p>
                </div>
                {!selectedGroup && (
                    <button
                        onClick={() => setShowCreateGroup(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} /> {t('tontines.new_group')}
                    </button>
                )}
            </div>

            {selectedGroup ? (
                // --- Detail View ---
                <div className="space-y-6">
                    <button onClick={() => setSelectedGroup(null)} className="text-sm text-gray-500 hover:text-gray-900 mb-2">{t('tontines.back_to_groups')}</button>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{selectedGroup.name}</h2>
                            <p className="text-gray-500 capitalize">{selectedGroup.frequency} Contribution: <strong>{selectedGroup.contribution_amount} FCFA</strong></p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowAddMember(true)}
                                className="border border-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm hover:bg-gray-50"
                            >
                                <Users size={16} /> {t('tontines.add_member')}
                            </button>
                            <button
                                onClick={() => setShowContribute(true)}
                                className="bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm hover:bg-green-700"
                            >
                                <Coins size={16} /> {t('tontines.record_contribution')}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Members List */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Users size={18} /> {t('tontines.members_count')} ({members.length})
                            </h3>
                            <ul className="space-y-3">
                                {members.map(m => (
                                    <li key={m.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0">
                                        <span className="font-medium text-gray-900">{m.name}</span>
                                        {m.phone && <span className="text-gray-400 text-xs">{m.phone}</span>}
                                    </li>
                                ))}
                                {members.length === 0 && <p className="text-sm text-gray-400">{t('tontines.no_members')}</p>}
                            </ul>
                        </div>

                        {/* Recent Contributions Grid */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar size={18} /> {t('tontines.history_title')}
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{t('tontines.table.date')}</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{t('tontines.table.member')}</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{t('tontines.table.amount')}</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{t('tontines.table.status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {contributions.map((c, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-500">{c.date}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.member}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{c.amount} FCFA</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {c.status === 'PAID' ? (
                                                        <span className="flex items-center gap-1 text-green-600 font-medium">
                                                            <CheckCircle size={14} /> {t('tontines.status.paid')}
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-red-500 font-medium">
                                                            <XCircle size={14} /> {t('tontines.status.missed')}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {contributions.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">{t('tontines.no_contributions')}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // --- Group List ---
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? <Loader2 className="animate-spin" /> : groups.map(group => (
                        <div
                            key={group.id}
                            onClick={() => setSelectedGroup(group)}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-500 cursor-pointer transition-colors group"
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600">{group.name}</h3>
                            <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
                                <span className="bg-gray-100 px-2 py-1 rounded capitalize">{group.frequency}</span>
                                <span className="font-semibold text-gray-900">{group.contribution_amount} FCFA</span>
                            </div>
                        </div>
                    ))}
                    {!loading && groups.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            {t('tontines.empty_groups')}
                        </div>
                    )}
                </div>
            )}

            {/* --- Modals --- */}

            {/* Create Group Modal */}
            {showCreateGroup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4">{t('tontines.modals.create_group.title')}</h2>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <input required placeholder={t('tontines.modals.create_group.name')} className="w-full p-2 border rounded" value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} />
                            <input required type="number" placeholder={t('tontines.modals.create_group.amount')} className="w-full p-2 border rounded" value={groupForm.contribution_amount} onChange={e => setGroupForm({ ...groupForm, contribution_amount: e.target.value })} />
                            <select className="w-full p-2 border rounded" value={groupForm.frequency} onChange={e => setGroupForm({ ...groupForm, frequency: e.target.value })}>
                                <option value="WEEKLY">{t('tontines.modals.create_group.weekly')}</option>
                                <option value="MONTHLY">{t('tontines.modals.create_group.monthly')}</option>
                            </select>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowCreateGroup(false)} className="px-3 py-1 text-gray-500">{t('tontines.modals.create_group.cancel')}</button>
                                <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">{t('tontines.modals.create_group.create_btn')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4">{t('tontines.modals.add_member.title')}</h2>
                        <form onSubmit={handleAddMember} className="space-y-4">
                            <input required placeholder={t('tontines.modals.add_member.name')} className="w-full p-2 border rounded" value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} />
                            <input placeholder={t('tontines.modals.add_member.phone')} className="w-full p-2 border rounded" value={memberForm.phone} onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })} />
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowAddMember(false)} className="px-3 py-1 text-gray-500">{t('tontines.modals.add_member.cancel')}</button>
                                <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">{t('tontines.modals.add_member.add_btn')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Record Contribution Modal */}
            {showContribute && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4">{t('tontines.modals.record_contribution.title')}</h2>
                        <form onSubmit={handleContribute} className="space-y-4">
                            <select required className="w-full p-2 border rounded" value={contribForm.member_id} onChange={e => setContribForm({ ...contribForm, member_id: e.target.value })}>
                                <option value="">{t('tontines.modals.record_contribution.select_member')}</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            <input type="date" required className="w-full p-2 border rounded" value={contribForm.date} onChange={e => setContribForm({ ...contribForm, date: e.target.value })} />
                            <select className="w-full p-2 border rounded" value={contribForm.status} onChange={e => setContribForm({ ...contribForm, status: e.target.value })}>
                                <option value="PAID">{t('tontines.status.paid')}</option>
                                <option value="MISSED">{t('tontines.status.missed')}</option>
                            </select>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowContribute(false)} className="px-3 py-1 text-gray-500">{t('tontines.modals.record_contribution.cancel')}</button>
                                <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">{t('tontines.modals.record_contribution.save_btn')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </DashboardLayout>
    );
}
