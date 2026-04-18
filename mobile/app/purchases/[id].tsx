import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { getPurchaseOrder } from '../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PurchaseOrderDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [po, setPo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadPO(Number(id));
        }
    }, [id]);

    const loadPO = async (poId: number) => {
        try {
            const data = await getPurchaseOrder(poId);
            setPo(data);
        } catch (error) {
            console.error('Failed to load PO details', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!po) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <Text className="text-gray-500">Order not found</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4">
                    <Text className="text-blue-600 font-bold">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-6 py-4 flex-row items-center gap-3 bg-white border-b border-gray-100">
                    <TouchableOpacity onPress={() => router.back()} className="bg-gray-100 p-2 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-xl font-bold text-gray-900">PO #{po.id}</Text>
                        <Text className="text-xs text-gray-500">{new Date(po.date).toLocaleDateString()}</Text>
                    </View>
                    <View className="flex-1 items-end">
                        <View className={`px-3 py-1.5 rounded-full ${po.status === 'APPROVED' ? 'bg-green-100' :
                            po.status === 'PENDING' ? 'bg-yellow-100' :
                                po.status === 'REJECTED' ? 'bg-red-100' : 'bg-gray-100'
                            }`}>
                            <Text className={`text-xs font-bold ${po.status === 'APPROVED' ? 'text-green-800' :
                                po.status === 'PENDING' ? 'text-yellow-800' :
                                    po.status === 'REJECTED' ? 'text-red-800' : 'text-gray-800'
                                }`}>
                                {po.status}
                            </Text>
                        </View>
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ padding: 20 }}>

                    {/* Summary Card */}
                    <View className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
                        <View className="flex-row justify-between mb-4 pb-4 border-b border-gray-50">
                            <View>
                                <Text className="text-gray-500 text-xs uppercase font-bold mb-1">Vendor</Text>
                                <Text className="text-gray-900 font-semibold">{po.vendor_name || 'Unknown'}</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-gray-500 text-xs uppercase font-bold mb-1">Total Amount</Text>
                                <Text className="text-2xl font-bold text-indigo-600">${Number(po.total_amount || 0).toFixed(2)}</Text>
                            </View>
                        </View>
                        <View>
                            <Text className="text-gray-500 text-xs uppercase font-bold mb-1">Project</Text>
                            <Text className="text-gray-900">{po.project_name || 'N/A'}</Text>
                        </View>
                        {po.notes ? (
                            <View className="mt-4 pt-4 border-t border-gray-50">
                                <Text className="text-gray-500 text-xs uppercase font-bold mb-1">Notes</Text>
                                <Text className="text-gray-700 text-sm leading-relaxed">{po.notes}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Items List */}
                    <Text className="text-lg font-bold text-gray-900 mb-3 px-1">Items</Text>
                    <View className="space-y-3 pb-10 ">
                        {po.items?.map((item: any, index: number) => (
                            <View key={item.id || index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex-row justify-between items-center mb-4">
                                <View className="flex-1 pr-4">
                                    <Text className="font-semibold text-gray-900 mb-1">{item.description}</Text>
                                    <Text className="text-xs text-gray-500">
                                        Qty: {item.quantity} x ${Number(item.unit_price).toFixed(2)}
                                    </Text>
                                </View>
                                <Text className="font-bold text-gray-900">
                                    ${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                                </Text>
                            </View>
                        ))}
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
