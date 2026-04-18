import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createTransaction } from '../services/api';

export default function AddTransaction() {
    const navigation = useNavigation();
    const [type, setType] = useState<'IN' | 'OUT'>('IN');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!amount || !category) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            await createTransaction({
                amount: parseFloat(amount),
                type,
                category,
                description,
                date: new Date().toISOString().split('T')[0], // Today's date YYYY-MM-DD
            });
            Alert.alert('Success', 'Transaction added successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {/* Header with Cancel button since it is a modal/standalone */}
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-2xl font-bold text-gray-900">Add Transaction</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text className="text-blue-600 text-lg">Close</Text>
                    </TouchableOpacity>
                </View>

                <View className="flex-row mb-6 bg-gray-100 p-1 rounded-lg">
                    <TouchableOpacity
                        className={`flex-1 py-3 rounded-md items-center ${type === 'IN' ? 'bg-white shadow-sm' : ''}`}
                        onPress={() => setType('IN')}
                    >
                        <Text className={`font-semibold ${type === 'IN' ? 'text-green-600' : 'text-gray-500'}`}>Income</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 py-3 rounded-md items-center ${type === 'OUT' ? 'bg-white shadow-sm' : ''}`}
                        onPress={() => setType('OUT')}
                    >
                        <Text className={`font-semibold ${type === 'OUT' ? 'text-red-600' : 'text-gray-500'}`}>Expense</Text>
                    </TouchableOpacity>
                </View>

                <View className="mb-4">
                    <Text className="text-gray-600 mb-2 font-medium">Amount ($)</Text>
                    <TextInput
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-lg"
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-gray-600 mb-2 font-medium">Category</Text>
                    <TextInput
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-base"
                        placeholder="e.g. Sales, Rent, Groceries"
                        value={category}
                        onChangeText={setCategory}
                    />
                </View>

                <View className="mb-6">
                    <Text className="text-gray-600 mb-2 font-medium">Description (Optional)</Text>
                    <TextInput
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-base min-h-[100px]"
                        placeholder="Add details..."
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <TouchableOpacity
                    className={`w-full py-4 rounded-xl items-center ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text className="text-white font-bold text-lg">{loading ? 'Saving...' : 'Save Transaction'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
