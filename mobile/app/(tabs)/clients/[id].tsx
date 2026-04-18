import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { getCustomer, deleteCustomer } from '../../../services/api';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import '../../../global.css';

export default function ClientDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchClientDetails = useCallback(async () => {
        try {
            const data = await getCustomer(Number(id));
            setClient(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load client details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchClientDetails();
    }, [fetchClientDetails]);

    const handleDelete = () => {
        Alert.alert(
            'Delete Client',
            'Are you sure you want to delete this client? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCustomer(Number(id));
                            router.back();
                        } catch (error: any) {
                            console.error(error);
                            if (error.response?.status === 403) {
                                Alert.alert('Permission Denied', 'Only Owners can delete clients.');
                            } else {
                                Alert.alert('Error', 'Failed to delete client');
                            }
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!client) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Text className="text-gray-500">Client not found</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-white">
            <Stack.Screen options={{ title: client.name || 'Client Details' }} />

            <View className="p-6 bg-blue-600 pb-16">
                <View className="items-center">
                    <View className="h-24 w-24 bg-white/20 rounded-full items-center justify-center mb-4 backdrop-blur-md">
                        <Text className="text-4xlfont-bold text-white">{client.name ? client.name[0]?.toUpperCase() : '?'}</Text>
                    </View>
                    <Text className="text-2xl font-bold text-white mb-1">{client.name}</Text>
                    <Text className="text-blue-100">{client.email || 'No email'}</Text>
                </View>
            </View>

            <View className="px-4 -mt-10">
                <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                    <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-100">
                        <Text className="font-bold text-gray-900 text-lg">Contact Info</Text>
                        <TouchableOpacity onPress={fetchClientDetails}>
                            <FontAwesome name="refresh" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <InfoRow icon="phone" label="Phone" value={client.phone} />
                    <InfoRow icon="envelope" label="Email" value={client.email} />
                    <InfoRow icon="map-marker" label="Address" value={client.address} />
                    <InfoRow icon="briefcase" label="Tax ID / NINEA" value={client.tax_id} />
                </View>

                <View className="flex-row space-x-4 mb-8">
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/clients/create', params: { id: client.id, mode: 'edit' } })}
                        className="flex-1 bg-blue-50 border border-blue-200 py-4 rounded-xl items-center flex-row justify-center"
                    >
                        <FontAwesome name="edit" size={16} color="#2563EB" className="mr-2" />
                        <Text className="text-blue-600 font-bold ml-2">Edit Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleDelete}
                        className="flex-1 bg-red-50 border ml-4 border-red-200 py-4 rounded-xl items-center flex-row justify-center"
                    >
                        <FontAwesome name="trash" size={16} color="#DC2626" className="mr-2" />
                        <Text className="text-red-600 font-bold ml-2">Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

function InfoRow({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <View className="flex-row items-start mb-4">
            <View className="w-8 items-center pt-1">
                <FontAwesome name={icon} size={16} color="#9CA3AF" />
            </View>
            <View className="flex-1 ml-2">
                <Text className="text-xs text-gray-500 font-medium uppercase">{label}</Text>
                <Text className="text-gray-900 text-base mt-0.5">{value || 'N/A'}</Text>
            </View>
        </View>
    );
}
