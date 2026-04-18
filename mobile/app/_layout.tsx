import "../global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ConnectProvider } from '../context/ConnectContext';
import { useColorScheme } from 'react-native';

import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../utils/notifications';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => { });

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter(); // Might cause context issues at Root

  useEffect(() => {
    try {
      SplashScreen.hideAsync();
    } catch (e) {
      console.log('Splash screen hide error:', e);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === 'auth';
    if (!user && !inAuthGroup) {
      router.replace('/auth/sign-in');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
    if (user) {
      try {
        registerForPushNotificationsAsync();
      } catch (e) {
        console.log('Push notification error', e);
      }
    }
  }, [user, segments, isLoading, router]);

  const linking = {
    prefixes: ['mobile://'],
    config: {
      screens: {
        auth: {
          screens: {
            'reset-password': 'reset-password',
            'sign-in': 'sign-in',
          }
        }
      }
    }
  };

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.url) {
        router.push(data.url as any);
      } else if (data?.type === 'approval' && data?.id) {
        router.push({ pathname: '/approvals/[id]' as any, params: { id: data.id } });
      }
    });
    return () => subscription.remove();
  }, [router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="employees" options={{ headerShown: false }} />
        <Stack.Screen name="add-transaction" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ConnectProvider>
        <RootLayoutNav />
      </ConnectProvider>
    </AuthProvider>
  );
}
