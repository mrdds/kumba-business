import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerPushToken } from '../services/api';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

export async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }
        let token;
        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;
            if (!projectId) {
                console.log('No EAS Project ID found, skipping push token registration.');
                return;
            }
            token = (await Notifications.getExpoPushTokenAsync({
                projectId: projectId,
            })).data;
        } catch (error) {
            console.log('Error fetching push token:', error);
            return;
        }

        // Send to backend
        try {
            await registerPushToken(token);
            console.log('Push token registered:', token);
        } catch (e) {
            console.error('Failed to sync push token:', e);
        }

        return token;
    } else {
        console.log('Must use physical device for Push Notifications');
    }
}
