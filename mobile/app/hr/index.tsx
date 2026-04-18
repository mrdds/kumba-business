import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { checkIn, checkOut, requestAdvance } from '../../services/api';

export default function HRScreen() {
    const [loading, setLoading] = useState(false);
    const [advanceAmount, setAdvanceAmount] = useState('');
    const [advanceReason, setAdvanceReason] = useState('');

    const handleCheckIn = async () => {
        setLoading(true);
        try {
            // For now, location is optional/null
            await checkIn();
            Alert.alert('Success', 'Checked In successfully!');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to check in');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setLoading(true);
        try {
            await checkOut();
            Alert.alert('Success', 'Checked Out successfully!');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to check out');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestAdvance = async () => {
        if (!advanceAmount) return Alert.alert('Error', 'Please enter amount');
        setLoading(true);
        try {
            await requestAdvance(parseFloat(advanceAmount), advanceReason);
            Alert.alert('Success', 'Advance requested successfully!');
            setAdvanceAmount('');
            setAdvanceReason('');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to request advance');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ title: 'Employee Portal' }} />

            <ScrollView className="p-4">
                {/* Attendance Section */}
                <View className="bg-white rounded-xl p-6 shadow-sm mb-6 items-center">
                    <Text className="text-xl font-bold text-gray-900 mb-6">Attendance</Text>

                    <View className="flex-row gap-4 w-full justify-center">
                        <TouchableOpacity
                            onPress={handleCheckIn}
                            disabled={loading}
                            className="bg-green-600 px-8 py-6 rounded-2xl items-center shadow-md active:bg-green-700"
                        >
                            <FontAwesome name="sign-in" size={32} color="white" />
                            <Text className="text-white font-bold mt-2 text-lg">Check In</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleCheckOut}
                            disabled={loading}
                            className="bg-red-500 px-8 py-6 rounded-2xl items-center shadow-md active:bg-red-600"
                        >
                            <FontAwesome name="sign-out" size={32} color="white" />
                            <Text className="text-white font-bold mt-2 text-lg">Check Out</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Salary Advance Section */}
                <View className="bg-white rounded-xl p-6 shadow-sm">
                    <Text className="text-xl font-bold text-gray-900 mb-4">Request Salary Advance</Text>

                    <TextInput
                        className="bg-gray-100 p-4 rounded-xl mb-3 text-lg"
                        placeholder="Amount"
                        keyboardType="numeric"
                        value={advanceAmount}
                        onChangeText={setAdvanceAmount}
                    />
                    <TextInput
                        className="bg-gray-100 p-4 rounded-xl mb-4 text-base"
                        placeholder="Reason (Optional)"
                        value={advanceReason}
                        onChangeText={setAdvanceReason}
                        multiline
                    />

                    <TouchableOpacity
                        onPress={handleRequestAdvance}
                        disabled={loading}
                        className="bg-blue-600 py-4 rounded-xl items-center shadow-md active:bg-blue-700"
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Submit Request</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
