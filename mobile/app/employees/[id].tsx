import { View, Text, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api, { getEmployee } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function EmployeeProfile() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    const fetchEmployee = async () => {
        try {
            const data = await getEmployee(id as string);
            setEmployee(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load employee details');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployee();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [id]);

    const handleCall = () => {
        if (employee?.phone) Linking.openURL(`tel:${employee.phone}`);
        else Alert.alert('Error', 'No phone number available');
    };

    const handleEmail = () => {
        if (employee?.email) Linking.openURL(`mailto:${employee.email}`);
        else Alert.alert('Error', 'No email available');
    };

    const handleMeet = () => {
        // In a real app, this would integrate with Google Meet/Zoom or internal video
        Alert.alert('Start Meeting', 'Initiating secure video meeting...');
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <Text className="text-gray-500">Loading Profile...</Text>
            </View>
        );
    }

    if (!employee) return null;

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header Background */}
            <View className="absolute top-0 left-0 right-0 h-96 bg-blue-600 rounded-b-[40px]" />
            {/* Navigation Header */}
            <View className="flex-row items-center mt-10 justify-between px-6 py-4">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-white/20 rounded-full">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={fetchEmployee} className="p-2 bg-white/20 rounded-full">
                    <Ionicons name="refresh" size={24} color="white" />
                </TouchableOpacity>
            </View>
            {/* Profile Header */}
            <View className="items-center -mt-8 mb-0">
                <View className="w-28 h-28 bg-white p-1 rounded-full shadow-2xl shadow-blue-900/40 mb-4">
                    <View className="w-full h-full bg-blue-50 rounded-full items-center justify-center overflow-hidden">
                        <Text className="text-4xl font-bold text-blue-600">
                            {employee.first_name[0]}{employee.last_name[0]}
                        </Text>
                    </View>
                </View>
                <Text className="text-3xl font-bold text-white mb-1">{employee.first_name} {employee.last_name}</Text>
                <View className="bg-white/20 px-4 py-1.5 rounded-full flex-row items-center gap-2">
                    <Ionicons name="briefcase-outline" size={16} color="white" />
                    <Text className="text-white font-medium">{employee.job_title || employee.role}</Text>
                </View>
            </View>
            {/* Quick Actions */}
            <View className="flex-row justify-center gap-6 mt-4 px-6">
                <TouchableOpacity onPress={handleCall} className="items-center">
                    <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center shadow-lg shadow-blue-900/10 mb-2">
                        <Ionicons name="call" size={24} color="#2563EB" />
                    </View>
                    <Text className="text-white/80 text-xs font-bold">Audio Call</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleMeet} className="items-center">
                    <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center shadow-lg shadow-blue-900/10 mb-2">
                        <Ionicons name="videocam" size={24} color="#16A34A" />
                    </View>
                    <Text className="text-white/80 text-xs font-bold">Video Call</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleEmail} className="items-center">
                    <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center shadow-lg shadow-blue-900/10 mb-2">
                        <Ionicons name="mail" size={24} color="#EA580C" />
                    </View>
                    <Text className="text-white/80 text-xs font-bold">Email</Text>
                </TouchableOpacity>
            </View>
            <SafeAreaView className="flex-1">
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>


                    {/* Info Cards */}
                    <View className="px-6 gap-4 -mt-6">

                        {/* Status Card */}
                        <View className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-4">
                                <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center">
                                    <Ionicons name="time" size={20} color="#9333EA" />
                                </View>
                                <View>
                                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">Local Time</Text>
                                    <Text className="text-gray-900 font-bold text-lg">
                                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            </View>
                            <View className="bg-green-100 px-3 py-1 rounded-full">
                                <Text className="text-green-700 text-xs font-bold">On Shift</Text>
                            </View>
                        </View>

                        {/* Identity Card */}
                        <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <Text className="text-gray-900 font-bold text-lg mb-4 flex-row items-center">
                                <Ionicons name="id-card-outline" size={20} color="#2563EB" /> Identity
                            </Text>

                            <View className="flex-row justify-between mb-4 pb-4 border-b border-gray-50">
                                <View>
                                    <Text className="text-gray-400 text-xs mb-1">Account ID</Text>
                                    <Text className="text-gray-900 font-medium">#{employee.id.toString().padStart(6, '0')}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-gray-400 text-xs mb-1">Company Sector</Text>
                                    <Text className="text-gray-900 font-medium">{employee.company_sector || 'N/A'}</Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between">
                                <View>
                                    <Text className="text-gray-400 text-xs mb-1">System Role</Text>
                                    <Text className="text-gray-900 font-medium bg-gray-100 px-2 py-0.5 rounded text-xs">{employee.role}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-gray-400 text-xs mb-1">Joined</Text>
                                    <Text className="text-gray-900 font-medium">Jan 2024</Text>
                                </View>
                            </View>
                        </View>

                        {/* Contact Card */}
                        <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <Text className="text-gray-900 font-bold text-lg mb-4 flex-row items-center">
                                <Ionicons name="call-outline" size={20} color="#2563EB" /> Contact Info
                            </Text>

                            <TouchableOpacity onPress={handleEmail} className="flex-row items-center gap-4 mb-4">
                                <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                                    <Ionicons name="mail-outline" size={20} color="#64748B" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-xs mb-0.5">Email Address</Text>
                                    <Text className="text-gray-900 font-medium">{employee.email}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleCall} className="flex-row items-center gap-4">
                                <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                                    <Ionicons name="call-outline" size={20} color="#64748B" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-xs mb-0.5">Phone Number</Text>
                                    <Text className="text-gray-900 font-medium">{employee.phone || 'N/A'}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                            </TouchableOpacity>
                        </View>

                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
