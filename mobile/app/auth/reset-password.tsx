import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { confirmPasswordReset } from '../../services/api';

export default function ResetPassword() {
    const router = useRouter();
    const { token } = useLocalSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (!token) {
            Alert.alert('Error', 'Invalid reset token');
            return;
        }

        setLoading(true);
        try {
            await confirmPasswordReset({
                token: token,
                new_password: password
            });

            Alert.alert('Success', 'Password has been reset successfully', [
                { text: 'Login', onPress: () => router.replace('/auth/sign-in') }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <LinearGradient
                colors={['#2563EB', '#4F46E5']}
                className="absolute top-0 left-0 right-0 h-[40%] rounded-b-[40px]"
            />

            <SafeAreaView className="flex-1">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 justify-center px-6"
                >
                    <View className="bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/20">
                        <View className="items-center mb-8 mt-4">
                            <View className="bg-blue-50 p-4 rounded-full mb-4">
                                <Ionicons name="lock-closed-outline" size={32} color="#2563EB" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900">Reset Password</Text>
                            <Text className="text-gray-500 text-center mt-2">
                                Enter your new password below.
                            </Text>
                        </View>

                        <View className="space-y-4">
                            <View className='mb-4'>
                                <Text className="text-gray-700 font-medium mb-1.5 ml-1">New Password</Text>
                                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 h-14">
                                    <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 text-base"
                                        placeholder="••••••••"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-gray-700 font-medium mb-1.5 ml-1">Confirm Password</Text>
                                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 h-14">
                                    <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 text-base"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                className="w-full bg-blue-600 py-4 rounded-xl items-center shadow-lg shadow-blue-500/30 mt-4"
                                onPress={handleReset}
                                disabled={loading}
                            >
                                <Text className="text-white font-bold text-lg">
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
