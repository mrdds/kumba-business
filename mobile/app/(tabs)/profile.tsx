import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';


export default function Profile() {
    const { signOut } = useAuth();
    const router = useRouter(); // Added router via tool
    const [profile, setProfile] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProfile = async () => {
        try {
            console.log("Fetching profile...");
            const data = await getUserProfile();
            console.log("Profile data received:", data);
            setProfile(data);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchProfile();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchProfile();
    }, []);

    const MenuItem = ({ icon, label, onPress, color = "#1E293B", danger = false }: any) => (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-row items-center p-4 mb-3 rounded-2xl border ${danger ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}
        >
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${danger ? 'bg-red-100' : 'bg-gray-50'}`}>
                <Ionicons name={icon} size={20} color={danger ? "#EF4444" : "#64748B"} />
            </View>
            <Text className={`flex-1 font-bold text-lg ${danger ? 'text-red-600' : 'text-gray-900'}`}>{label}</Text>
            <Ionicons name="chevron-forward" size={20} color={danger ? "#FCA5A5" : "#CBD5E1"} />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <View className="absolute top-0 left-0 right-0 h-80 bg-blue-600 rounded-b-[40px]" />

            <SafeAreaView className="flex-1">
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />}
                >
                    {/* Header */}
                    <View className="px-6 pt-4 mb-8 flex-row justify-between items-start">
                        <View>
                            <Text className="text-blue-200 font-medium tracking-wider uppercase text-xs mb-1">My Account</Text>
                            <Text className="text-white text-3xl font-bold">Profile</Text>
                        </View>
                        <TouchableOpacity className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                            <Ionicons name="settings-outline" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {profile && (
                        <View className="px-6">
                            {/* Profile Card */}
                            <View className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/10 mb-6 items-center border border-gray-100/50">
                                <View className="w-24 h-24 bg-blue-50 rounded-full items-center justify-center mb-4 border-4 border-white shadow-sm">
                                    <Text className="text-4xl text-blue-600 font-bold">
                                        {profile.first_name?.[0]}{profile.last_name?.[0]}
                                    </Text>
                                </View>
                                <Text className="text-2xl font-bold text-gray-900 text-center">{profile.first_name} {profile.last_name}</Text>
                                <Text className="text-gray-500 font-medium mb-3">{profile.email}</Text>

                                <View className="flex-row gap-2 flex-wrap justify-center">
                                    <View className="bg-blue-600 px-4 py-1.5 rounded-full shadow-lg shadow-blue-600/30">
                                        <Text className="text-white text-xs font-bold uppercase tracking-wider">{profile.job_title || profile.role}</Text>
                                    </View>
                                    {profile.role !== "OWNER" && (
                                        <View className="bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                                            <Text className="text-gray-600 text-xs font-bold uppercase">{profile.role}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Company Info */}
                            <View className="bg-white p-6 rounded-3xl shadow-sm mb-6 border border-gray-100">
                                <Text className="text-lg font-bold text-gray-900 mb-4 flex-row items-center">
                                    <Ionicons name="business-outline" size={22} color="#2563EB" /> Company
                                </Text>
                                <View className="bg-gray-50 rounded-2xl p-4 flex-row items-center border border-gray-100">
                                    <View className="w-12 h-12 bg-white rounded-xl items-center justify-center border border-gray-100 mr-4 shadow-sm">
                                        <Ionicons name="briefcase" size={24} color="#0F172A" />
                                    </View>
                                    <View>
                                        <Text className="font-bold text-gray-900 text-lg">{profile.company_name}</Text>
                                        <Text className="text-gray-500 text-sm">{profile.company_sector || 'Telecommunications'}</Text>
                                    </View>
                                </View>
                            </View>

                            <View className="flex-row items-center justify-center -mt-4 mb-8">
                                <TouchableOpacity
                                    onPress={() => router.push('/profile/edit')}
                                    className="bg-blue-50 px-5 py-2 rounded-full border border-blue-100 flex-row items-center gap-2"
                                >
                                    <Ionicons name="pencil" size={16} color="#2563EB" />
                                    <Text className="text-blue-600 font-bold">Edit Profile</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Menu */}
                            <Text className="text-lg font-bold text-gray-900 mb-4 ml-2">Preferences</Text>
                            <MenuItem icon="notifications-outline" label="Notifications" onPress={() => { }} />
                            <MenuItem icon="lock-closed-outline" label="Security" onPress={() => router.push('/profile/security')} />
                            <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => { }} />

                            <View className="my-2" />
                            <MenuItem icon="log-out-outline" label="Sign Out" onPress={signOut} danger />

                            <Text className="text-center text-gray-400 text-xs mt-6 mb-8">
                                Version 1.0.0 • OurSpace
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
