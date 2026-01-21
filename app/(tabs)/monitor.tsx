import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { getActiveField, FieldConfig, DISEASE_LIST } from '../../src/services/fieldService';
import { getAgroWeather, WeatherDay } from '../../src/services/weatherService';
import { calculateRisk, RiskResult, DISEASE_PARAMS } from '../../src/services/predictionService';

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#059669',
    background: '#F9FAFB',
    card: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    highRisk: '#EF4444',
    modRisk: '#F59E0B',
    lowRisk: '#10B981',
};

export default function MonitorScreen() {
    const [loading, setLoading] = useState(true);
    const [fieldConfig, setFieldConfig] = useState<FieldConfig | null>(null);
    const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
    const [selectedDay, setSelectedDay] = useState(0); // 0, 1, 2
    const [risks, setRisks] = useState<{ [dayIndex: number]: RiskResult[] }>({});

    useFocusEffect(
        useCallback(() => {
            initialize();
        }, [])
    );

    const initialize = async () => {
        setLoading(true);
        // Load Active Field
        const config = await getActiveField();
        setFieldConfig(config);

        if (config && config.location) {
            // Load Weather
            const weather = await getAgroWeather(config.location.latitude, config.location.longitude);
            setWeatherData(weather);

            // Calculate Risks for all 3 days
            const allRisks: { [key: number]: RiskResult[] } = {};

            weather.forEach((day, index) => {
                const dayRisks: RiskResult[] = [];
                // Only for monitored diseases
                const monitored = config.monitoredDiseases || [];

                monitored.forEach(code => {
                    const risk = calculateRisk(day, code);
                    dayRisks.push(risk);
                });

                // Sort param: High risk first
                dayRisks.sort((a, b) => {
                    const weight = { 'HIGH': 3, 'MODERATE': 2, 'LOW': 1 };
                    return weight[b.risk] - weight[a.risk];
                });

                allRisks[index] = dayRisks;
            });
            setRisks(allRisks);
        }
        setLoading(false);
    };

    const renderRiskCard = (item: RiskResult) => {
        const params = DISEASE_PARAMS[item.code];
        const color = item.risk === 'HIGH' ? COLORS.highRisk : item.risk === 'MODERATE' ? COLORS.modRisk : COLORS.lowRisk;
        const iconName = params?.type === 'disease' ? 'alert-circle' : 'alert-triangle';

        return (
            <View key={item.code} style={[styles.riskCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
                <View style={styles.riskHeader}>
                    <Text style={styles.diseaseName}>{params?.name || item.code}</Text>
                    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
                        <Text style={[styles.badgeText, { color: color }]}>{item.risk}</Text>
                    </View>
                </View>
                <Text style={styles.riskDesc}>
                    {item.risk === 'HIGH' ? 'Favorable conditions detected.' :
                        item.risk === 'MODERATE' ? 'Watch for symptoms.' : 'Conditions unfavorable.'}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 10, color: COLORS.textSecondary }}> Analyzing Risks...</Text>
            </View>
        );
    }

    if (!fieldConfig || !fieldConfig.location) {
        return (
            <View style={styles.center}>
                <Feather name="map-pin" size={40} color={COLORS.textSecondary} />
                <Text style={[styles.text, { marginVertical: 20 }]}>Please configure your field location first.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Field Monitor</Text>
                <Text style={styles.headerSub}>{fieldConfig.fieldName}</Text>
            </View>

            {/* Day Selector */}
            <View style={styles.tabContainer}>
                {weatherData.map((day, index) => {
                    const date = new Date(day.date);
                    const isSelected = selectedDay === index;
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[styles.tab, isSelected && styles.activeTab]}
                            onPress={() => setSelectedDay(index)}
                        >
                            <Text style={[styles.tabDay, isSelected && styles.activeTabText]}>
                                {index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </Text>
                            <Text style={[styles.tabDate, isSelected && styles.activeTabText]}>
                                {date.getDate()}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Risk Forecast</Text>

                {risks[selectedDay] && risks[selectedDay].length > 0 ? (
                    risks[selectedDay].map(renderRiskCard)
                ) : (
                    <Text style={styles.emptyText}>No diseases selected to monitor.</Text>
                )}

                <View style={[styles.card, { marginTop: 20 }]}>
                    <Text style={styles.sectionTitle}>Weather Conditions</Text>
                    {weatherData[selectedDay] && (
                        <View style={styles.weatherGrid}>
                            <View style={styles.weatherItem}>
                                <Text style={styles.wLabel}>Max Temp</Text>
                                <Text style={styles.wValue}>{weatherData[selectedDay].temp_max}°C</Text>
                            </View>
                            <View style={styles.weatherItem}>
                                <Text style={styles.wLabel}>Min Temp</Text>
                                <Text style={styles.wValue}>{weatherData[selectedDay].temp_min}°C</Text>
                            </View>
                            <View style={styles.weatherItem}>
                                <Text style={styles.wLabel}>Humidity</Text>
                                <Text style={styles.wValue}>{Math.round(weatherData[selectedDay].rh_avg)}%</Text>
                            </View>
                            <View style={styles.weatherItem}>
                                <Text style={styles.wLabel}>Rain</Text>
                                <Text style={styles.wValue}>{weatherData[selectedDay].rain_sum}mm</Text>
                            </View>
                        </View>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    headerSub: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    text: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    activeTab: {
        backgroundColor: COLORS.primary,
    },
    tabDay: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    tabDate: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    activeTabText: {
        color: '#fff',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 15,
    },
    riskCard: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    riskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    diseaseName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    riskDesc: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        fontStyle: 'italic',
        marginTop: 20,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    weatherGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    weatherItem: {
        width: '48%',
        marginBottom: 10,
        backgroundColor: '#F9FAFB',
        padding: 10,
        borderRadius: 8,
    },
    wLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    wValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
});
