import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export const FIELDS_KEY = 'fields_list';
export const ACTIVE_FIELD_KEY = 'active_field_id';

export interface DiseasePest {
    code: string;
    name: string;
    type: 'disease' | 'pest';
    selected: boolean;
}

export interface FieldLocation {
    latitude: number;
    longitude: number;
    address?: string;
}

export interface FieldConfig {
    id: string;
    fieldName: string;
    fieldArea: string;
    sowingDate: string;
    location: FieldLocation | null;
    monitoredDiseases: string[];
}

export const DISEASE_LIST: DiseasePest[] = [
    { code: 'RB', name: 'Rice Blast', type: 'disease', selected: false },
    { code: 'BLB', name: 'Bacterial Leaf Blight', type: 'disease', selected: false },
    { code: 'SB', name: 'Sheath Blight', type: 'disease', selected: false },
    { code: 'GM', name: 'Gall Midge', type: 'pest', selected: false },
    { code: 'BS', name: 'Brown Spot', type: 'disease', selected: false },
    { code: 'YSB', name: 'Yellow Stem Borer', type: 'pest', selected: false },
    { code: 'LF', name: 'Leaf Folder', type: 'pest', selected: false },
    { code: 'BPH', name: 'Brown Plant Hopper', type: 'pest', selected: false },
];

export async function getFields(): Promise<FieldConfig[]> {
    try {
        const json = await AsyncStorage.getItem(FIELDS_KEY);
        return json ? JSON.parse(json) : [];
    } catch (error) {
        console.error("Failed to get fields:", error);
        return [];
    }
}

export async function saveField(field: FieldConfig): Promise<void> {
    try {
        const fields = await getFields();
        const index = fields.findIndex(f => f.id === field.id);

        if (index >= 0) {
            fields[index] = field;
        } else {
            fields.push(field);
        }

        await AsyncStorage.setItem(FIELDS_KEY, JSON.stringify(fields));
        // If it's the first field, make it active automatically
        if (fields.length === 1) {
            await setActiveFieldId(field.id);
        }
    } catch (error) {
        console.error("Failed to save field:", error);
        throw error;
    }
}

export async function deleteField(id: string): Promise<void> {
    try {
        let fields = await getFields();
        fields = fields.filter(f => f.id !== id);
        await AsyncStorage.setItem(FIELDS_KEY, JSON.stringify(fields));

        // If we deleted the active field, reset active or pick another
        const activeId = await getActiveFieldId();
        if (activeId === id) {
            await setActiveFieldId(fields.length > 0 ? fields[0].id : null);
        }
    } catch (error) {
        console.error("Failed to delete field:", error);
    }
}

export async function getActiveFieldId(): Promise<string | null> {
    return await AsyncStorage.getItem(ACTIVE_FIELD_KEY);
}

export async function setActiveFieldId(id: string | null): Promise<void> {
    if (id) {
        await AsyncStorage.setItem(ACTIVE_FIELD_KEY, id);
    } else {
        await AsyncStorage.removeItem(ACTIVE_FIELD_KEY);
    }
}

export async function getActiveField(): Promise<FieldConfig | null> {
    const id = await getActiveFieldId();
    if (!id) return null;

    const fields = await getFields();
    return fields.find(f => f.id === id) || null;
}

// Deprecated single-config getter compatibility (optional, but better to just migrate)
export async function getFieldConfig(): Promise<FieldConfig | null> {
    return getActiveField();
}
