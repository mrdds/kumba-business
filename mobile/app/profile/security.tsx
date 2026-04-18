import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { changePassword } from '../../services/api';

export default function SecurityScreen() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const handleSave = async () => {
        if (!formData.current_password || !formData.new_password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (formData.new_password !== formData.confirm_password) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (formData.new_password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters');
            return;
        }

        setSaving(true);
        try {
            await changePassword({
                old_password: formData.current_password,
                new_password: formData.new_password
            });
            Alert.alert('Success', 'Password changed successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.error || 'Failed to change password. check your current password.';
            Alert.alert('Error', msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 py-4 flex-row items-center gap-3 bg-white border-b border-gray-100">
                    <TouchableOpacity onPress={() => router.back()} className="bg-gray-100 p-2 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900">Security</Text>
                </View>

                <ScrollView className="p-6">
                    <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">

                        <View className="mb-4">
                            <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Current Password</Text>
                            <TextInput
                                className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-900"
                                value={formData.current_password}
                                onChangeText={(text) => setFormData({ ...formData, current_password: text })}
                                placeholder="Enter current password"
                                secureTextEntry
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-500 text-xs font-bold uppercase mb-1">New Password</Text>
                            <TextInput
                                className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-900"
                                value={formData.new_password}
                                onChangeText={(text) => setFormData({ ...formData, new_password: text })}
                                placeholder="Enter new password"
                                secureTextEntry
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Confirm New Password</Text>
                            <TextInput
                                className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-900"
                                value={formData.confirm_password}
                                onChangeText={(text) => setFormData({ ...formData, confirm_password: text })}
                                placeholder="Confirm new password"
                                secureTextEntry
                            />
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
                            <Text className="text-white font-bold text-lg">Change Password</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
