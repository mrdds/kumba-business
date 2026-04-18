import { Stack } from 'expo-router';

export default function InvoiceLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="create" options={{ presentation: 'modal' }} />
        </Stack>
    );
}
