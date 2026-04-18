import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { getQuotes } from '../../services/api'; // Ensure this is exported now
import { Ionicons } from '@expo/vector-icons';
import '../../global.css'; // Relpath fixed

export default function QuoteList() {
    const router = useRouter();
    const [quotes, setQuotes] = useState<any[]>([]);
    const [filteredQuotes, setFilteredQuotes] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const fetchQuotes = async () => {
        try {
            const data = await getQuotes();
            setQuotes(data);
            setFilteredQuotes(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearch = (text: string) => {
        setSearch(text);
        if (text) {
            const filtered = quotes.filter(q =>
                q.client_name.toLowerCase().includes(text.toLowerCase()) ||
                q.id.toString().includes(text)
            );
            setFilteredQuotes(filtered);
        } else {
            setFilteredQuotes(quotes);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchQuotes();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchQuotes();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return 'bg-green-100 text-green-700 border-green-200';
            case 'SENT': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'EXPIRED': return 'bg-red-100 text-red-700 border-red-200';
            case 'CONVERTED': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => router.push({ pathname: '/quotes/[id]', params: { id: item.id } })}
            // Actually, let's assume we created a new top level route or nested it. 
            // Let's create `mobile/app/quotes` instead of nesting in invoices.
            // Adjust onPress to: '/quotes/[id]'
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
                    <Text className="text-gray-500 text-xs ml-1.5">Valid until: {item.valid_until}</Text>
                </View>
                <Text className="font-bold text-gray-900 text-xl">${item.total_amount?.toFixed(2) || '0.00'}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header - We can reuse the header style */}
            <View className="bg-white px-4 pt-12 pb-4 shadow-sm z-10 rounded-b-3xl">
                <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-900 flex-1">Quotes</Text>
                </View>
                <View className="flex-row items-center bg-gray-100 rounded-xl px-4 h-12">
                    <Ionicons name="search-outline" size={18} color="#94A3B8" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-gray-900"
                        placeholder="Search quotes..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={handleSearch}
                    />
                </View>
            </View>

            <FlatList
                data={filteredQuotes}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 110 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View className="items-center justify-center mt-20 px-10">
                        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                            <Ionicons name="document-text-outline" size={32} color="#CBD5E1" />
                        </View>
                        <Text className="text-gray-900 font-bold text-lg">No quotes yet</Text>
                    </View>
                }
            />

            <TouchableOpacity
                onPress={() => router.push('/quotes/create')}
                className="absolute bottom-10 right-6 bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-blue-600/30"
            >
                <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
        </View>
    );
}
