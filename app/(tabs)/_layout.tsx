import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
                    paddingTop: 10,
                    height: Platform.OS === 'ios' ? 90 : 70,
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#E5E7EB',
                },
                tabBarActiveTintColor: '#059669',
                tabBarInactiveTintColor: '#9CA3AF',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
                    tabBarLabelStyle: { fontSize: 12, marginBottom: 5 },
                }}
            />
            <Tabs.Screen
                name="monitor"
                options={{
                    title: 'Monitor',
                    tabBarIcon: ({ color }) => <Feather name="activity" size={24} color={color} />,
                    tabBarLabelStyle: { fontSize: 12, marginBottom: 5 },
                }}
            />
        </Tabs>
    );
}
