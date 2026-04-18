import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Clock() {
    const [time, setTime] = useState(new Date());
    const [isClockedIn, setIsClockedIn] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <View className="flex-1 bg-gray-50">
            <View className="absolute top-0 left-0 right-0 h-72 bg-blue-600 rounded-b-[40px]" />

            <SafeAreaView className="flex-1">
                <View className="px-6 pt-4 mb-8">
                    <Text className="text-blue-100 text-lg text-center font-medium">Current Time</Text>
                    <Text className="text-white text-5xl font-bold text-center mt-2">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text className="text-blue-200 text-center mt-1 text-lg">
                        {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>
                </View>

                <View className="flex-1 px-6">
                    <View className="bg-white rounded-3xl p-8 shadow-xl shadow-blue-900/10 items-center">
                        <View className={`w-40 h-40 rounded-full items-center justify-center mb-6 border-4 ${isClockedIn ? 'border-red-100 bg-red-50' : 'border-green-100 bg-green-50'}`}>
                            <TouchableOpacity
                                onPress={() => setIsClockedIn(!isClockedIn)}
                                className={`w-32 h-32 rounded-full items-center justify-center shadow-lg ${isClockedIn ? 'bg-red-500' : 'bg-green-500'}`}
                            >
                                <Ionicons name={isClockedIn ? "stop" : "play"} size={48} color="white" className="ml-1" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-2xl font-bold text-gray-900 mb-2">
                            {isClockedIn ? 'Clocked In' : 'Clocked Out'}
                        </Text>
                        <Text className="text-gray-500 text-center mb-8">
                            {isClockedIn ? 'You are currently tracking time.' : 'Ready to start your shift?'}
                        </Text>

                        <View className="w-full flex-row justify-between border-t border-gray-100 pt-6">
                            <View className="items-center flex-1">
                                <Text className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Duration</Text>
                                <Text className="text-gray-900 font-bold text-xl">04:23</Text>
                            </View>
                            <View className="w-[1px] bg-gray-100 h-full mx-4" />
                            <View className="items-center flex-1">
                                <Text className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Earnings</Text>
                                <Text className="text-gray-900 font-bold text-xl">$87.50</Text>
                            </View>
                        </View>
                    </View>

                    <Text className="text-gray-900 font-bold text-lg mt-8 mb-4">Recent Shifts</Text>
                    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                        {[1, 2, 3].map((item) => (
                            <View key={item} className="bg-white p-4 rounded-2xl border border-gray-100 mb-3 flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
                                        <Ionicons name="time-outline" size={20} color="#2563EB" />
                                    </View>
                                    <View>
                                        <Text className="font-bold text-gray-900">Yesterday</Text>
                                        <Text className="text-gray-500 text-xs">9:00 AM - 5:00 PM</Text>
                                    </View>
                                </View>
                                <Text className="font-bold text-gray-900">8h 00m</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </SafeAreaView>
        </View>
    );
}
