import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useFocusEffect, Stack } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { getDebts, createDebt, payDebt } from '../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DebtsScreen() {
    const [activeTab, setActiveTab] = useState<'SUPPLIER' | 'CLIENT'>('SUPPLIER');
    const [debts, setDebts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [createModalVisible, setCreateModalVisible] = useState(false);

    // Payment Modal State
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        counterparty_name: '',
        amount: '',
        due_date: new Date().toISOString().split('T')[0],
        description: ''
    });

    const fetchDebts = async () => {
        setLoading(true);
        try {
            const data = await getDebts(activeTab);
            setDebts(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch debts');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDebts();
        }, [activeTab])
    );

    const handleCreate = async () => {
        if (!formData.counterparty_name || !formData.amount) {
            Alert.alert('Error', 'Name and Amount are required');
            return;
        }
        try {
            await createDebt({
                ...formData,
                type: activeTab,
                amount: parseFloat(formData.amount)
            });
            setCreateModalVisible(false);
            setFormData({ counterparty_name: '', amount: '', due_date: new Date().toISOString().split('T')[0], description: '' });
            fetchDebts();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to create debt');
        }
    };

    const openPaymentModal = (item: any) => {
        setSelectedDebt(item);
        const outstanding = item.amount - item.paid_amount;
        setPaymentAmount(outstanding.toFixed(2));
        setPaymentModalVisible(true);
    };

    const handlePaymentSubmit = async () => {
        const amount = parseFloat(paymentAmount || '0');
        if (!selectedDebt || amount <= 0) {
            Alert.alert('Error', 'Invalid amount');
            return;
        }

        setLoading(true);
        try {
            await payDebt(selectedDebt.id, { amount, date: new Date().toISOString().split('T')[0] });
            Alert.alert('Success', 'Payment recorded');
            setPaymentModalVisible(false);
            fetchDebts();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-center gap-3 overflow-hidden flex-1 mr-2">
                    <View className={`p-3 rounded-full ${item.type === 'SUPPLIER' ? 'bg-red-50' : 'bg-green-50'}`}>
                        <FontAwesome
                            name={item.type === 'SUPPLIER' ? 'arrow-down' : 'arrow-up'}
                            size={16}
                            color={item.type === 'SUPPLIER' ? '#EF4444' : '#10B981'}
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>{item.counterparty_name}</Text>
                        <Text className="text-gray-500 text-xs" numberOfLines={1}>{item.description || 'No description'}</Text>
                    </View>
                </View>
                <View className={`px-2 py-1 rounded-full ${item.status === 'PAID' ? 'bg-green-100' :
                    item.status === 'PARTIAL' ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                    <Text className={`text-xs font-bold ${item.status === 'PAID' ? 'text-green-800' :
                        item.status === 'PARTIAL' ? 'text-yellow-800' : 'text-gray-800'
                        }`}>{item.status}</Text>
                </View>
            </View>

            <View className="flex-row justify-between mt-3 bg-gray-50 p-3 rounded-lg">
                <View>
                    <Text className="text-gray-500 text-xs uppercase mb-1">Total</Text>
                    <Text className="font-bold text-gray-900">${item.amount.toFixed(2)}</Text>
                </View>
                <View>
                    <Text className="text-gray-500 text-xs uppercase mb-1">Paid</Text>
                    <Text className="font-bold text-green-600">${item.paid_amount.toFixed(2)}</Text>
                </View>
                <View>
                    <Text className="text-gray-500 text-xs uppercase mb-1">Outstanding</Text>
                    <Text className="font-bold text-red-600">${(item.amount - item.paid_amount).toFixed(2)}</Text>
                </View>
            </View>

            {item.status !== 'PAID' && (
                <TouchableOpacity
                    onPress={() => openPaymentModal(item)}
                    className="mt-3 bg-gray-900 py-3 rounded-xl items-center"
                >
                    <Text className="text-white font-semibold">Record Payment</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 py-4 flex-row justify-between items-center bg-white border-b border-gray-100">
                    <Text className="text-2xl font-bold text-gray-900">Debts & Credits</Text>
                </View>

                {/* Tabs */}
                <View className="flex-row bg-white border-b border-gray-100 px-4">
                    <TouchableOpacity
                        onPress={() => setActiveTab('SUPPLIER')}
                        className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'SUPPLIER' ? 'border-red-500' : 'border-transparent'}`}
                    >
                        <Text className={`font-semibold ${activeTab === 'SUPPLIER' ? 'text-red-600' : 'text-gray-500'}`}>I Owe</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('CLIENT')}
                        className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'CLIENT' ? 'border-green-500' : 'border-transparent'}`}
                    >
                        <Text className={`font-semibold ${activeTab === 'CLIENT' ? 'text-green-600' : 'text-gray-500'}`}>Owed to Me</Text>
                    </TouchableOpacity>
                </View>

                {/* List */}
                {loading && !debts.length ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#2563EB" />
                    </View>
                ) : (
                    <FlatList
                        data={debts}
                        renderItem={renderItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                        ListEmptyComponent={
                            <View className="items-center mt-12 bg-white mx-6 p-8 rounded-2xl border border-gray-100">
                                <View className="bg-gray-50 p-4 rounded-full mb-4">
                                    <FontAwesome name="folder-open-o" size={32} color="#9CA3AF" />
                                </View>
                                <Text className="text-gray-900 font-bold text-lg">No records found</Text>
                                <Text className="text-gray-500 mt-1 text-center">
                                    {activeTab === 'SUPPLIER' ? "You don't owe anything properly recorded." : "No one owes you anything recorded."}
                                </Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>

            {/* FAB */}
            <TouchableOpacity
                onPress={() => setCreateModalVisible(true)}
                className="absolute bottom-6 right-6 bg-blue-600 w-16 h-16 rounded-full justify-center items-center shadow-lg shadow-blue-500/30"
            >
                <FontAwesome name="plus" size={24} color="white" />
            </TouchableOpacity>

            {/* Create Modal */}
            <Modal animationType="slide" transparent={true} visible={createModalVisible} onRequestClose={() => setCreateModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-white rounded-t-3xl p-6 pb-10">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-bold">Record {activeTab === 'SUPPLIER' ? 'Debt' : 'Credit'}</Text>
                                <TouchableOpacity onPress={() => setCreateModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                                    <Ionicons name="close" size={24} color="#374151" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView className="space-y-4">
                                <View>
                                    <Text className="text-gray-700 font-medium mb-1.5">Name (Person/Company)</Text>
                                    <TextInput
                                        className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-base"
                                        value={formData.counterparty_name}
                                        onChangeText={t => setFormData({ ...formData, counterparty_name: t })}
                                        placeholder="e.g. John Doe"
                                    />
                                </View>
                                <View>
                                    <Text className="text-gray-700 font-medium mb-1.5">Amount</Text>
                                    <TextInput
                                        className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-base"
                                        value={formData.amount}
                                        onChangeText={t => setFormData({ ...formData, amount: t })}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View>
                                    <Text className="text-gray-700 font-medium mb-1.5">Description (Optional)</Text>
                                    <TextInput
                                        className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-base"
                                        value={formData.description}
                                        onChangeText={t => setFormData({ ...formData, description: t })}
                                        placeholder="e.g. Invoice #123"
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={handleCreate}
                                    className="bg-blue-600 py-4 rounded-xl items-center mt-2 shadow-sm"
                                >
                                    <Text className="text-white font-bold text-lg">Save Record</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Payment Modal */}
            <Modal animationType="fade" transparent={true} visible={paymentModalVisible} onRequestClose={() => setPaymentModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-center items-center bg-black/60 px-4">
                    <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                        <View className="items-center mb-6">
                            <View className="bg-green-100 p-4 rounded-full mb-3">
                                <Ionicons name="cash-outline" size={32} color="#16A34A" />
                            </View>
                            <Text className="text-xl font-bold text-gray-900">Record Payment</Text>
                            <Text className="text-gray-500 text-center mt-1">
                                Enter the amount paid towards this debt.
                            </Text>
                        </View>

                        <View className="mb-6">
                            <Text className="text-gray-700 font-medium mb-1.5 ml-1">Payment Amount</Text>
                            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 h-14">
                                <Text className="text-gray-500 mr-2 text-lg">$</Text>
                                <TextInput
                                    className="flex-1 text-gray-900 text-lg font-bold"
                                    value={paymentAmount}
                                    onChangeText={setPaymentAmount}
                                    keyboardType="numeric"
                                    autoFocus
                                />
                            </View>
                            {selectedDebt && (
                                <Text className="text-gray-500 text-xs mt-2 text-right">
                                    Outstanding: ${(selectedDebt.amount - selectedDebt.paid_amount).toFixed(2)}
                                </Text>
                            )}
                        </View>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setPaymentModalVisible(false)}
                                className="flex-1 py-3.5 bg-gray-100 rounded-xl items-center"
                            >
                                <Text className="text-gray-700 font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handlePaymentSubmit}
                                className="flex-1 py-3.5 bg-green-600 rounded-xl items-center shadow-lg shadow-green-500/30"
                            >
                                <Text className="text-white font-bold">Verify Pay</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
