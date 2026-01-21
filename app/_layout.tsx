import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { loadModel } from '../src/services/onnxService';
import { View, Text } from 'react-native';

export default function Layout() {
    useEffect(() => {
        // Preload model on app start
        loadModel().catch(err => console.error(err));
    }, []);

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#4CAF50',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="camera" options={{ title: 'Scan Leaf', headerShown: false }} />
            <Stack.Screen name="result" options={{ title: 'Analysis Result', headerLeft: () => null }} />
            <Stack.Screen name="field-config" options={{ title: 'My Fields', presentation: 'modal' }} />
            <Stack.Screen name="field-form" options={{ title: 'Field Details', presentation: 'modal' }} />
        </Stack>
    );
}
