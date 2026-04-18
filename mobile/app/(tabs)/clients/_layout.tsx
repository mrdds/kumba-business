import { Stack } from 'expo-router';

export default function ClientsLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: 'Clients', headerLargeTitle: true }} />
            <Stack.Screen name="create" options={{ presentation: 'modal', title: 'Add Client' }} />
        </Stack>
    );
}
