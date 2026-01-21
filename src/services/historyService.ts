import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'leaf_scan_history';

export interface HistoryItem {
    id: string;
    timestamp: number;
    imageUri: string;
    label: string;
    confidence: number;
}

export const saveToHistory = async (result: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    try {
        const history = await getHistory();
        const newItem: HistoryItem = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            ...result
        };

        // Add to beginning
        const updatedHistory = [newItem, ...history];

        // Limit to 50 items
        if (updatedHistory.length > 50) {
            updatedHistory.pop();
        }

        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        return newItem;
    } catch (error) {
        console.error("Failed to save history:", error);
    }
};

export const getHistory = async (): Promise<HistoryItem[]> => {
    try {
        const json = await AsyncStorage.getItem(HISTORY_KEY);
        return json ? JSON.parse(json) : [];
    } catch (error) {
        console.error("Failed to fetch history:", error);
        return [];
    }
};

export const clearHistory = async () => {
    await AsyncStorage.removeItem(HISTORY_KEY);
};
