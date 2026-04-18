import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, Modal, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

interface Supplier {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_id?: string;
}

export default function CreatePurchaseOrder() {
    const router = useRouter(); // Use useRouter instead of useNavigation
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Vendor Logic
    const [vendors, setVendors] = useState<Supplier[]>([]);
    const [showVendorPicker, setShowVendorPicker] = useState(false);
    const [isAddingVendor, setIsAddingVendor] = useState(false);

    // New Vendor Form State
    const [newVendor, setNewVendor] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        tax_id: '' // NCC
    });

    const [form, setForm] = useState({
        vendor_id: null as number | null,
        vendor_name: '',
        project_name: '',
        expected_date: '',
        items: [{ description: '', quantity: '1', unit_price: '0' }],
        notes: ''
    });

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const response = await api.get('/crm/suppliers');
            setVendors(response.data);
        } catch (error) {
            console.error('Failed to fetch vendors', error);
        } finally {
            setPageLoading(false);
        }
    };

    const handleCreateVendor = async () => {
        if (!newVendor.name) {
            Alert.alert('Error', 'Vendor Name is required');
            return;
        }
        try {
            const response = await api.post('/crm/suppliers', newVendor);
            const created = response.data;
            setVendors([...vendors, created]);
            setForm({ ...form, vendor_id: created.id, vendor_name: created.name });
            setIsAddingVendor(false);
            setNewVendor({ name: '', email: '', phone: '', address: '', tax_id: '' });
            setShowVendorPicker(false);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to create vendor');
        }
    };

    const addItem = () => {
        setForm(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: '1', unit_price: '0' }]
        }));
    };

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...form.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setForm({ ...form, items: newItems });
    };

    const removeItem = (index: number) => {
        if (form.items.length === 1) return;
        const newItems = form.items.filter((_, i) => i !== index);
        setForm({ ...form, items: newItems });
    };

    const calculateTotal = () => {
        return form.items.reduce((acc, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.unit_price) || 0;
            return acc + (qty * price);
        }, 0);
    };

    const handleGoBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/'); // Fallback to home/dashboard if stack is empty
        }
    };

    const handleSubmit = async () => {
        if (!form.vendor_name || !form.project_name) {
            // Web alert needs text or it fails silently?
            if (Platform.OS === 'web') {
                window.alert('Error: Vendor and Project Name are required.');
            } else {
                Alert.alert('Error', 'Vendor and Project Name are required.');
            }
            return;
        }

        setLoading(true);
        // Simulate PO creation linked to vendor
        setTimeout(() => {
            setLoading(false);
            if (Platform.OS === 'web') {
                window.alert(`Purchase Order created for ${form.vendor_name} (ID: ${form.vendor_id})`);
                handleGoBack();
            } else {
                Alert.alert('Success', `Purchase Order created for ${form.vendor_name}`, [
                    { text: 'OK', onPress: handleGoBack }
                ]);
            }
        }, 1500);
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header Background */}
            <View className="absolute top-0 left-0 right-0 h-32 bg-indigo-600 rounded-b-[30px]" />

            <SafeAreaView className="flex-1 max-w-4xl w-full mx-auto">
                {/* Header */}
                <View className="flex-row items-center px-6 py-4 mb-2">
                    <TouchableOpacity onPress={handleGoBack} className="mr-4 p-2 bg-white/20 rounded-full cursor-pointer">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-white">New Purchase Order</Text>
                </View>

                <ScrollView className="flex-1 px-6 pt-2" contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* General Info */}
                    <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
                        <Text className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">Project & Vendor</Text>

                        <View className="mb-4">
                            <Text className="text-gray-500 text-xs font-bold mb-2 uppercase">Vendor / Contractor</Text>
                            <TouchableOpacity
                                onPress={() => setShowVendorPicker(true)}
                                className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex-row justify-between items-center cursor-pointer"
                            >
                                <Text className={`font-medium ${form.vendor_name ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {form.vendor_name || "Select Vendor..."}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <View>
                            <Text className="text-gray-500 text-xs font-bold mb-2 uppercase">Project Name</Text>
                            <TextInput
                                className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-900 font-medium outline-none"
                                placeholder="e.g. HQ Renovation"
                                value={form.project_name}
                                onChangeText={t => setForm({ ...form, project_name: t })}
                                style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}}
                            />
                        </View>
                    </View>

                    {/* Items */}
                    <View className="mb-6">
                        <View className="flex-row justify-between items-center mb-4 px-2">
                            <Text className="text-lg font-bold text-gray-900">Items</Text>
                            <TouchableOpacity onPress={addItem} className="flex-row items-center bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 cursor-pointer">
                                <Ionicons name="add" size={16} color="#4F46E5" />
                                <Text className="text-indigo-600 font-bold ml-1 text-xs">Add Item</Text>
                            </TouchableOpacity>
                        </View>

                        {form.items.map((item, index) => (
                            <View key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3">
                                <View className="flex-row justify-between items-start mb-3">
                                    <Text className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">#{index + 1}</Text>
                                    <TouchableOpacity onPress={() => removeItem(index)} className="cursor-pointer">
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>

                                <TextInput
                                    className="border-b border-gray-100 pb-2 mb-3 text-base font-medium text-gray-900 outline-none"
                                    placeholder="Item Description"
                                    value={item.description}
                                    onChangeText={t => updateItem(index, 'description', t)}
                                    style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}}
                                />

                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <Text className="text-[10px] text-gray-400 uppercase font-bold mb-1">Qty</Text>
                                        <TextInput
                                            className="bg-gray-50 p-2 rounded-lg text-center font-bold outline-none"
                                            keyboardType="numeric"
                                            value={item.quantity}
                                            onChangeText={t => updateItem(index, 'quantity', t)}
                                            style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[10px] text-gray-400 uppercase font-bold mb-1">Price</Text>
                                        <TextInput
                                            className="bg-gray-50 p-2 rounded-lg text-center font-bold outline-none"
                                            keyboardType="numeric"
                                            value={item.unit_price}
                                            onChangeText={t => updateItem(index, 'unit_price', t)}
                                            style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}}
                                        />
                                    </View>
                                    <View className="flex-1 items-end justify-center">
                                        <Text className="text-lg font-bold text-indigo-600">
                                            ${(parseFloat(item.quantity || '0') * parseFloat(item.unit_price || '0')).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Summary */}
                    <View className="bg-gray-900 p-6 rounded-3xl shadow-xl shadow-indigo-500/20 mb-8">
                        <View className="flex-row justify-between items-center mb-4 border-b border-gray-700 pb-4">
                            <Text className="text-gray-400 text-sm">Total Items</Text>
                            <Text className="text-white font-bold">{form.items.length}</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <Text className="text-white text-lg font-bold">Total Amount</Text>
                            <Text className="text-3xl font-bold text-green-400">${calculateTotal().toFixed(2)}</Text>
                        </View>
                    </View>

                </ScrollView>

                <View className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 blur-md border-t border-gray-100 z-50 max-w-4xl mx-auto">
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loading}
                        className="w-full bg-indigo-600 py-4 rounded-2xl items-center shadow-lg shadow-indigo-600/30 cursor-pointer"
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Create Order</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Vendor Picker / Creator Modal */}
                <Modal visible={showVendorPicker} animationType="slide" presentationStyle="pageSheet">
                    <SafeAreaView className="flex-1 bg-white">
                        <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <Text className="text-lg font-bold text-gray-900">
                                {isAddingVendor ? "Add New Vendor" : "Select Vendor"}
                            </Text>
                            <TouchableOpacity onPress={() => setShowVendorPicker(false)} className="bg-gray-200 p-1 rounded-full cursor-pointer">
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {isAddingVendor ? (
                            <ScrollView className="flex-1 p-6">
                                <Text className="text-gray-500 font-bold mb-2">Company Name / Payee *</Text>
                                <TextInput
                                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-lg mb-4 outline-none"
                                    placeholder="e.g. Acme Inc."
                                    value={newVendor.name}
                                    onChangeText={t => setNewVendor({ ...newVendor, name: t })}
                                    autoFocus
                                    style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}}
                                />

                                <Text className="text-gray-500 font-bold mb-2">Email Address</Text>
                                <TextInput
                                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-lg mb-4 outline-none"
                                    placeholder="contact@example.com"
                                    value={newVendor.email}
                                    onChangeText={t => setNewVendor({ ...newVendor, email: t })}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}}
                                />

                                <Text className="text-gray-500 font-bold mb-2">Telephone</Text>
                                <TextInput
                                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-lg mb-4 outline-none"
                                    placeholder="+1 234 567 890"
                                    value={newVendor.phone}
                                    onChangeText={t => setNewVendor({ ...newVendor, phone: t })}
                                    keyboardType="phone-pad"
                                    style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}}
                                />

                                <Text className="text-gray-500 font-bold mb-2">Tax ID / NCC</Text>
                                <TextInput
                                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-lg mb-4 outline-none"
                                    placeholder="Tax Identification Number"
                                    value={newVendor.tax_id}
                                    onChangeText={t => setNewVendor({ ...newVendor, tax_id: t })}
                                    style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}}
                                />

                                <Text className="text-gray-500 font-bold mb-2">Address</Text>
                                <TextInput
                                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-lg mb-6 outline-none h-24"
                                    placeholder="Full street address..."
                                    value={newVendor.address}
                                    onChangeText={t => setNewVendor({ ...newVendor, address: t })}
                                    multiline
                                    style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}}
                                />

                                <TouchableOpacity
                                    onPress={handleCreateVendor}
                                    className="bg-indigo-600 py-4 rounded-xl items-center cursor-pointer mb-2"
                                >
                                    <Text className="text-white font-bold text-lg">Save Vendor</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setIsAddingVendor(false)}
                                    className="py-4 items-center cursor-pointer mb-8"
                                >
                                    <Text className="text-indigo-600 font-medium">Cancel</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        ) : (
                            <View className="flex-1">
                                <TouchableOpacity
                                    onPress={() => setIsAddingVendor(true)}
                                    className="flex-row items-center justify-center p-4 bg-indigo-50 mx-6 mt-4 rounded-xl border-2 border-dashed border-indigo-200 cursor-pointer"
                                >
                                    <Ionicons name="add-circle" size={24} color="#4F46E5" />
                                    <Text className="text-indigo-600 font-bold ml-2">Add New Vendor</Text>
                                </TouchableOpacity>

                                <FlatList
                                    data={vendors}
                                    keyExtractor={(item) => item.id.toString()}
                                    contentContainerStyle={{ padding: 24 }}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setForm({ ...form, vendor_id: item.id, vendor_name: item.name });
                                                setShowVendorPicker(false);
                                            }}
                                            className="p-4 border-b border-gray-50 flex-row items-center justify-between active:bg-gray-50 cursor-pointer"
                                        >
                                            <View>
                                                <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
                                                <Text className="text-gray-500 text-sm">{item.tax_id ? `NCC: ${item.tax_id}` : (item.email || 'No details')}</Text>
                                            </View>
                                            {form.vendor_id === item.id && (
                                                <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        <View className="items-center py-10">
                                            <Text className="text-gray-400">No vendors found.</Text>
                                        </View>
                                    }
                                />
                            </View>
                        )}
                    </SafeAreaView>
                </Modal>

            </SafeAreaView>
        </View>
    );
}
