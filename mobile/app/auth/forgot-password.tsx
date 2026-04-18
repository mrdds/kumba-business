import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { requestPasswordReset } from '../../services/api';

export default function ForgotPassword() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }
        setLoading(true);
        try {
            await requestPasswordReset(email, 'mobile');
            Alert.alert('Success', 'If an account exists, a reset link has been sent.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error);
            // Check for specific error message or default to generic
            Alert.alert('Error', 'Failed to request password reset. Please try again.');
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
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="absolute top-4 left-4 p-2 bg-gray-50 rounded-full"
                        >
                            <Ionicons name="arrow-back" size={24} color="#64748B" />
                        </TouchableOpacity>

                        <View className="items-center mb-8 mt-4">
                            <View className="bg-blue-50 p-4 rounded-full mb-4">
                                <Ionicons name="key-outline" size={32} color="#2563EB" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900">Forgot Password?</Text>
                            <Text className="text-gray-500 text-center mt-2 px-4">
                                Enter your email and we&apos;ll send you instructions to reset your password.
                            </Text>
                        </View>

                        <View className="space-y-5">
                            <View>
                                <Text className="text-gray-700 font-medium mb-1.5 ml-1">Email Address</Text>
                                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 h-14">
                                    <Ionicons name="mail-outline" size={20} color="#94A3B8" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 text-base"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
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
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => router.back()} className="mt-6 items-center">
                            <Text className="text-gray-500 font-medium">Back to Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
