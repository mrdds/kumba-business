import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { getPendingApprovals } from '../../services/api';
import { ArrowRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ApprovalsScreen() {
    const router = useRouter();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadApprovals = async () => {
        try {
            const data = await getPendingApprovals();
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApprovals();
    }, []);

    // Quick reject or detail view? Let's use detail view for implementation
    // But for list, maybe quick actions? 
    // Let's rely on navigating to detail for safety.

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            className="bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm mx-4"
            onPress={() => router.push({ pathname: '/approvals/[id]' as any, params: { id: item.id, data: JSON.stringify(item) } })}
        >
            <View className="flex-row justify-between items-center mb-2">
                <View className="bg-blue-50 px-2.5 py-1 rounded-md">
                    <Text className="text-xs font-bold text-blue-700 uppercase">{item.document_type_label || item.content_type_model}</Text>
                </View>
                <Text className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>

            <Text className="text-lg font-bold text-gray-900 mb-1">
                {item.description || `Request #${item.id}`}
            </Text>

            <View className="flex-row items-center mb-3">
                <View className="w-6 h-6 rounded-full bg-gray-200 justify-center items-center mr-2">
                    <Text className="text-xs font-bold text-gray-600">
                        {(item.created_by_name || 'System').charAt(0)}
                    </Text>
                </View>
                <Text className="text-sm text-gray-600">
                    {item.created_by_name || 'System'}
                </Text>
            </View>

            <View className="flex-row justify-end border-t border-gray-50 pt-3">
                <Text className="text-blue-600 font-semibold flex-row items-center">
                    Review Request <ArrowRight size={14} color="#2563EB" />
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#2563EB" /></View>;
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 py-4 flex-row justify-between items-center bg-white border-b border-gray-100">
                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity onPress={() => router.back()} className="bg-gray-100 p-2 rounded-full">
                            <Ionicons name="arrow-back" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-gray-900">Pending Approvals</Text>
                    </View>
                </View>
                <FlatList
                    data={requests}
                    renderItem={renderItem}
                    keyExtractor={(item: any) => item.id.toString()}
                    contentContainerStyle={{ paddingVertical: 16 }}
                    refreshing={loading}
                    onRefresh={loadApprovals}
                    ListEmptyComponent={
                        <View className="p-10 items-center">
                            <View className="bg-green-50 p-4 rounded-full mb-4">
                                <Ionicons name="checkmark-circle-outline" size={40} color="#16A34A" />
                            </View>
                            <Text className="text-gray-900 font-bold text-lg">All Caught Up</Text>
                            <Text className="text-gray-500 text-center mt-1">No pending approvals found.</Text>
                        </View>
                    }
                />
            </SafeAreaView>
        </View>
    );
}
