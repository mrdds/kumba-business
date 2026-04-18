import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile, updateUserProfile } from '../../services/api';

export default function EditProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        job_title: '',
        email: '' // Read only usually
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const data = await getUserProfile();
            setFormData({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                job_title: data.job_title || data.role || '',
                email: data.email || ''
            });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.first_name || !formData.last_name) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        setSaving(true);
        try {
            await updateUserProfile({
                first_name: formData.first_name,
                last_name: formData.last_name,
                job_title: formData.job_title
            });
            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <View className="flex-1 justify-center items-center bg-gray-50"><ActivityIndicator size="large" color="#2563EB" /></View>;
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 py-4 flex-row items-center gap-3 bg-white border-b border-gray-100">
                    <TouchableOpacity onPress={() => router.back()} className="bg-gray-100 p-2 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900">Edit Profile</Text>
                </View>

                <ScrollView className="p-6">
                    <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">

                        <View className="mb-4">
                            <Text className="text-gray-500 text-xs font-bold uppercase mb-1">First Name</Text>
                            <TextInput
                                className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-900"
                                value={formData.first_name}
                                onChangeText={(text) => setFormData({ ...formData, first_name: text })}
                                placeholder="Enter first name"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Last Name</Text>
                            <TextInput
                                className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-900"
                                value={formData.last_name}
                                onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                                placeholder="Enter last name"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Job Title</Text>
                            <TextInput
                                className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-900"
                                value={formData.job_title}
                                onChangeText={(text) => setFormData({ ...formData, job_title: text })}
                                placeholder="e.g. Manager"
                            />
                        </View>

                        <View className="mb-2 opacity-50">
                            <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Email</Text>
                            <TextInput
                                className="bg-gray-100 p-3 rounded-lg border border-gray-200 text-gray-500"
                                value={formData.email}
                                editable={false}
                            />
                            <Text className="text-xs text-gray-400 mt-1">Email cannot be changed directly.</Text>
                        </View>

                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        className={`bg-blue-600 p-4 rounded-xl items-center shadow-lg shadow-blue-600/30 ${saving ? 'opacity-70' : ''}`}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
