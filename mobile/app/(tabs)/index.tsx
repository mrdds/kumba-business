import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDashboardSummary } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Dashboard() {
  const { user, signOut, hasPermission } = useAuth();
  const router = useRouter();
  const [data, setData] = useState({ revenue: 0, expenses: 0, balance: 0, recent_transactions: [] });
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const result = await getDashboardSummary();
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header Background */}
      <View className="absolute top-0 left-0 right-0 h-48 bg-blue-600 rounded-b-[30px]" />
      {/* Header Section */}
      <View className="px-6 pt-4 mt-16 flex-row justify-between items-center">
        <View>
          <Text className="text-blue-100 text-lg">Good Morning,</Text>
          <Text className="text-white text-2xl font-bold">{user?.first_name + ' ' + user?.last_name}</Text>
          <Text className="text-blue-100 text-base">{user?.employee_id}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')} className="bg-white/20 p-2 rounded-full">
          <Ionicons name="person" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        >


          {/* Balance Card */}
          <View className="mx-6 mb-8 shadow-lg shadow-blue-900/20 rounded-3xl overflow-hidden">
            <LinearGradient
              colors={['#2563EB', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-6"
            >
              <View className='p-3'>
                <Text className="text-blue-200 font-medium mb-2">Total Balance</Text>
                <Text className="text-white text-4xl font-bold mb-6">${data.balance.toFixed(2)}</Text>
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1 bg-white/10 p-3 rounded-xl border border-white/20">
                  <View className="flex-row items-center gap-2 mb-1">
                    <View className="bg-green-400/20 p-1 rounded-full">
                      <Ionicons name="arrow-up" size={12} color="#4ADE80" />
                    </View>
                    <Text className="text-blue-100 text-xs">Income</Text>
                  </View>
                  <Text className="text-white text-lg font-bold">${data.revenue.toFixed(2)}</Text>
                </View>
                <View className="flex-1 bg-white/10 p-3 rounded-xl border border-white/20">
                  <View className="flex-row items-center gap-2 mb-1">
                    <View className="bg-red-400/20 p-1 rounded-full">
                      <Ionicons name="arrow-down" size={12} color="#F87171" />
                    </View>
                    <Text className="text-blue-100 text-xs">Expenses</Text>
                  </View>
                  <Text className="text-white text-lg font-bold">${data.expenses.toFixed(2)}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Actions */}
          <View className="px-6 mb-8">
            <Text className="text-gray-900 font-bold text-lg mb-4">Quick Actions</Text>
            <View className="flex-row gap-4 justify-between flex-wrap">
              {hasPermission('finance_entry_create') && (
                <TouchableOpacity onPress={() => router.push('/add-transaction')} className="items-center gap-2 mb-2">
                  <View className="bg-blue-100 p-4 rounded-2xl w-16 h-16 items-center justify-center">
                    <Ionicons name="add" size={32} color="#2563EB" />
                  </View>
                  <Text className="text-xs font-medium text-gray-700">Add New</Text>
                </TouchableOpacity>
              )}

              {hasPermission('invoice_create') && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/invoices')} className="items-center gap-2 mb-2">
                  <View className="bg-purple-100 p-4 rounded-2xl w-16 h-16 items-center justify-center">
                    <Ionicons name="document-text-outline" size={28} color="#9333EA" />
                  </View>
                  <Text className="text-xs font-medium text-gray-700">Invoice</Text>
                </TouchableOpacity>
              )}

              {hasPermission('customer_view') && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/clients')} className="items-center gap-2 mb-2">
                  <View className="bg-orange-100 p-4 rounded-2xl w-16 h-16 items-center justify-center">
                    <Ionicons name="people-outline" size={28} color="#EA580C" />
                  </View>
                  <Text className="text-xs font-medium text-gray-700">Clients</Text>
                </TouchableOpacity>
              )}

              {hasPermission('employee_view_list') && (
                <TouchableOpacity onPress={() => router.push('/employees')} className="items-center gap-2 mb-2">
                  <View className="bg-emerald-100 p-4 rounded-2xl w-16 h-16 items-center justify-center">
                    <Ionicons name="briefcase-outline" size={28} color="#059669" />
                  </View>
                  <Text className="text-xs font-medium text-gray-700">Team</Text>
                </TouchableOpacity>
              )}

              {hasPermission('finance_view_dashboard') && (
                <TouchableOpacity onPress={() => router.push('/debts')} className="items-center gap-2 mb-2">
                  <View className="bg-pink-100 p-4 rounded-2xl w-16 h-16 items-center justify-center">
                    <Ionicons name="card-outline" size={28} color="#DB2777" />
                  </View>
                  <Text className="text-xs font-medium text-gray-700">Debts</Text>
                </TouchableOpacity>
              )}

              {(hasPermission('po_view_list') || hasPermission('po_create')) && (
                <TouchableOpacity onPress={() => router.push('/purchases')} className="items-center gap-2 mb-2">
                  <View className="bg-indigo-100 p-4 rounded-2xl w-16 h-16 items-center justify-center">
                    <Ionicons name="cart-outline" size={28} color="#4F46E5" />
                  </View>
                  <Text className="text-xs font-medium text-gray-700">PO</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => router.push('/approvals')} className="items-center gap-2 mb-2">
                <View className="bg-teal-100 p-4 rounded-2xl w-16 h-16 items-center justify-center">
                  <Ionicons name="checkmark-done-outline" size={28} color="#0D9488" />
                </View>
                <Text className="text-xs font-medium text-gray-700">Approvals</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Transactions */}
          <View className="px-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-900 font-bold text-lg">Recent Activity</Text>
              <TouchableOpacity onPress={() => router.push('/accounting/transactions')}>
                <Text className="text-blue-600 font-semibold text-sm">See All</Text>
              </TouchableOpacity>
            </View>
            {data.recent_transactions.length === 0 ? (
              <View className="items-center py-10 bg-white rounded-2xl border border-gray-100">
                <Ionicons name="file-tray-outline" size={40} color="#CBD5E1" />
                <Text className="text-gray-400 mt-2">No recent transactions</Text>
              </View>
            ) : (
              data.recent_transactions.map((tx: any) => (
                <View key={tx.id} className="bg-white p-4 rounded-2xl border border-gray-100 mb-3 flex-row items-center shadow-sm shadow-gray-200/50">
                  <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${tx.type === 'IN' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Ionicons name={tx.type === 'IN' ? 'arrow-down' : 'arrow-up'} size={16} color={tx.type === 'IN' ? '#16A34A' : '#DC2626'} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900 text-base">{tx.description || tx.category}</Text>
                    <Text className="text-xs text-gray-500 mt-1">{tx.date} • {tx.category}</Text>
                  </View>
                  <Text className={`font-bold text-base ${tx.type === 'IN' ? 'text-green-600' : 'text-gray-900'}`}>
                    {tx.type === 'IN' ? '+' : '-'}${tx.amount}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
