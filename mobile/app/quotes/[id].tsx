import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getQuote } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../global.css'; // Relpath fixed

export default function QuoteDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadQuote = async () => {
            try {
                const data = await getQuote(Number(id));
                setQuote(data);
            } catch {
                Alert.alert("Error", "Failed to load quote details");
                router.back();
            } finally {
                setLoading(false);
            }
        };
        loadQuote();
    }, [id, router]);

    if (loading) {
        return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#2563EB" /></View>;
    }

    if (!quote) return null;

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView edges={['top']} className="bg-white">
                <View className="px-4 py-3 flex-row justify-between items-center border-b border-gray-100">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="font-bold text-lg text-gray-900">Quote #{quote.id}</Text>
                    <TouchableOpacity className="p-2 -mr-2">
                        <Ionicons name="ellipsis-horizontal" size={24} color="#1E293B" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView className="flex-1 p-4">
                {/* Status Badge */}
                <View className="flex-row justify-center mb-6">
                    <View className="bg-blue-100 px-4 py-1.5 rounded-full border border-blue-200">
                        <Text className="text-blue-700 font-bold text-sm tracking-wide">{quote.status}</Text>
                    </View>
                </View>

                {/* Client Info */}
                <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">Client Information</Text>
                    <Text className="text-xl font-bold text-gray-900 mb-1">{quote.client_name}</Text>
                    {quote.client_email && (
                        <View className="flex-row items-center mt-1">
                            <Ionicons name="mail-outline" size={14} color="#64748B" />
                            <Text className="text-gray-600 ml-2">{quote.client_email}</Text>
                        </View>
                    )}
                </View>

                {/* Dates */}
                <View className="flex-row space-x-4 mb-4">
                    <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Date</Text>
                        <Text className="text-gray-900 font-semibold">{quote.date}</Text>
                    </View>
                    <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Valid Until</Text>
                        <Text className="text-red-500 font-semibold">{quote.valid_until}</Text>
                    </View>
                </View>

                {/* Items */}
                <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-24">
                    <View className="p-4 bg-gray-50 border-b border-gray-100">
                        <Text className="text-gray-900 font-bold">Items</Text>
                    </View>
                    {quote.items.map((item: any, index: number) => (
                        <View key={index} className="p-4 border-b border-gray-50 flex-row justify-between items-center">
                            <View className="flex-1 pr-4">
                                <Text className="font-semibold text-gray-900 mb-1">{item.description}</Text>
                                <Text className="text-gray-500 text-xs">{item.quantity} x ${item.unit_price}</Text>
                            </View>
                            <Text className="font-bold text-gray-900">${(item.quantity * item.unit_price).toFixed(2)}</Text>
                        </View>
                    ))}
                    <View className="p-4 bg-gray-50 flex-row justify-between items-center">
                        <Text className="font-bold text-gray-500">Total</Text>
                        <Text className="font-bold text-2xl text-gray-900">${quote.total_amount?.toFixed(2)}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View className="absolute bottom-0 left-0 right-0 bg-white p-4 pb-8 border-t border-gray-100 flex-row space-x-4">
                <TouchableOpacity className="flex-1 bg-gray-100 py-4 rounded-xl items-center flex-row justify-center">
                    <Ionicons name="share-outline" size={20} color="#374151" className="mr-2" />
                    <Text className="font-bold text-gray-700 ml-2">Share</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-blue-600 py-4 rounded-xl items-center flex-row justify-center">
                    <Ionicons name="checkmark-circle-outline" size={20} color="white" className="mr-2" />
                    <Text className="font-bold text-white ml-2">Convert</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
