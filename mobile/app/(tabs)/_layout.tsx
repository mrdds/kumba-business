import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? "grid" : "grid-outline"} color={color} />,
        }}
      />



      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? "people" : "people-outline"} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clock"
        options={{
          title: 'Clock',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? "time" : "time-outline"} color={color} />,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: 'Invoices',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? "document-text" : "document-text-outline"} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? "person" : "person-outline"} color={color} />,
        }}
      />
    </Tabs>
  );
}
