import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { getCustomers } from '../../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../../global.css';

export default function ClientList() {
    const router = useRouter();
    const [clients, setClients] = useState<any[]>([]);
    const [filteredClients, setFilteredClients] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const fetchClients = async () => {
        try {
            const data = await getCustomers();
            setClients(data);
            setFilteredClients(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearch = (text: string) => {
        setSearch(text);
        if (text) {
            const filtered = clients.filter(client =>
                client.name.toLowerCase().includes(text.toLowerCase()) ||
                client.email?.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredClients(filtered);
        } else {
            setFilteredClients(clients);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchClients();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchClients();
    }, []);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => router.push(`/clients/${item.id}`)}
            className="bg-white p-4 mb-3 rounded-2xl flex-row items-center border border-gray-100 shadow-sm mx-4"
        >
            <View className="h-12 w-12 bg-blue-50 rounded-full items-center justify-center mr-4 border border-blue-100">
                <Text className="text-blue-600 font-bold text-lg">{item.name[0]?.toUpperCase()}</Text>
            </View>
            <View className="flex-1">
                <Text className="font-bold text-gray-900 text-lg">{item.name}</Text>
                <View className="flex-row items-center mt-1 gap-3">
                    {item.email && (
                        <View className="flex-row items-center">
                            <Ionicons name="mail-outline" size={12} color="#94A3B8" />
                            <Text className="text-gray-500 text-xs ml-1.5">{item.email}</Text>
                        </View>
                    )}
                    {item.phone && (
                        <View className="flex-row items-center">
                            <Ionicons name="call-outline" size={12} color="#94A3B8" />
                            <Text className="text-gray-500 text-xs ml-1.5">{item.phone}</Text>
                        </View>
                    )}
                </View>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView edges={['top']} className="bg-white z-10 shadow-sm">
                <View className="px-4 pb-4">
                    <View className="flex-row items-center bg-gray-100 rounded-xl px-4 h-12">
                        <Ionicons name="search-outline" size={18} color="#94A3B8" />
                        <TextInput
                            className="flex-1 ml-3 text-base text-gray-900"
                            placeholder="Search clients..."
                            placeholderTextColor="#94A3B8"
                            value={search}
                            onChangeText={handleSearch}
                        />
                    </View>
                </View>
            </SafeAreaView>

            <FlatList
                data={filteredClients}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 110, marginTop: 26 }}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20 px-10">
                        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                            <Ionicons name="people-outline" size={32} color="#CBD5E1" />
                        </View>
                        <Text className="text-gray-900 font-bold text-lg">No clients found</Text>
                        <Text className="text-gray-500 text-center mt-2">Add your first client to check who owes you or who you serve.</Text>
                    </View>
                }
            />

            <TouchableOpacity
                onPress={() => router.push('/clients/create')}
                className="absolute bottom-24 right-6 bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-blue-600/30"
            >
                <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
        </View>
    );
}
