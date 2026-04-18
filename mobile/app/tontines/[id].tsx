import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect, Stack, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { getTontineMembers, addTontineMember, getContributions, recordContribution } from '../../services/api';

export default function TontineDetail() {
    const { id } = useLocalSearchParams();
    const groupId = parseInt(id as string);

    const [members, setMembers] = useState<any[]>([]);
    const [contributions, setContributions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showAddMember, setShowAddMember] = useState(false);
    const [showContribute, setShowContribute] = useState(false);

    const [memberForm, setMemberForm] = useState({ name: '', phone: '' });
    const [contribForm, setContribForm] = useState({ member_id: '', date: new Date().toISOString().split('T')[0], status: 'PAID', amount: '' });

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const mData = await getTontineMembers(groupId);
            setMembers(mData);
            const cData = await getContributions(groupId);
            setContributions(cData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDetails();
        }, [])
    );

    const handleAddMember = async () => {
        try {
            await addTontineMember(groupId, memberForm);
            setShowAddMember(false);
            setMemberForm({ name: '', phone: '' });
            fetchDetails();
        } catch (error) {
            Alert.alert('Error', 'Failed to add member');
        }
    };

    const handleContribute = async () => {
        try {
            await recordContribution(groupId, {
                member_id: parseInt(contribForm.member_id),
                date: contribForm.date,
                status: contribForm.status,
                amount: parseFloat(contribForm.amount || '0')
            });
            setShowContribute(false);
            fetchDetails();
        } catch (error) {
            Alert.alert('Error', 'Failed to record contribution');
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ title: 'Group Details' }} />

            {loading ? (
                <ActivityIndicator size="large" color="#2563EB" className="mt-8" />
            ) : (
                <ScrollView className="p-4">
                    {/* Actions */}
                    <View className="flex-row gap-3 mb-6">
                        <TouchableOpacity
                            onPress={() => setShowAddMember(true)}
                            className="flex-1 bg-white p-4 rounded-xl items-center border border-gray-200"
                        >
                            <FontAwesome name="user-plus" size={20} color="#2563EB" />
                            <Text className="text-blue-600 font-bold mt-2">Add Member</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShowContribute(true)}
                            className="flex-1 bg-white p-4 rounded-xl items-center border border-gray-200"
                        >
                            <FontAwesome name="money" size={20} color="#10B981" />
                            <Text className="text-green-600 font-bold mt-2">Contribute</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
                        <Text className="font-bold text-gray-900 mb-3 text-lg">Members ({members.length})</Text>
                        {members.map(m => (
                            <View key={m.id} className="py-2 border-b border-gray-50 flex-row justify-between">
                                <Text className="font-medium">{m.name}</Text>
                                <Text className="text-gray-400 text-xs">{m.phone}</Text>
                            </View>
                        ))}
                    </View>

                    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-8">
                        <Text className="font-bold text-gray-900 mb-3 text-lg">History</Text>
                        {contributions.map((c, idx) => (
                            <View key={idx} className="flex-row justify-between items-center py-3 border-b border-gray-50">
                                <View>
                                    <Text className="font-medium text-gray-900">{c.member}</Text>
                                    <Text className="text-xs text-gray-500">{c.date}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="font-bold">${c.amount}</Text>
                                    <Text className={`text-xs font-bold ${c.status === 'PAID' ? 'text-green-600' : 'text-red-500'}`}>{c.status}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}

            {/* Add Member Modal */}
            <Modal animationType="slide" transparent={true} visible={showAddMember} onRequestClose={() => setShowAddMember(false)}>
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6">
                        <Text className="text-xl font-bold mb-4">Add Member</Text>
                        <TextInput
                            className="bg-gray-100 p-3 rounded-xl mb-3"
                            placeholder="Full Name"
                            value={memberForm.name}
                            onChangeText={t => setMemberForm({ ...memberForm, name: t })}
                        />
                        <TextInput
                            className="bg-gray-100 p-3 rounded-xl mb-3"
                            placeholder="Phone (Optional)"
                            value={memberForm.phone}
                            onChangeText={t => setMemberForm({ ...memberForm, phone: t })}
                        />
                        <TouchableOpacity onPress={handleAddMember} className="bg-blue-600 py-4 rounded-xl items-center mt-2">
                            <Text className="text-white font-bold">Add Member</Text>
                        </TouchableOpacity>
                        <View className="h-6" />
                    </View>
                </View>
            </Modal>

            {/* Contribute Modal */}
            <Modal animationType="slide" transparent={true} visible={showContribute} onRequestClose={() => setShowContribute(false)}>
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6">
                        <Text className="text-xl font-bold mb-4">Record Contribution</Text>

                        <View className="flex-row flex-wrap gap-2 mb-3">
                            {members.map(m => (
                                <TouchableOpacity
                                    key={m.id}
                                    onPress={() => setContribForm({ ...contribForm, member_id: m.id.toString() })}
                                    className={`px-3 py-2 rounded-lg border ${contribForm.member_id === m.id.toString() ? 'bg-blue-50 border-blue-500' : 'border-gray-200'}`}
                                >
                                    <Text className={contribForm.member_id === m.id.toString() ? 'text-blue-700 font-bold' : 'text-gray-600'}>{m.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            className="bg-gray-100 p-3 rounded-xl mb-3"
                            placeholder="Amount Paid (e.g. 500)"
                            keyboardType="numeric"
                            value={contribForm.amount}
                            onChangeText={t => setContribForm({ ...contribForm, amount: t })}
                        />

                        <TouchableOpacity onPress={handleContribute} className="bg-green-600 py-4 rounded-xl items-center mt-2">
                            <Text className="text-white font-bold">Save Contribution</Text>
                        </TouchableOpacity>
                        <View className="h-6" />
                    </View>
                </View>
            </Modal>
        </View>
    );
}
