import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { approveRequest, rejectRequest } from '../../services/api'; // Ensure these are imported
import { ArrowLeft, Check, X } from 'lucide-react-native';

export default function ApprovalDetailScreen() {
    const { id, data } = useLocalSearchParams();
    const router = useRouter();
    const [comments, setComments] = useState('');
    const [processing, setProcessing] = useState(false);

    const item = data ? JSON.parse(data as string) : null;

    if (!item) {
        return <View className="flex-1 justify-center items-center"><Text>Error: No data</Text></View>;
    }

    const handleAction = async (action: 'approve' | 'reject') => {
        setProcessing(true);
        try {
            if (action === 'approve') {
                await approveRequest(Number(id), comments);
                Alert.alert("Success", "Request Approved");
            } else {
                await rejectRequest(Number(id), comments);
                Alert.alert("Success", "Request Rejected");
            }
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", `Failed to ${action}`);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="p-4 bg-white border-b border-gray-200 flex-row items-center pt-12">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ArrowLeft color="#000" size={24} />
                </TouchableOpacity>
                <Text className="text-xl font-bold">Review Request</Text>
            </View>

            <ScrollView className="flex-1 p-4">
                <View className="bg-gray-50 p-4 rounded-xl mb-6">
                    <View className="flex-row justify-between mb-2">
                        <Text className="font-bold text-gray-500 uppercase tracking-widest">{item.content_type}</Text>
                        <Text className="text-gray-500">{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                    <Text className="text-3xl font-bold mb-2 text-gray-900">{item.summary}</Text>
                    <Text className="text-gray-600 text-lg mb-4">Requester: {item.requester_name}</Text>

                    <View className="h-[1px] bg-gray-200 my-2" />

                    <Text className="text-gray-800 leading-6 mt-2">
                        {/* Details would go here. For now, we rely on summary or fetch specific details */}
                        Details associated with this request (ID: {item.object_id}).
                    </Text>
                </View>

                <Text className="font-bold text-gray-700 mb-2 ml-1">Comments (Optional)</Text>
                <TextInput
                    className="bg-gray-100 p-4 rounded-xl min-h-[100px] text-base mb-6"
                    placeholder="Add a note..."
                    textAlignVertical="top"
                    multiline
                    value={comments}
                    onChangeText={setComments}
                />
            </ScrollView>

            <View className="p-4 border-t border-gray-100 flex-row space-x-4 pb-10">
                <TouchableOpacity
                    className={`flex-1 flex-row items-center justify-center bg-red-100 py-4 rounded-xl ${processing ? 'opacity-50' : ''}`}
                    onPress={() => handleAction('reject')}
                    disabled={processing}
                >
                    <X color="#DC2626" size={20} className="mr-2" />
                    <Text className="text-red-700 font-bold text-lg">Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`flex-1 flex-row items-center justify-center bg-green-600 py-4 rounded-xl ${processing ? 'opacity-50' : ''}`}
                    onPress={() => handleAction('approve')}
                    disabled={processing}
                >
                    {processing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Check color="white" size={20} className="mr-2" />
                            <Text className="text-white font-bold text-lg">Approve</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
