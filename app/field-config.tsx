import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { FieldConfig, getFields, getActiveFieldId, setActiveFieldId } from '../src/services/fieldService';

const COLORS = {
    primaryGreen: '#059669',
    background: '#F9FAFB',
    card: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
};

export default function FieldListScreen() {
    const router = useRouter();
    const [fields, setFields] = useState<FieldConfig[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadFields();
        }, [])
    );

    const loadFields = async () => {
        setLoading(true);
        const data = await getFields();
        const active = await getActiveFieldId();
        setFields(data);
        setActiveId(active);
        setLoading(false);
    };

    const handleFieldSelect = async (id: string) => {
        await setActiveFieldId(id);
        setActiveId(id);
        Alert.alert("Active Field Changed", "Dashboard and Monitor updated.");
    };

    const handleEdit = (id: string, event: any) => {
        event.stopPropagation(); // Prevent selection when editing
        router.push({ pathname: '/field-form', params: { id } });
    };

    const renderItem = ({ item }: { item: FieldConfig }) => {
        const isActive = item.id === activeId;

        return (
            <TouchableOpacity
                style={[styles.card, isActive && styles.activeCard]}
                onPress={() => handleFieldSelect(item.id)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.titleRow}>
                        {isActive && <Feather name="check-circle" size={20} color={COLORS.primaryGreen} style={{ marginRight: 8 }} />}
                        <Text style={[styles.fieldName, isActive && styles.activeText]}>{item.fieldName}</Text>
                    </View>
                    <TouchableOpacity onPress={(e) => handleEdit(item.id, e)} style={styles.editButton}>
                        <Feather name="edit-2" size={18} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.cardRow}>
                    <Feather name="map-pin" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.cardDetail}>
                        {item.location ? `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}` : 'No GPS'}
                    </Text>
                    <Text style={styles.separator}>|</Text>
                    <Feather name="maximize" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.cardDetail}>{item.fieldArea ? `${item.fieldArea} ac` : '--'}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primaryGreen} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Fields</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => router.push('/field-form')}>
                    <Feather name="plus" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {fields.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Feather name="layers" size={48} color={COLORS.textSecondary} />
                    <Text style={styles.emptyText}>No fields added yet.</Text>
                    <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/field-form')}>
                        <Text style={styles.emptyButtonText}>Add Your First Field</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={fields}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                />
            )}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    addButton: {
        backgroundColor: COLORS.primaryGreen,
        padding: 10,
        borderRadius: 50,
        elevation: 2,
    },
    listContent: {
        padding: 20,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    activeCard: {
        borderColor: COLORS.primaryGreen,
        backgroundColor: '#ECFDF5',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fieldName: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    activeText: {
        color: COLORS.primaryGreen,
    },
    editButton: {
        padding: 5,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardDetail: {
        marginLeft: 6,
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    separator: {
        marginHorizontal: 10,
        color: '#D1D5DB',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        color: COLORS.textSecondary,
        marginVertical: 20,
    },
    emptyButton: {
        backgroundColor: COLORS.primaryGreen,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
