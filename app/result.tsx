import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { runInference } from '../src/services/onnxService';

export default function ResultScreen() {
    const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
    const router = useRouter();
    const [result, setResult] = useState<{ label: string; confidence: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function analyze() {
            if (!imageUri) return;

            try {
                const startTime = Date.now();
                const res = await runInference(imageUri);
                const endTime = Date.now();
                console.log(`Inference time: ${endTime - startTime}ms`);

                setResult(res);
            } catch (err) {
                console.error(err);
                setError("Failed to analyze image.");
            } finally {
                setLoading(false);
            }
        }

        // Small delay to allow UI to render "Analyzing..."
        setTimeout(analyze, 100);
    }, [imageUri]);

    const handleScanAgain = () => {
        router.replace('/camera');
    };

    const getSeverityText = (label: string) => {
        // Basic mapping, can be improved
        switch (label) {
            case 'severity_0': return "Healthy Leaf (Severity 0)";
            case 'severity_1': return "Very Low Disease (Severity 1)";
            case 'severity_3': return "Low Disease (Severity 3)";
            case 'severity_5': return "Moderate Disease (Severity 5)";
            case 'severity_7': return "High Disease (Severity 7)";
            case 'severity_9': return "Severe Disease (Severity 9)";
            case 'unknown': return "Unknown Condition";
            default: return label;
        }
    };

    const getColor = (label: string) => {
        if (label === 'severity_0') return '#4CAF50'; // Green
        if (label === 'severity_1') return '#8BC34A'; // Light Green
        if (label === 'severity_3') return '#CDDC39'; // Lime
        if (label === 'severity_5') return '#FFEB3B'; // Yellow
        if (label === 'severity_7') return '#FF9800'; // Orange
        if (label === 'severity_9') return '#F44336'; // Red
        return '#9E9E9E'; // Grey
    };

    return (
        <View style={styles.container}>
            {imageUri && (
                <Image source={{ uri: imageUri }} style={styles.image} />
            )}

            <View style={styles.resultContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={styles.loadingText}>Analyzing Leaf...</Text>
                    </View>
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : (
                    <>
                        <Text style={styles.labelTitle}>Severity Level</Text>
                        <Text style={[styles.resultText, { color: getColor(result?.label || '') }]}>
                            {getSeverityText(result?.label || 'unknown')}
                        </Text>
                        <Text style={styles.confidence}>
                            (Raw Confidence: {result?.confidence.toFixed(2)})
                        </Text>
                    </>
                )}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleScanAgain}>
                <Text style={styles.buttonText}>Scan Another Leaf</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        padding: 20,
    },
    image: {
        width: 224,
        height: 224,
        borderRadius: 10,
        marginBottom: 30,
        marginTop: 20,
        borderWidth: 2,
        borderColor: '#eee',
    },
    resultContainer: {
        flex: 1,
        alignItems: 'center',
        width: '100%',
    },
    loadingContainer: {
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18,
        color: '#666',
    },
    labelTitle: {
        fontSize: 20,
        color: '#333',
        marginBottom: 5,
    },
    resultText: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    confidence: {
        fontSize: 14,
        color: '#999',
    },
    errorText: {
        fontSize: 18,
        color: 'red',
    },
    button: {
        backgroundColor: '#2196F3', // Blue
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
});
