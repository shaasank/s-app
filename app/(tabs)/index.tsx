
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Dimensions, SafeAreaView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getWeather, getWeatherIcon } from '../../src/services/weatherService';
import { getActiveField } from '../../src/services/fieldService';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Premium Color Palette
const COLORS = {
    primaryGreen: '#059669', // Emerald 600
    primaryDarkGreen: '#047857', // Emerald 700
    background: '#F9FAFB', // Cool Gray 50
    card: '#FFFFFF',
    textPrimary: '#111827', // Gray 900
    textSecondary: '#6B7280', // Gray 500
    textWhite: '#FFFFFF',
    accentBlue: '#3B82F6', // Blue 500
    accentYellow: '#F59E0B', // Amber 500
    border: '#E5E7EB', // Gray 200
};

export default function HomeScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [weather, setWeather] = useState<any>(null);
    const [loadingWeather, setLoadingWeather] = useState(true);
    const [activeFieldName, setActiveFieldName] = useState('Select Field');

    // Initial fetch logic
    const fetchWeather = async () => {
        setLoadingWeather(true);
        try {
            // Check for active field first
            const activeField = await getActiveField();

            let lat, lon;

            if (activeField && activeField.location) {
                lat = activeField.location.latitude;
                lon = activeField.location.longitude;
                console.log(`Using Active Field: ${activeField.fieldName} (${lat}, ${lon})`);
            } else {
                // Fallback to GPS if no field set
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setLoadingWeather(false);
                    return;
                }

                let location;
                try {
                    location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    lat = location.coords.latitude;
                    lon = location.coords.longitude;
                } catch (error) {
                    location = await Location.getLastKnownPositionAsync({});
                    if (location) {
                        lat = location.coords.latitude;
                        lon = location.coords.longitude;
                    }
                }
            }

            if (!lat || !lon) {
                setLoadingWeather(false);
                return;
            }

            const weatherData = await getWeather(lat, lon);
            setWeather(weatherData);

        } catch (error) {
            console.error(error);
        } finally {
            setLoadingWeather(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadActiveFieldName();
            fetchWeather();
        }, [])
    );

    const loadActiveFieldName = async () => {
        const field = await getActiveField();
        if (field) setActiveFieldName(field.fieldName);
    };

    const onRefresh = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRefreshing(true);
        fetchWeather();
    };

    const pickImage = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Gallery access is required.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled && result.assets[0].uri) {
                const manipResult = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 224, height: 224 } }],
                    { format: ImageManipulator.SaveFormat.JPEG }
                );

                router.push({
                    pathname: '/result',
                    params: { imageUri: manipResult.uri }
                });
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const renderDailyForecast = () => {
        if (!weather || !weather.daily) return null;

        return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.forecastScroll}>
                {weather.daily.time.slice(0, 5).map((time: string, index: number) => {
                    const date = new Date(time);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const tempMax = Math.round(weather.daily.temperature_2m_max?.[index] ?? 0);
                    const weatherCode = weather.daily.weather_code[index];
                    const rainChance = weather.daily.precipitation_probability_max?.[index] ?? 0;
                    const icon = getWeatherIcon(weatherCode);

                    return (
                        <View key={time} style={styles.forecastCard}>
                            <Text style={styles.forecastDay}>{dayName}</Text>
                            <Text style={styles.forecastIcon}>{icon}</Text>
                            <Text style={styles.forecastTemp}>{tempMax ? `${tempMax}°` : '--'}</Text>
                            <Text style={styles.forecastRain}>{rainChance}%</Text>
                        </View>
                    );
                })}
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Green Header Background */}
            <View style={styles.greenHeaderContainer}>
                <SafeAreaView>
                    <View style={styles.headerContent}>
                        <Text style={styles.appName}>SmartFarm AI</Text>

                        <TouchableOpacity
                            style={styles.fieldSelector}
                            onPress={() => router.push('/field-config')}
                        >
                            <Text style={styles.fieldSelectorText}>{activeFieldName}</Text>
                            <Feather name="settings" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View >

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryGreen} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Main Weather Card */}
                <View style={[styles.card, styles.weatherCard]}>
                    <Text style={styles.cardTitle}>Current Weather</Text>

                    <View style={styles.weatherRow}>
                        <Text style={styles.bigTemp}>
                            {weather ? `${Math.round(weather.current.temperature_2m)}°` : '--'}
                        </Text>

                        <View style={styles.weatherDetailsRight}>
                            <View style={styles.detailRow}>
                                <Feather name="droplet" size={18} color={COLORS.accentBlue} />
                                <Text style={styles.detailText}>
                                    {weather?.daily?.precipitation_probability_max?.[0] ?? 0}%
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Feather name="cloud-rain" size={18} color={COLORS.textSecondary} />
                                <Text style={styles.detailText}>
                                    {weather?.daily?.rain_sum?.[0] ?? 0}mm
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 5-Day Forecast */}
                <Text style={styles.sectionTitle}>5-Day Rain Forecast</Text>
                {loadingWeather ? (
                    <ActivityIndicator color={COLORS.primaryGreen} size="large" style={{ marginVertical: 20 }} />
                ) : (
                    renderDailyForecast()
                )}

                {/* Quick Actions Grid */}
                <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Quick Actions</Text>
                <View style={styles.grid}>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/camera')}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                            <Feather name="camera" size={24} color={COLORS.primaryGreen} />
                        </View>
                        <Text style={styles.actionText}>Scan Leaf</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={pickImage}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                            <Feather name="image" size={24} color={COLORS.accentBlue} />
                        </View>
                        <Text style={styles.actionText}>Upload</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/history')}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                            <Feather name="clock" size={24} color={COLORS.accentYellow} />
                        </View>
                        <Text style={styles.actionText}>History</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    greenHeaderContainer: {
        backgroundColor: COLORS.primaryGreen,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    appName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textWhite,
    },
    welcomeText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 2,
    },
    fieldSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    fieldSelectorText: {
        color: COLORS.textWhite,
        fontWeight: '600',
        marginRight: 4,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        marginTop: 20,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    weatherCard: {
        minHeight: 150,
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 10,
    },
    weatherRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bigTemp: {
        fontSize: 64,
        fontWeight: 'bold',
        color: COLORS.primaryGreen,
    },
    weatherDetailsRight: {
        justifyContent: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginLeft: 8,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 15,
        marginLeft: 5,
    },
    forecastScroll: {
        paddingBottom: 10,
    },
    forecastCard: {
        backgroundColor: COLORS.card,
        width: 80,
        paddingVertical: 15,
        borderRadius: 12,
        marginRight: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    forecastDay: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    forecastIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    forecastTemp: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primaryGreen,
        marginBottom: 4,
    },
    forecastRain: {
        fontSize: 12,
        color: COLORS.accentBlue,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionCard: {
        width: (width - 50) / 3,
        backgroundColor: COLORS.card,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
});
