import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { runInference } from '../src/services/onnxService';
import { getTreatment } from '../src/data/treatments';

import { saveToHistory } from '../src/services/historyService';

export default function ResultScreen() {
    const params = useLocalSearchParams();
    const imageUri = params.imageUri as string;
    const router = useRouter();
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        async function analyze() {
            if (!imageUri) return;

            try {
                const startTime = Date.now();
                const res = await runInference(imageUri);
                const endTime = Date.now();
                console.log(`Inference time: ${endTime - startTime}ms`);

                setResult(res);

                // Save to history
                if (res) {
                    await saveToHistory({
                        imageUri: imageUri,
                        label: res.label,
                        confidence: res.confidence
                    });
                    setSaved(true);
                }

            } catch (err) {
                console.error(err);
                setError("Failed to analyze image.");
            } finally {
                setLoading(false);
            }
        }

        setTimeout(analyze, 100);
    }, [imageUri]);

    const handleScanAgain = () => {
        router.replace('/camera');
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

    const treatment = result ? getTreatment(result.label) : null;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
                        {/* Result Card */}
                        <View style={[styles.card, { borderLeftColor: getColor(result?.label || ''), borderLeftWidth: 5 }]}>
                            <Text style={styles.labelTitle}>Analysis Result</Text>
                            <Text style={[styles.resultText, { color: getColor(result?.label || '') }]}>
                                {treatment?.title || result?.label}
                            </Text>
                            <Text style={styles.confidence}>
                                Confidence: {(result?.confidence || 0).toFixed(2)}
                            </Text>
                        </View>

                        {/* Description & Treatment */}
                        {treatment && (
                            <View style={styles.card}>
                                <Text style={styles.sectionHeader}>Condition</Text>
                                <Text style={styles.description}>{treatment.description}</Text>

                                <View style={styles.divider} />

                                <Text style={styles.sectionHeader}>Recommended Action</Text>
                                {treatment.treatment.map((step, index) => (
                                    <View key={index} style={styles.treatmentItem}>
                                        <Text style={styles.bulletPoint}>•</Text>
                                        <Text style={styles.treatmentText}>{step}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleScanAgain}>
                <Text style={styles.buttonText}>Scan Another Leaf</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        alignItems: 'center',
        padding: 20,
        paddingBottom: 40,
    },
    image: {
        width: 250,
        height: 250,
        borderRadius: 12,
        marginBottom: 20,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    resultContainer: {
        width: '100%',
        marginBottom: 20,
    },
    loadingContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 18,
        color: '#666',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    labelTitle: {
        fontSize: 14,
        color: '#888',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    resultText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    confidence: {
        fontSize: 12,
        color: '#999',
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        textAlign: 'center',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 15,
    },
    treatmentItem: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    bulletPoint: {
        fontSize: 18,
        color: '#4CAF50',
        marginRight: 10,
    },
    treatmentText: {
        fontSize: 16,
        color: '#444',
        flex: 1,
        lineHeight: 22,
    },
    button: {
        backgroundColor: '#059669', // Emerald Green to match theme
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
