import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { getInvoices } from '../../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../../global.css';

export default function InvoiceList() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const fetchInvoices = async () => {
        try {
            const data = await getInvoices();
            setInvoices(data);
            setFilteredInvoices(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearch = (text: string) => {
        setSearch(text);
        if (text) {
            const filtered = invoices.filter(inv =>
                inv.client_name.toLowerCase().includes(text.toLowerCase()) ||
                inv.id.toString().includes(text)
            );
            setFilteredInvoices(filtered);
        } else {
            setFilteredInvoices(invoices);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchInvoices();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-700 border-green-200';
            case 'SENT': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => router.push({ pathname: '/(tabs)/invoices/[id]', params: { id: item.id } })}
            className="bg-white p-4 rounded-2xl shadow-sm mb-3 border border-gray-100 mx-4"
        >
            <View className="flex-row justify-between items-start mb-3">
                <View>
                    <Text className="font-bold text-gray-900 text-lg">{item.client_name}</Text>
                    <Text className="text-gray-400 text-sm mt-0.5">#{item.id} • {item.date}</Text>
                </View>
                <View className={`px-2.5 py-1 rounded-lg border ${getStatusColor(item.status).split(' ')[2]} ${getStatusColor(item.status).split(' ')[0]}`}>
                    <Text className={`text-xs font-bold ${getStatusColor(item.status).split(' ')[1]}`}>{item.status}</Text>
                </View>
            </View>

            <View className="h-[1px] bg-gray-50 mb-3" />

            <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                    <Text className="text-gray-500 text-xs ml-1.5">Due: {item.due_date}</Text>
                </View>
                <Text className="font-bold text-gray-900 text-xl">${item.total_amount.toFixed(2)}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView edges={['top']} className="bg-white z-10 shadow-sm rounded-b-3xl">
                <View className="px-4 pb-4">
                    <View className="flex-row justify-between items-center mb-4 pt-2">
                        <Text className="text-2xl font-bold text-gray-900">Invoices</Text>
                        <TouchableOpacity className="bg-gray-100 p-2 rounded-full mr-2" onPress={() => router.push('/quotes')}>
                            <Ionicons name="document-text-outline" size={18} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-gray-100 p-2 rounded-full">
                            <Ionicons name="filter" size={18} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row items-center bg-gray-100 rounded-xl px-4 h-12">
                        <Ionicons name="search-outline" size={18} color="#94A3B8" />
                        <TextInput
                            className="flex-1 ml-3 text-base text-gray-900"
                            placeholder="Search invoices..."
                            placeholderTextColor="#94A3B8"
                            value={search}
                            onChangeText={handleSearch}
                        />
                    </View>
                </View>
            </SafeAreaView>

            <FlatList
                data={filteredInvoices}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 110 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View className="items-center justify-center mt-20 px-10">
                        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                            <Ionicons name="receipt-outline" size={32} color="#CBD5E1" />
                        </View>
                        <Text className="text-gray-900 font-bold text-lg">No invoices yet</Text>
                        <Text className="text-gray-500 text-center mt-2">Create professional invoices and track payments easily.</Text>
                    </View>
                }
            />

            <TouchableOpacity
                onPress={() => router.push('/(tabs)/invoices/create')}
                className="absolute bottom-24 right-6 bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-blue-600/30"
            >
                <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
        </View>
    );
}
