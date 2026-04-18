import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeList() {
    const router = useRouter();
    const { hasPermission } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/auth/employees');
            setEmployees(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => router.push(`/employees/${item.id}` as any)}
            className="bg-white p-4 rounded-2xl mb-3 flex-row items-center border border-gray-100 shadow-sm mx-4"
        >
            <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mr-4">
                <Text className="text-blue-600 font-bold text-lg">{item.first_name[0]}{item.last_name[0]}</Text>
            </View>
            <View className="flex-1">
                <Text className="font-bold text-gray-900 text-lg">{item.first_name} {item.last_name}</Text>
                <Text className="text-gray-500 text-xs">{item.email}</Text>
                <Text className="text-blue-600 text-xs font-bold mt-1 bg-blue-50 self-start px-2 py-0.5 rounded-lg">{item.role}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="bg-white shadow-sm z-10">
                <View className="flex-row items-center px-4 py-3">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 bg-gray-50 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900">Team Members</Text>
                </View>
            </SafeAreaView>

            <FlatList
                data={employees}
                renderItem={renderItem}
                keyExtractor={(item: any) => item.id.toString()}
                contentContainerStyle={{ paddingTop: 16 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchEmployees} />}
                ListEmptyComponent={
                    <View className="items-center justify-center mt-20">
                        <Text className="text-gray-400">No employees found.</Text>
                    </View>
                }
            />

            {hasPermission('employee_create') && (
                <TouchableOpacity
                    onPress={() => router.push('/employees/create')}
                    className="absolute bottom-10 right-6 bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-blue-600/30"
                >
                    <Ionicons name="add" size={28} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );
}
