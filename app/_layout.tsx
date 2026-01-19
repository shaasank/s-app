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
            <Stack.Screen name="index" options={{ title: 'Farmer App' }} />
            <Stack.Screen name="camera" options={{ title: 'Scan Leaf', headerShown: false }} />
            <Stack.Screen name="result" options={{ title: 'Analysis Result', headerLeft: () => null }} />
        </Stack>
    );
}
