import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getTransactions } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../global.css';

export default function TransactionsScreen() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTransactions = async () => {
        try {
            const data = await getTransactions();
            setTransactions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchTransactions();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, []);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-white p-4 rounded-2xl shadow-sm mb-3 border border-gray-100 mx-4 flex-row items-center">
            <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${item.type === 'IN' ? 'bg-green-100' : 'bg-red-100'}`}>
                <Ionicons
                    name={item.type === 'IN' ? 'arrow-down' : 'arrow-up'}
                    size={24}
                    color={item.type === 'IN' ? '#16A34A' : '#DC2626'}
                />
            </View>
            <View className="flex-1">
                <Text className="font-bold text-gray-900 text-base">{item.description || item.category}</Text>
                <Text className="text-gray-400 text-sm">{item.date} • {item.category}</Text>
            </View>
            <Text className={`font-bold text-lg ${item.type === 'IN' ? 'text-green-600' : 'text-gray-900'}`}>
                {item.type === 'IN' ? '+' : '-'}${item.amount.toFixed(2)}
            </Text>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView edges={['top']} className="bg-white z-10 shadow-sm rounded-b-3xl">
                <View className="px-4 pb-4 pt-2 flex-row justify-between items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-900 flex-1">Transactions</Text>
                    {/* Add Filter button later */}
                </View>
            </SafeAreaView>

            <FlatList
                data={transactions}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View className="items-center justify-center mt-20 px-10">
                        <Text className="text-gray-500">No transactions found.</Text>
                    </View>
                }
            />
        </View>
    );
}
