import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function SignUp() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        company_name: '',
        phone: ''
    });
    const { signUp } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSignUp = async () => {
        const { email, password, first_name, last_name, company_name } = formData;
        if (!email || !password || !first_name || !last_name || !company_name) {
            Alert.alert('Error', 'Please fill in required fields');
            return;
        }
        setLoading(true);
        try {
            await signUp(formData);
        } catch (e) {
            Alert.alert('Error', 'Registration failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="bg-white p-6">
            <Text className="text-3xl font-bold mb-6 text-blue-600 text-center">Create Account</Text>

            <View className="w-full space-y-3">
                <TextInput
                    className="w-full bg-gray-100 p-4 rounded-lg border border-gray-200 mb-3"
                    placeholder="Company Name"
                    value={formData.company_name}
                    onChangeText={(t) => handleChange('company_name', t)}
                />

                <View className="flex-row justify-between mb-3">
                    <TextInput
                        className="w-[48%] bg-gray-100 p-4 rounded-lg border border-gray-200"
                        placeholder="First Name"
                        value={formData.first_name}
                        onChangeText={(t) => handleChange('first_name', t)}
                    />
                    <TextInput
                        className="w-[48%] bg-gray-100 p-4 rounded-lg border border-gray-200"
                        placeholder="Last Name"
                        value={formData.last_name}
                        onChangeText={(t) => handleChange('last_name', t)}
                    />
                </View>

                <TextInput
                    className="w-full bg-gray-100 p-4 rounded-lg border border-gray-200 mb-3"
                    placeholder="Email Address"
                    value={formData.email}
                    onChangeText={(t) => handleChange('email', t)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <TextInput
                    className="w-full bg-gray-100 p-4 rounded-lg border border-gray-200 mb-3"
                    placeholder="Phone Number (Optional)"
                    value={formData.phone}
                    onChangeText={(t) => handleChange('phone', t)}
                    keyboardType="phone-pad"
                />

                <TextInput
                    className="w-full bg-gray-100 p-4 rounded-lg border border-gray-200 mb-6"
                    placeholder="Password"
                    value={formData.password}
                    onChangeText={(t) => handleChange('password', t)}
                    secureTextEntry
                />

                <TouchableOpacity
                    className="w-full bg-blue-600 p-4 rounded-lg items-center"
                    onPress={handleSignUp}
                    disabled={loading}
                >
                    <Text className="text-white font-semibold text-lg">
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View className="mt-6 flex-row justify-center">
                <Text className="text-gray-600">Already have an account? </Text>
                <Link href="/auth/sign-in" asChild>
                    <TouchableOpacity>
                        <Text className="text-blue-600 font-semibold">Sign In</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </ScrollView>
    );
}
