import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, Switch, Platform } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from 'expo-router'; // Temporarily removed for debugging
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { JOB_TITLES } from '../../constants/JobTitles';


export default function CreateEmployee() {
    const navigation = useNavigation();
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'STANDARD_USER',
        phone: '',
        job_title: '',
        permissions: {} as Record<string, boolean>
    });
    const [loading, setLoading] = useState(false);
    const [showTitlePicker, setShowTitlePicker] = useState(false);
    const [showRolePicker, setShowRolePicker] = useState(false);

    const roles = [
        { label: 'Super Admin', value: 'SUPER_ADMIN', icon: 'shield-checkmark', description: 'Total access to all modules.' },
        { label: 'Admin', value: 'ADMIN', icon: 'build', description: 'Manage users and modules.' },
        { label: 'Manager', value: 'MANAGER', icon: 'briefcase', description: 'Team and department management.' },
        { label: 'Project Manager', value: 'PROJECT_MANAGER', icon: 'construct', description: 'Manage projects, budgets, and POs.' },
        { label: 'Advanced', value: 'ADVANCED_USER', icon: 'star', description: 'Create and modify data.' },
        { label: 'Standard', value: 'STANDARD_USER', icon: 'person', description: 'Basic input and read access.' },
        { label: 'Read Only', value: 'READ_ONLY', icon: 'eye', description: 'View only, no edits.' },
        { label: 'Auditor', value: 'AUDITOR', icon: 'search', description: 'View and export logs.' },
        { label: 'Guest', value: 'GUEST', icon: 'people', description: 'Limited temporary access.' },
    ];

    const permissionCategories = [
        {
            title: 'Finance & Invoicing',
            perms: [
                { key: 'finance_view_dashboard', label: 'View Dashboard' },
                { key: 'invoice_create', label: 'Create Invoices' },
                { key: 'invoice_validate', label: 'Validate Invoices' },
                { key: 'expense_create', label: 'Create Expenses' },
                { key: 'payment_record', label: 'Record Payments' },
            ]
        },
        {
            title: 'HR & Team',
            perms: [
                { key: 'employee_view_list', label: 'View Team' },
                { key: 'leave_request', label: 'Request Leave' },
                { key: 'leave_approve_reject', label: 'Approve Leave' },
                { key: 'attendance_record', label: 'Clock In/Out' },
            ]
        },
        {
            title: 'Projects & Tasks',
            perms: [
                { key: 'project_view', label: 'View Projects' },
                { key: 'project_create', label: 'Create Projects' },
                { key: 'project_edit', label: 'Edit Projects' },
            ]
        },
        {
            title: 'System',
            perms: [
                { key: 'user_view', label: 'View Users' },
                { key: 'settings_access', label: 'Access Settings' },
            ]
        }
    ];

    const togglePermission = (key: string) => {
        setForm(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key]
            }
        }));
    };

    const formatPreviewId = () => {
        const role = form.role.substring(0, 3).toUpperCase();
        let dept = "GEN";
        const title = (form.job_title || "").toUpperCase();

        if (title.includes("IT") || title.includes("DEV") || title.includes("TECH")) dept = "IT";
        else if (title.includes("FINANCE") || title.includes("COMPTA")) dept = "FIN";
        else if (title.includes("HR") || title.includes("RH")) dept = "HR";
        else if (title.includes("SALE") || title.includes("COMMERCIAL")) dept = "SAL";

        return `${role}-${dept}-####`;
    };

    const handleCreate = async () => {
        if (!form.email || !form.first_name || !form.last_name || !form.job_title) {
            Alert.alert('Error', 'Please fill all required fields including Job Title');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/employees', form);
            Alert.alert('Success', 'Employee created successfully');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create employee');
        } finally {
            setLoading(false);
        }
    };

    return (

        <View className="flex-1 bg-gray-50">
            <View className="absolute top-0 left-0 right-0 h-64 bg-blue-600 rounded-b-[40px]" />

            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center px-6 py-4">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 p-2 bg-white/20 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-white/80 text-sm font-medium">Administration</Text>
                        <Text className="text-2xl font-bold text-white">New Team Member</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 px-6 pt-2" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                    {/* Identity Card */}
                    <View className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-6 flex-row items-center">
                            <Ionicons name="person-circle-outline" size={24} color="#2563EB" /> Identity
                        </Text>

                        <View className="flex-row gap-4 mb-4">
                            <View className="flex-1">
                                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">First Name</Text>
                                <TextInput
                                    className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-900 font-medium"
                                    placeholder="John"
                                    value={form.first_name}
                                    onChangeText={t => setForm({ ...form, first_name: t })}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Last Name</Text>
                                <TextInput
                                    className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-900 font-medium"
                                    placeholder="Doe"
                                    value={form.last_name}
                                    onChangeText={t => setForm({ ...form, last_name: t })}
                                />
                            </View>
                        </View>

                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</Text>
                                <TextInput
                                    className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-900 font-medium"
                                    placeholder="john@company.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={form.email}
                                    onChangeText={t => setForm({ ...form, email: t })}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Account ID</Text>
                                <View className="bg-blue-50 p-4 rounded-xl border border-blue-100 justify-center">
                                    <Text className="text-blue-600 font-bold tracking-widest text-center">
                                        {formatPreviewId()}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <Text className="text-xs text-gray-400 mt-4 italic text-center">
                            Password will be auto-generated and sent via email.
                        </Text>
                    </View>

                    {/* Role Selection */}
                    <View className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-6 flex-row items-center">
                            <Ionicons name="briefcase-outline" size={24} color="#2563EB" /> Role & Position
                        </Text>

                        <View className="mb-6">
                            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">System Role</Text>
                            <TouchableOpacity
                                onPress={() => setShowRolePicker(true)}
                                className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex-row justify-between items-center mb-2"
                            >
                                <View className="flex-row items-center gap-3">
                                    <View className="bg-blue-100 p-2 rounded-full">
                                        <Ionicons name={roles.find(r => r.value === form.role)?.icon as any || "person"} size={20} color="#2563EB" />
                                    </View>
                                    <View>
                                        <Text className="font-bold text-gray-900 text-base">
                                            {roles.find(r => r.value === form.role)?.label || "Select Role"}
                                        </Text>
                                        <Text className="text-gray-500 text-xs">
                                            {roles.find(r => r.value === form.role)?.description || "Select a role for this employee"}
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-down" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <View>
                            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Job Title</Text>
                            <TouchableOpacity
                                onPress={() => setShowTitlePicker(true)}
                                className={`bg-gray-50 p-4 rounded-xl border flex-row justify-between items-center ${form.job_title ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100'}`}
                            >
                                <Text className={`font-medium ${form.job_title ? "text-blue-900" : "text-gray-400"}`}>
                                    {form.job_title || "Select Title..."}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color={form.job_title ? "#2563EB" : "#94A3B8"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Permissions Matrix */}
                    <View className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5">
                        <Text className="text-lg font-bold text-gray-900 mb-6 flex-row items-center">
                            <Ionicons name="shield-checkmark-outline" size={24} color="#2563EB" /> Permissions Override
                        </Text>
                        <Text className="text-sm text-gray-500 mb-4">
                            Selected role provides default permissions. Use toggles below to valid overrides.
                        </Text>

                        {permissionCategories.map((category) => (
                            <View key={category.title} className="mb-6">
                                <Text className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 px-2">{category.title}</Text>
                                <View className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                    {category.perms.map((perm, index) => (
                                        <View key={perm.key} className={`flex-row justify-between items-center p-4 bg-white ${index !== category.perms.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                            <Text className={`font-medium ${form.permissions[perm.key] ? 'text-gray-900' : 'text-gray-500'}`}>{perm.label}</Text>
                                            <Switch
                                                value={!!form.permissions[perm.key]}
                                                onValueChange={() => togglePermission(perm.key)}
                                                trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
                                                thumbColor={Platform.OS === 'ios' ? '#fff' : '#f4f3f4'}
                                                ios_backgroundColor="#CBD5E1"
                                            />
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>

                </ScrollView>

                <View className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 blur-md border-t border-gray-100 z-50">
                    <TouchableOpacity
                        onPress={handleCreate}
                        disabled={loading}
                        className="w-full bg-blue-600 py-4 rounded-2xl items-center shadow-xl shadow-blue-600/30"
                    >
                        <Text className="text-white font-bold text-lg">
                            {loading ? 'Creating...' : 'Create Account'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Role Selection Modal */}
                <Modal visible={showRolePicker} animationType="slide" presentationStyle="pageSheet">
                    <View className="flex-1 bg-white">
                        <View className="px-6 py-4 border-b border-gray-100 flex-row justify-between items-center bg-gray-50">
                            <Text className="text-lg font-bold text-gray-900">Select System Role</Text>
                            <TouchableOpacity onPress={() => setShowRolePicker(false)} className="bg-gray-200 p-1 rounded-full">
                                <Ionicons name="close" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="flex-1">
                            {roles.map((role) => (
                                <TouchableOpacity
                                    key={role.value}
                                    onPress={() => {
                                        setForm({ ...form, role: role.value });
                                        setShowRolePicker(false);
                                    }}
                                    className={`px-6 py-4 border-b border-gray-50 flex-row items-center justify-between active:bg-blue-50 ${form.role === role.value ? 'bg-blue-50' : 'bg-white'}`}
                                >
                                    <View className="flex-row items-center gap-3 flex-1">
                                        <View className={`p-2 rounded-full ${form.role === role.value ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                            <Ionicons name={role.icon as any} size={20} color={form.role === role.value ? '#2563EB' : '#64748B'} />
                                        </View>
                                        <View className="flex-1">
                                            <Text className={`text-base font-bold ${form.role === role.value ? 'text-blue-900' : 'text-gray-900'}`}>{role.label}</Text>
                                            <Text className="text-gray-500 text-xs" numberOfLines={1}>{role.description}</Text>
                                        </View>
                                    </View>
                                    {form.role === role.value && <Ionicons name="checkmark" size={20} color="#2563EB" />}
                                </TouchableOpacity>
                            ))}
                            <View className="h-20" />
                        </ScrollView>
                    </View>
                </Modal>

                {/* Job Title Picker Modal */}
                <Modal visible={showTitlePicker} animationType="slide" presentationStyle="pageSheet">
                    <View className="flex-1 bg-white">
                        <View className="px-6 py-4 border-b border-gray-100 flex-row justify-between items-center bg-gray-50">
                            <Text className="text-lg font-bold text-gray-900">Select Job Title</Text>
                            <TouchableOpacity onPress={() => setShowTitlePicker(false)} className="bg-gray-200 p-1 rounded-full">
                                <Ionicons name="close" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="flex-1">
                            {JOB_TITLES.map((category) => (
                                <View key={category.category} className="mb-0">
                                    <View className="bg-gray-100/50 px-6 py-3 border-y border-gray-100">
                                        <Text className="font-bold text-blue-600 uppercase text-xs tracking-wider">{category.category}</Text>
                                    </View>
                                    {category.titles.map((title) => (
                                        <TouchableOpacity
                                            key={title}
                                            onPress={() => {
                                                setForm({ ...form, job_title: title });
                                                setShowTitlePicker(false);
                                            }}
                                            className={`px-6 py-4 border-b border-gray-50 flex-row items-center justify-between active:bg-blue-50 ${form.job_title === title ? 'bg-blue-50' : 'bg-white'}`}
                                        >
                                            <Text className={`text-base ${form.job_title === title ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>
                                                {title}
                                            </Text>
                                            {form.job_title === title && <Ionicons name="checkmark" size={20} color="#2563EB" />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ))}
                            <View className="h-20" />
                        </ScrollView>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}
