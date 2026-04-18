import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createQuote } from '../../services/api'; // Ensure getCustomers is imported
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import '../../global.css'; // Relpath fixed

export default function CreateQuote() {
    const router = useRouter();
    const [clientName, setClientName] = useState('');
    const [date, setDate] = useState(new Date());
    const [validUntil, setValidUntil] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // +7 days
    const [items, setItems] = useState([{ description: '', quantity: '1', unit_price: '0.00' }]);
    const [loading, setLoading] = useState(false);

    // Date pickers
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showValidPicker, setShowValidPicker] = useState(false);

    const handleAddItem = () => {
        setItems([...items, { description: '', quantity: '1', unit_price: '0.00' }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (index: number, field: string, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!clientName) {
            Alert.alert("Error", "Please enter a client name");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                client_name: clientName,
                date: date.toISOString().split('T')[0],
                valid_until: validUntil.toISOString().split('T')[0],
                items: items.map(item => ({
                    description: item.description,
                    quantity: parseInt(item.quantity) || 0,
                    unit_price: parseFloat(item.unit_price) || 0
                }))
            };

            await createQuote(payload);
            Alert.alert("Success", "Quote created successfully");
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to create quote");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView edges={['top']} className="bg-white">
                <View className="px-4 py-3 flex-row items-center border-b border-gray-100">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <Ionicons name="close" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="font-bold text-lg text-gray-900 flex-1">New Quote</Text>
                    <TouchableOpacity onPress={handleSubmit} disabled={loading}>
                        <Text className={`font-bold text-lg ${loading ? 'text-gray-400' : 'text-blue-600'}`}>Save</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView className="flex-1 p-4">
                {/* Client Info */}
                <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
                    <Text className="text-gray-500 text-xs font-bold uppercase mb-2">Client</Text>
                    <TextInput
                        className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2"
                        placeholder="Client Name"
                        value={clientName}
                        onChangeText={setClientName}
                    />
                </View>

                {/* Dates */}
                <View className="flex-row space-x-4 mb-4">
                    <TouchableOpacity
                        className="flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Date</Text>
                        <Text className="text-gray-900 font-semibold">{date.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
                        onPress={() => setShowValidPicker(true)}
                    >
                        <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Valid Until</Text>
                        <Text className="text-red-500 font-semibold">{validUntil.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setDate(selectedDate);
                        }}
                    />
                )}
                {showValidPicker && (
                    <DateTimePicker
                        value={validUntil}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowValidPicker(false);
                            if (selectedDate) setValidUntil(selectedDate);
                        }}
                    />
                )}

                {/* Items */}
                <View className="mb-20">
                    <Text className="text-gray-500 text-xs font-bold uppercase mb-2 ml-1">Items</Text>
                    {items.map((item, index) => (
                        <View key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-3">
                            <View className="flex-row justify-between mb-2">
                                <TextInput
                                    className="flex-1 font-semibold text-gray-900 text-base mr-2"
                                    placeholder="Description"
                                    value={item.description}
                                    onChangeText={(text) => handleItemChange(index, 'description', text)}
                                />
                                {items.length > 1 && (
                                    <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View className="flex-row space-x-4">
                                <View className="flex-1">
                                    <Text className="text-xs text-gray-500 mb-1">Qty</Text>
                                    <TextInput
                                        className="bg-gray-50 p-2 rounded-lg text-gray-900"
                                        keyboardType="numeric"
                                        value={item.quantity}
                                        onChangeText={(text) => handleItemChange(index, 'quantity', text)}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs text-gray-500 mb-1">Price</Text>
                                    <TextInput
                                        className="bg-gray-50 p-2 rounded-lg text-gray-900"
                                        keyboardType="numeric"
                                        value={item.unit_price}
                                        onChangeText={(text) => handleItemChange(index, 'unit_price', text)}
                                    />
                                </View>
                                <View className="flex-1 items-end justify-center pt-4">
                                    <Text className="font-bold text-gray-900">
                                        ${((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity
                        className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex-row justify-center items-center"
                        onPress={handleAddItem}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
                        <Text className="text-blue-600 font-bold ml-2">Add Item</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}
