import { DiseasePest } from './fieldService';

export interface WeatherDay {
    date: string; // YYYY-MM-DD
    temp_max: number;
    temp_min: number;
    rh_avg: number;
    rain_sum: number;
    dewpoint_avg: number;
    leaf_wetness_hours: number; // Derived
}

export interface RiskResult {
    code: string;
    risk: 'LOW' | 'MODERATE' | 'HIGH';
    matchCount: number;
}

interface DiseaseParams {
    name: string;
    type: 'disease' | 'pest';
    temp_min: number;
    temp_max: number;
    rh_min?: number;
    rain_min?: number;
    dewpoint_min?: number;
    dewpoint_max?: number;
    leaf_wetness_min?: number; // Hours
    consecutive_days: number;
    code: string;
}

export const DISEASE_PARAMS: Record<string, DiseaseParams> = {
    'RB': {
        name: 'Rice Blast', type: 'disease', code: 'RB',
        temp_min: 22, temp_max: 30, rh_min: 85, rain_min: 2, dewpoint_min: 19, dewpoint_max: 24, leaf_wetness_min: 8, consecutive_days: 1
    },
    'BLB': {
        name: 'Bacterial Leaf Blight', type: 'disease', code: 'BLB',
        temp_min: 25, temp_max: 34, rh_min: 80, rain_min: 2.0, dewpoint_min: 22, dewpoint_max: 24, leaf_wetness_min: 6, consecutive_days: 3
    },
    'SB': {
        name: 'Sheath Blight', type: 'disease', code: 'SB',
        temp_min: 26, temp_max: 34, rh_min: 90, rain_min: 2.0, dewpoint_min: 21, dewpoint_max: 27, leaf_wetness_min: 8, consecutive_days: 2
    },
    'GM': {
        name: 'Gall Midge', type: 'pest', code: 'GM',
        temp_min: 20, temp_max: 30, rh_min: 85, rain_min: 0.0, dewpoint_min: 20, dewpoint_max: 26, leaf_wetness_min: 0, consecutive_days: 1
    },
    'BS': {
        name: 'Brown Spot', type: 'disease', code: 'BS',
        temp_min: 24, temp_max: 30, rh_min: 80, rain_min: 2.0, dewpoint_min: 20, dewpoint_max: 25, leaf_wetness_min: 8, consecutive_days: 3
    },
    'YSB': {
        name: 'Yellow Stem Borer', type: 'pest', code: 'YSB',
        temp_min: 22, temp_max: 34, rh_min: 80, rain_min: 0.0, dewpoint_min: 20, dewpoint_max: 26, leaf_wetness_min: 0, consecutive_days: 1
    },
    'LF': {
        name: 'Leaf Folder', type: 'pest', code: 'LF',
        temp_min: 25, temp_max: 32, rh_min: 70, rain_min: 0.0, dewpoint_min: 20, dewpoint_max: 27, leaf_wetness_min: 0, consecutive_days: 1
    },
    'BPH': {
        name: 'Brown Plant Hopper', type: 'pest', code: 'BPH',
        temp_min: 25, temp_max: 32, rh_min: 70, rain_min: 0.0, dewpoint_min: 20, dewpoint_max: 27, leaf_wetness_min: 0, consecutive_days: 1
    },
};

/**
 * Calculates risk for a single day based on weather parameters.
 */
export function calculateRisk(weather: WeatherDay, diseaseCode: string): RiskResult {
    const params = DISEASE_PARAMS[diseaseCode];
    if (!params) return { code: diseaseCode, risk: 'LOW', matchCount: 0 };

    let matches = 0;
    let totalConditions = 0;

    // Check Temp
    if (weather.temp_min >= params.temp_min && weather.temp_max <= params.temp_max) {
        matches++;
    }
    totalConditions++;

    // Check RH
    if (params.rh_min !== undefined) {
        if (weather.rh_avg >= params.rh_min) matches++;
        totalConditions++;
    }

    // Check Rain
    if (params.rain_min !== undefined) {
        if (weather.rain_sum >= params.rain_min) matches++;
        totalConditions++;
    }

    // Check Dewpoint
    if (params.dewpoint_min !== undefined && params.dewpoint_max !== undefined) {
        if (weather.dewpoint_avg >= params.dewpoint_min && weather.dewpoint_avg <= params.dewpoint_max) matches++;
        totalConditions++;
    }

    // Check Leaf Wetness (Derived from rain + high humidity if not directly available, but we'll use our derived input)
    if (params.leaf_wetness_min !== undefined) {
        if (weather.leaf_wetness_hours >= params.leaf_wetness_min) matches++;
        totalConditions++;
    }

    // Determine Logic
    // HIGH: > 80% conditions match
    // MODERATE: > 50% conditions match
    // LOW: < 50%

    const matchRate = matches / totalConditions;
    let risk: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';

    if (matchRate >= 0.8) risk = 'HIGH';
    else if (matchRate >= 0.5) risk = 'MODERATE';

    return { code: diseaseCode, risk, matchCount: matches };
}
