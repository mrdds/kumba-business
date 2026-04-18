import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getInvoice } from '../../../services/api';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateInvoiceHTML } from '../../../utils/htmlGenerator';

export default function InvoiceDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    useEffect(() => {
        if (id) fetchInvoice(Number(id));
    }, [id]);

    const fetchInvoice = async (invoiceId: number) => {
        try {
            const data = await getInvoice(invoiceId);
            setInvoice(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch invoice details');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!invoice) return;
        setGeneratingPdf(true);
        try {
            const html = generateInvoiceHTML(invoice);
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to generate PDF');
        } finally {
            setGeneratingPdf(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#2563EB" />
            </SafeAreaView>
        );
    }

    if (!invoice) return null;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <FontAwesome name="arrow-left" size={20} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl font-bold flex-1">Invoice #{invoice.id}</Text>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Status Card */}
                <View className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-gray-500">Status</Text>
                        <View className={`px-2 py-1 rounded ${invoice.status === 'PAID' ? 'bg-green-100' : 'bg-blue-100'}`}>
                            <Text className={`text-xs font-bold ${invoice.status === 'PAID' ? 'text-green-700' : 'text-blue-700'}`}>
                                {invoice.status}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-gray-500">Total Amount</Text>
                        <Text className="text-2xl font-bold text-gray-900">${invoice.total_amount.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Client Info */}
                <View className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100">
                    <Text className="font-bold text-gray-900 mb-2">Client Details</Text>
                    <Text className="text-lg">{invoice.client_name}</Text>
                    {invoice.client_email && <Text className="text-gray-500">{invoice.client_email}</Text>}
                </View>

                {/* Dates */}
                <View className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100 flex-row justify-between">
                    <View>
                        <Text className="text-gray-500 text-xs uppercase mb-1">Date</Text>
                        <Text className="font-medium">{invoice.date}</Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-gray-500 text-xs uppercase mb-1">Due Date</Text>
                        <Text className="font-medium">{invoice.due_date}</Text>
                    </View>
                </View>

                {/* Items */}
                <View className="bg-white p-4 rounded-xl shadow-sm mb-20 border border-gray-100">
                    <Text className="font-bold text-gray-900 mb-3">Items</Text>
                    {invoice.items.map((item: any, index: number) => (
                        <View key={index} className="flex-row justify-between py-2 border-b border-gray-50 last:border-0">
                            <View className="flex-1 mr-4">
                                <Text className="font-medium text-gray-900">{item.description}</Text>
                                <Text className="text-gray-500 text-xs">{item.quantity} x ${item.unit_price}</Text>
                            </View>
                            <Text className="font-bold text-gray-900">${item.amount}</Text>
                        </View>
                    ))}
                    <View className="mt-4 pt-4 border-t border-gray-100 flex-row justify-between items-center">
                        <Text className="font-bold text-gray-900">Total</Text>
                        <Text className="font-bold text-xl text-blue-600">${invoice.total_amount.toFixed(2)}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Footer Actions */}
            <View className="p-4 bg-white border-t border-gray-200 gap-3">
                <TouchableOpacity
                    onPress={handleDownloadPDF}
                    disabled={generatingPdf}
                    className="bg-gray-900 py-3 rounded-xl flex-row justify-center items-center"
                >
                    {generatingPdf ? (
                        <ActivityIndicator size="small" color="white" className="mr-2" />
                    ) : (
                        <FontAwesome name="download" size={16} color="white" className="mr-2" />
                    )}
                    <Text className="text-white font-bold text-base">
                        {generatingPdf ? 'Generating PDF...' : 'Download PDF'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                        const message = `Hello ${invoice.client_name},\n\nHere is your invoice #${invoice.id} for $${invoice.total_amount.toFixed(2)}. Due date: ${invoice.due_date}.\n\nThank you!`;
                        const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
                        // Simple open, in real app check canOpenURL
                        import('react-native').then(({ Linking }) => Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open WhatsApp')));
                    }}
                    className="bg-green-500 py-3 rounded-xl flex-row justify-center items-center"
                >
                    <FontAwesome name="whatsapp" size={18} color="white" className="mr-2" />
                    <Text className="text-white font-bold text-base">Share via WhatsApp</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
