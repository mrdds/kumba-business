import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { getTontineGroups, createTontineGroup } from '../../services/api';

export default function TontinesList() {
    const router = useRouter();
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    const [form, setForm] = useState({ name: '', contribution_amount: '', frequency: 'MONTHLY' });

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const data = await getTontineGroups();
            setGroups(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch tontines');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchGroups();
        }, [])
    );

    const handleCreate = async () => {
        try {
            await createTontineGroup({
                ...form,
                contribution_amount: parseFloat(form.contribution_amount),
                start_date: new Date().toISOString().split('T')[0]
            });
            setModalVisible(false);
            setForm({ name: '', contribution_amount: '', frequency: 'MONTHLY' });
            fetchGroups();
        } catch (error) {
            Alert.alert('Error', 'Failed to create group');
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => router.push(`/tontines/${item.id}`)}
            className="bg-white p-6 rounded-xl mb-4 shadow-sm border border-gray-100"
        >
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xl font-bold text-gray-900">{item.name}</Text>
                <FontAwesome name="chevron-right" size={12} color="#9CA3AF" />
            </View>
            <View className="flex-row gap-2">
                <View className="bg-blue-50 px-2 py-1 rounded">
                    <Text className="text-blue-600 text-xs font-bold capitalize">{item.frequency}</Text>
                </View>
                <View className="bg-gray-100 px-2 py-1 rounded">
                    <Text className="text-gray-600 text-xs font-bold">${item.contribution_amount}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50 p-4">
            <Stack.Screen options={{ title: 'Savings Groups' }} />

            {loading ? (
                <ActivityIndicator size="large" color="#2563EB" className="mt-8" />
            ) : (
                <FlatList
                    data={groups}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    ListEmptyComponent={
                        <View className="items-center mt-12">
                            <FontAwesome name="users" size={48} color="#9CA3AF" />
                            <Text className="text-gray-500 mt-4">No groups found.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full justify-center items-center shadow-lg"
            >
                <FontAwesome name="plus" size={24} color="white" />
            </TouchableOpacity>

            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6">
                        <Text className="text-xl font-bold mb-4">New Savings Group</Text>
                        <TextInput
                            className="bg-gray-100 p-3 rounded-xl mb-3"
                            placeholder="Group Name"
                            value={form.name}
                            onChangeText={t => setForm({ ...form, name: t })}
                        />
                        <TextInput
                            className="bg-gray-100 p-3 rounded-xl mb-3"
                            placeholder="Contribution Amount"
                            keyboardType="numeric"
                            value={form.contribution_amount}
                            onChangeText={t => setForm({ ...form, contribution_amount: t })}
                        />

                        <View className="flex-row gap-2 mb-4">
                            <TouchableOpacity
                                onPress={() => setForm({ ...form, frequency: 'WEEKLY' })}
                                className={`flex-1 p-3 rounded-xl items-center ${form.frequency === 'WEEKLY' ? 'bg-blue-100 border border-blue-500' : 'bg-gray-100'}`}
                            >
                                <Text className={form.frequency === 'WEEKLY' ? 'text-blue-700 font-bold' : 'text-gray-500'}>Weekly</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setForm({ ...form, frequency: 'MONTHLY' })}
                                className={`flex-1 p-3 rounded-xl items-center ${form.frequency === 'MONTHLY' ? 'bg-blue-100 border border-blue-500' : 'bg-gray-100'}`}
                            >
                                <Text className={form.frequency === 'MONTHLY' ? 'text-blue-700 font-bold' : 'text-gray-500'}>Monthly</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={handleCreate}
                            className="bg-blue-600 py-4 rounded-xl items-center"
                        >
                            <Text className="text-white font-bold text-lg">Create Group</Text>
                        </TouchableOpacity>
                        <View className="h-6" />
                    </View>
                </View>
            </Modal>
        </View>
    );
}
