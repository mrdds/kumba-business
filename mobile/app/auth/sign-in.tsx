import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signIn } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            await signIn(email, password);
        } catch (e) {
            Alert.alert('Error', 'Invalid credentials');
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
                        <View className="items-center mb-8">
                            <View className="bg-blue-50 p-4 rounded-full mb-4">
                                <FontAwesome name="cube" size={32} color="#2563EB" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900">Welcome Back</Text>
                            <Text className="text-gray-500 text-center mt-2">Sign in to manage your business</Text>
                        </View>

                        <View className="space-y-5">
                            <View className='mb-3'>
                                <Text className="text-gray-700 font-medium mb-1.5 ml-1">Email</Text>
                                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 h-14">
                                    <FontAwesome name="envelope" size={18} color="#94A3B8" />
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

                            <View>
                                <Text className="text-gray-700 font-medium mb-1.5 ml-1">Password</Text>
                                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 h-14">
                                    <FontAwesome name="lock" size={20} color="#94A3B8" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 text-base"
                                        placeholder="••••••••"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>
                                <TouchableOpacity onPress={() => router.push('/auth/forgot-password')} className="self-end mt-2">
                                    <Text className="text-blue-600 font-medium text-sm">Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                className="w-full bg-blue-600 py-4 rounded-xl items-center shadow-lg shadow-blue-500/30 mt-4"
                                onPress={handleSignIn}
                                disabled={loading}
                            >
                                <Text className="text-white font-bold text-lg">
                                    {loading ? 'Please wait...' : 'Sign In'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="mt-8 flex-row justify-center">
                            <Text className="text-gray-500">Don&apos;t have an account? </Text>
                            <Link href="/auth/sign-up" asChild>
                                <TouchableOpacity>
                                    <Text className="text-blue-600 font-bold">Sign Up</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

// Helper to avoid SafeAreaView import error if not defined
function SafeAreaView({ children, className }: { children: React.ReactNode, className?: string }) {
    const { SafeAreaView: RS } = require('react-native-safe-area-context');
    return <RS className={className}>{children}</RS>;
}
