import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { getPurchaseOrders } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PurchaseOrdersScreen() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadOrders = async () => {
        try {
            const data = await getPurchaseOrders();
            setOrders(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadOrders();
        }, [])
    );

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            className="bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm"
            onPress={() => router.push(`/purchases/${item.id}`)}
        >
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="font-bold text-gray-900 text-lg">PO #{item.id}</Text>
                    <Text className="text-gray-500 text-xs">{item.vendor?.name || 'Unknown Vendor'}</Text>
                </View>
                <View className={`px-2 py-1 rounded-full ${item.status === 'APPROVED' ? 'bg-green-100' :
                    item.status === 'PENDING' ? 'bg-yellow-100' :
                        item.status === 'REJECTED' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                    <Text className={`text-xs font-bold ${item.status === 'APPROVED' ? 'text-green-800' :
                        item.status === 'PENDING' ? 'text-yellow-800' :
                            item.status === 'REJECTED' ? 'text-red-800' : 'text-gray-800'
                        }`}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View className="flex-row justify-between items-end mt-2">
                <View>
                    <Text className="text-gray-500 text-xs">Date</Text>
                    <Text className="text-gray-900 font-medium">{item.date}</Text>
                </View>
                <View>
                    <Text className="text-gray-500 text-xs text-right">Total</Text>
                    <Text className="text-gray-900 font-bold text-lg">${Number(item.total_amount || 0).toFixed(2)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 py-4 flex-row justify-between items-center bg-white border-b border-gray-100">
                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity onPress={() => router.back()} className="bg-gray-100 p-2 rounded-full">
                            <Ionicons name="arrow-back" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-gray-900">Purchase Orders</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/purchases/create-po')}
                        className="bg-blue-50 p-2 rounded-full"
                    >
                        <Ionicons name="add" size={24} color="#2563EB" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#2563EB" />
                    </View>
                ) : (
                    <FlatList
                        data={orders}
                        renderItem={renderItem}
                        keyExtractor={(item: any) => item.id.toString()}
                        contentContainerStyle={{ padding: 16 }}
                        ListEmptyComponent={
                            <View className="items-center mt-12">
                                <View className="bg-indigo-50 p-4 rounded-full mb-4">
                                    <Ionicons name="cart-outline" size={32} color="#4F46E5" />
                                </View>
                                <Text className="text-gray-500 mt-2">No purchase orders found.</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
