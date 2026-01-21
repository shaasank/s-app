import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { HistoryItem, getHistory, clearHistory } from '../src/services/historyService';
import { getTreatment } from '../src/data/treatments';
import * as Haptics from 'expo-haptics';

const COLORS = {
    background: '#F2F2F7',
    card: '#FFFFFF',
    textPrimary: '#000000',
    textSecondary: '#8E8E93',
    danger: '#FF3B30',
};

export default function HistoryScreen() {
    const router = useRouter();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        const data = await getHistory();
        setHistory(data);
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleClear = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await clearHistory();
        setHistory([]);
    };

    const renderItem = ({ item }: { item: HistoryItem }) => {
        const treatment = getTreatment(item.label);
        const date = new Date(item.timestamp);

        // iOS Style Date Format
        const dateString = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const timeString = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

        return (
            <TouchableOpacity
                style={styles.listItem}
                onPress={() => {
                    router.push({ pathname: '/result', params: { imageUri: item.imageUri } });
                }}
            >
                <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>{treatment.title}</Text>
                    <Text style={styles.subtitle}>{dateString} • {timeString}</Text>
                </View>
                <View style={styles.trailing}>
                    <Text style={[
                        styles.confidence,
                        { color: item.confidence > 0.8 ? '#34C759' : '#FF9500' }
                    ]}>
                        {Math.round(item.confidence * 100)}%
                    </Text>
                    <Text style={styles.chevron}>›</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView style={{ flex: 1 }}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backText}>‹ Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>History</Text>
                    <TouchableOpacity onPress={handleClear} disabled={history.length === 0}>
                        <Text style={[styles.clearText, { opacity: history.length === 0 ? 0.3 : 1 }]}>Clear</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={history}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyEmoji}>📜</Text>
                            <Text style={styles.emptyText}>No Scan History</Text>
                            <Text style={styles.emptySubtext}>Scans you perform will appear here.</Text>
                        </View>
                    }
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA', // Divider
    },
    backButton: {
        width: 60,
    },
    backText: {
        fontSize: 17,
        color: '#007AFF', // iOS Blue
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    clearText: {
        fontSize: 17,
        color: COLORS.danger,
        width: 60,
        textAlign: 'right',
    },
    listContent: {
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    listItem: {
        backgroundColor: COLORS.card,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12, // Modern iOS cards
        marginBottom: 8,
    },
    thumbnail: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#E5E5EA',
    },
    info: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    trailing: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    confidence: {
        fontSize: 14,
        fontWeight: '500',
        marginRight: 8,
    },
    chevron: {
        fontSize: 22,
        color: '#C7C7CC', // iOS Chevron Color
        fontWeight: '300',
        marginTop: -2,
    },
    separator: {
        height: 0,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 10,
        opacity: 0.5,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    emptySubtext: {
        fontSize: 15,
        color: '#C7C7CC',
        marginTop: 5,
    },
});
