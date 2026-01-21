import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { DISEASE_LIST, FieldConfig, getFields, saveField } from '../src/services/fieldService';
import * as Crypto from 'expo-crypto';

const COLORS = {
    primaryGreen: '#059669',
    background: '#F9FAFB',
    card: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
};

export default function FieldFormScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [locating, setLocating] = useState(false);

    // Form Field State
    const [id, setId] = useState<string | null>(null);
    const [fieldName, setFieldName] = useState('');
    const [fieldArea, setFieldArea] = useState('');
    const [sowingDate, setSowingDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);

    // Location State
    const [latInput, setLatInput] = useState('');
    const [lonInput, setLonInput] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (params.id) {
            const fields = await getFields();
            const field = fields.find(f => f.id === params.id);
            if (field) {
                setId(field.id);
                setFieldName(field.fieldName);
                setFieldArea(field.fieldArea);
                setSowingDate(new Date(field.sowingDate));
                setSelectedDiseases(field.monitoredDiseases || []);
                if (field.location) {
                    setLatInput(field.location.latitude.toString());
                    setLonInput(field.location.longitude.toString());
                }
            }
        } else {
            // New Field
            setId(Crypto.randomUUID());
            setFieldName('New Field');
        }
        setLoading(false);
    };

    const handleGetGPS = async () => {
        setLocating(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required.');
                return;
            }

            let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setLatInput(loc.coords.latitude.toFixed(6));
            setLonInput(loc.coords.longitude.toFixed(6));
            Alert.alert("GPS Locked", "Coordinates updated from GPS.");
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch GPS location.');
        } finally {
            setLocating(false);
        }
    };

    const toggleDisease = (code: string) => {
        if (selectedDiseases.includes(code)) {
            setSelectedDiseases(selectedDiseases.filter(c => c !== code));
        } else {
            setSelectedDiseases([...selectedDiseases, code]);
        }
    };

    const handleSave = async () => {
        if (!fieldName.trim()) {
            Alert.alert("Error", "Please enter a field name.");
            return;
        }

        const lat = parseFloat(latInput);
        const lon = parseFloat(lonInput);

        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            Alert.alert("Invalid Location", "Please enter valid Latitude and Longitude.");
            return;
        }

        setSaving(true);
        const config: FieldConfig = {
            id: id!,
            fieldName,
            fieldArea,
            sowingDate: sowingDate.toISOString(),
            location: { latitude: lat, longitude: lon },
            monitoredDiseases: selectedDiseases,
        };

        try {
            await saveField(config);
            Alert.alert("Success", "Field saved successfully!");
            router.back();
        } catch (error) {
            Alert.alert("Error", "Failed to save field.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryGreen} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.headerTitle}>{params.id ? 'Edit Field' : 'Add New Field'}</Text>

            {/* Field Details */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Field Details</Text>

                <Text style={styles.label}>Field Name</Text>
                <TextInput
                    style={styles.input}
                    value={fieldName}
                    onChangeText={setFieldName}
                    placeholder="e.g. Rice Field 1"
                />

                <Text style={styles.label}>Area (Acres)</Text>
                <TextInput
                    style={styles.input}
                    value={fieldArea}
                    onChangeText={setFieldArea}
                    placeholder="e.g. 2.5"
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Sowing Date</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                    <Text>{sowingDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={sowingDate}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setSowingDate(selectedDate);
                        }}
                    />
                )}
            </View>

            {/* Location */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Location</Text>
                <Text style={styles.description}>Enter manually or use GPS.</Text>

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Latitude</Text>
                        <TextInput
                            style={styles.input}
                            value={latInput}
                            onChangeText={setLatInput}
                            placeholder="0.0000"
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Longitude</Text>
                        <TextInput
                            style={styles.input}
                            value={lonInput}
                            onChangeText={setLonInput}
                            placeholder="0.0000"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.outlineButton, locating && styles.disabledButton]}
                    onPress={handleGetGPS}
                    disabled={locating}
                >
                    {locating ? <ActivityIndicator color={COLORS.primaryGreen} /> : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Feather name="map-pin" size={18} color={COLORS.primaryGreen} />
                            <Text style={styles.outlineButtonText}> Use GPS</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Disease Monitor */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Pests & Diseases</Text>
                {DISEASE_LIST.map((item) => (
                    <View key={item.code} style={styles.checkboxRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.checkLabel}>{item.name}</Text>
                        </View>
                        <Switch
                            value={selectedDiseases.includes(item.code)}
                            onValueChange={() => toggleDisease(item.code)}
                            trackColor={{ false: '#D1D5DB', true: COLORS.primaryGreen }}
                            thumbColor={'#fff'}
                        />
                    </View>
                ))}
            </View>

            <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={handleSave}
                disabled={saving}
            >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Field</Text>}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 20,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 5,
        marginTop: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.textPrimary,
        backgroundColor: '#F3F4F6',
    },
    description: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    halfInput: {
        width: '48%',
    },
    outlineButton: {
        borderWidth: 1,
        borderColor: COLORS.primaryGreen,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    outlineButtonText: {
        color: COLORS.primaryGreen,
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 8,
    },
    checkboxRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    checkLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    saveButton: {
        backgroundColor: COLORS.primaryGreen,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.7,
    },
});
