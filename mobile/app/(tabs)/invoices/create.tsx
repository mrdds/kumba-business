import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
// import { SafeAreaView } from 'react-native-safe-area-context'; // Using react-native SafeAreaView for modal comp
import { createInvoice, getCustomers } from '../../../services/api';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import '../../../global.css';

export default function CreateInvoice() {
    const router = useRouter();
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const [items, setItems] = useState([{ description: '', quantity: '1', unit_price: '' }]);
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            const fetchClients = async () => {
                try {
                    const data = await getCustomers();
                    setCustomers(data);
                } catch (err) {
                    console.error(err);
                }
            };
            fetchClients();
        }, [])
    );

    const addItem = () => {
        setItems([...items, { description: '', quantity: '1', unit_price: '' }]);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.unit_price) || 0;
            return sum + (qty * price);
        }, 0);
    };

    const handleSubmit = async () => {
        if (!selectedCustomer) {
            Alert.alert('Error', 'Please select a client');
            return;
        }

        if (items.some(i => !i.description || !i.unit_price)) {
            Alert.alert('Error', 'Please fill in all required item fields');
            return;
        }

        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            await createInvoice({
                client_name: selectedCustomer.name,
                client_email: selectedCustomer.email,
                date: today,
                due_date: today,
                items: items.map(i => ({
                    description: i.description,
                    quantity: parseInt(i.quantity) || 1,
                    unit_price: parseFloat(i.unit_price) || 0
                }))
            });
            Alert.alert('Success', 'Invoice created successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to create invoice');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center p-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
                    <FontAwesome name="arrow-left" size={20} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">New Invoice</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View className="mb-6">
                    <Text className="font-bold text-gray-900 mb-2">Client Details</Text>

                    {selectedCustomer ? (
                        <View className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2">
                            <View className="flex-row justify-between items-start">
                                <View>
                                    <Text className="font-bold text-lg text-blue-900">{selectedCustomer.name}</Text>
                                    <Text className="text-blue-700">{selectedCustomer.email || 'No email'}</Text>
                                    <Text className="text-blue-700">{selectedCustomer.phone || selectedCustomer.address || 'No details'}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setModalVisible(true)} className="p-2">
                                    <Text className="text-blue-600 font-bold text-xs">CHANGE</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => setModalVisible(true)}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex-row justify-between items-center mb-2"
                        >
                            <Text className="text-gray-500">Select Client...</Text>
                            <FontAwesome name="chevron-down" size={14} color="gray" />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity onPress={() => router.push('/clients/create')} className="items-end">
                        <Text className="text-blue-600 font-medium">+ New Client</Text>
                    </TouchableOpacity>
                </View>

                <View className="mb-6">
                    <Text className="font-bold text-gray-900 mb-2">Items</Text>
                    {items.map((item, index) => (
                        <View key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-xs font-bold text-gray-500">Item #{index + 1}</Text>
                                {items.length > 1 && (
                                    <TouchableOpacity onPress={() => removeItem(index)}>
                                        <Text className="text-red-500 text-xs font-bold">Remove</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TextInput
                                className="bg-white border border-gray-200 rounded-md p-2 mb-2"
                                placeholder="Description"
                                value={item.description}
                                onChangeText={(v) => updateItem(index, 'description', v)}
                            />
                            <View className="flex-row gap-2">
                                <View className="flex-1">
                                    <TextInput
                                        className="bg-white border border-gray-200 rounded-md p-2"
                                        placeholder="Qty"
                                        keyboardType="numeric"
                                        value={item.quantity}
                                        onChangeText={(v) => updateItem(index, 'quantity', v)}
                                    />
                                </View>
                                <View className="flex-[2]">
                                    <TextInput
                                        className="bg-white border border-gray-200 rounded-md p-2"
                                        placeholder="Price"
                                        keyboardType="numeric"
                                        value={item.unit_price}
                                        onChangeText={(v) => updateItem(index, 'unit_price', v)}
                                    />
                                </View>
                            </View>
                        </View>
                    ))}
                    <TouchableOpacity onPress={addItem} className="flex-row items-center justify-center py-3 border border-dashed border-blue-300 rounded-lg bg-blue-50">
                        <FontAwesome name="plus" size={12} color="#2563EB" />
                        <Text className="text-blue-600 font-bold ml-2">Add Item</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <View className="p-4 border-t border-gray-200 bg-gray-50">
                <View className="flex-row justify-between mb-4">
                    <Text className="text-gray-500 text-lg">Total</Text>
                    <Text className="text-gray-900 text-xl font-bold">${calculateTotal().toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                    className={`w-full py-4 rounded-xl items-center ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Create Invoice</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Client Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl h-[70%] p-4">
                        <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
                            <Text className="text-xl font-bold text-gray-900">Select Client</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="p-2">
                                <FontAwesome name="close" size={20} color="gray" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={customers}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="p-4 border-b border-gray-50 flex-row items-center"
                                    onPress={() => {
                                        setSelectedCustomer(item);
                                        setModalVisible(false);
                                    }}
                                >
                                    <View className="h-10 w-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                                        <Text className="text-blue-600 font-bold">{item.name[0]}</Text>
                                    </View>
                                    <View>
                                        <Text className="font-bold text-gray-900 text-lg">{item.name}</Text>
                                        <Text className="text-gray-500">{item.email}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View className="py-10 items-center">
                                    <Text className="text-gray-500 mb-4">No clients found.</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setModalVisible(false);
                                            router.push('/clients/create');
                                        }}
                                    >
                                        <Text className="text-blue-600 font-bold">Create New Client</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
