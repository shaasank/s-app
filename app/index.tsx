import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.content}>
                <Text style={styles.title}>Rice Leaf Disease Detector</Text>
                <Text style={styles.subtitle}>Offline AI Assistant</Text>

                <View style={styles.spacer} />

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/camera')}
                >
                    <Text style={styles.buttonText}>Capture Leaf Image</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        width: '100%',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2E7D32', // Dark Green
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 50,
    },
    spacer: {
        height: 50,
    },
    button: {
        backgroundColor: '#4CAF50', // Green
        paddingVertical: 20,
        paddingHorizontal: 40,
        borderRadius: 15,
        width: '100%',
        alignItems: 'center',
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 24, // Large text
        fontWeight: 'bold',
    },
});
