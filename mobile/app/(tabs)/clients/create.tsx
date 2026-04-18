import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { createCustomer, getCustomer, updateCustomer } from '../../../services/api';
import '../../../global.css';

export default function CreateClient() {
    const router = useRouter();
    const { id, mode } = useLocalSearchParams();
    const isEditMode = mode === 'edit';

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        tax_id: ''
    });

    const loadClientData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getCustomer(Number(id));
            setFormData({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                address: data.address || '',
                tax_id: data.tax_id || ''
            });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load client details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (isEditMode && id) {
            loadClientData();
        }
    }, [id, mode, isEditMode, loadClientData]);

    const handleSubmit = async () => {
        if (!formData.name) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        setLoading(true);
        try {
            if (isEditMode && id) {
                await updateCustomer(Number(id), formData);
                Alert.alert('Success', 'Client updated successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                await createCustomer(formData);
                Alert.alert('Success', 'Client created successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 403) {
                Alert.alert('Permission Denied', 'You do not have permission to perform this action.');
            } else {
                Alert.alert('Error', isEditMode ? 'Failed to update client' : 'Failed to create client');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-white p-4">
            <View className="mb-4">
                <Text className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Client' : 'Add New Client'}</Text>
                <Text className="text-gray-500">{isEditMode ? 'Update client information' : 'Fill in the details below'}</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-gray-700 font-medium mb-1">Name</Text>
                    <TextInput
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                        className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                        placeholder="Client or Company Name"
                    />
                </View>

                <View>
                    <Text className="text-gray-700 font-medium mb-1">Email</Text>
                    <TextInput
                        value={formData.email}
                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                        className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                        placeholder="email@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View>
                    <Text className="text-gray-700 font-medium mb-1">Phone</Text>
                    <TextInput
                        value={formData.phone}
                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                        className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                        placeholder="+221 77..."
                        keyboardType="phone-pad"
                    />
                </View>

                <View>
                    <Text className="text-gray-700 font-medium mb-1">Address</Text>
                    <TextInput
                        value={formData.address}
                        onChangeText={(text) => setFormData({ ...formData, address: text })}
                        className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                        placeholder="Address"
                        multiline
                    />
                </View>

                <View>
                    <Text className="text-gray-700 font-medium mb-1">Tax ID / NINEA</Text>
                    <TextInput
                        value={formData.tax_id}
                        onChangeText={(text) => setFormData({ ...formData, tax_id: text })}
                        className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                        placeholder="Tax Identification Number"
                    />
                </View>

                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    className="bg-blue-600 p-4 rounded-xl items-center mt-6"
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">{isEditMode ? 'Update Client' : 'Create Client'}</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.back()}
                    className="p-4 rounded-xl items-center mt-2"
                >
                    <Text className="text-gray-500 font-medium text-lg">Cancel</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
