export interface TreatmentData {
    title: string;
    description: string;
    treatment: string[];
}

export const TREATMENTS: Record<string, TreatmentData> = {
    'severity_0': {
        title: 'Healthy Plant',
        description: 'No signs of disease detected. The plant appears vigorous.',
        treatment: [
            'Continue regular monitoring.',
            'Maintain optimal water levels.',
            'Ensure proper nutrient balance.'
        ]
    },
    'severity_1': {
        title: 'Very Low Infection',
        description: 'Minor spots or discoloration detected (Severity 1).',
        treatment: [
            'Monitor the spreading of spots closely.',
            'Check for nutrient deficiencies (Nitrogen/Potassium).',
            'Keep the field weed-free.'
        ]
    },
    'severity_3': {
        title: 'Low Infection',
        description: 'Visible lesions appearing on some leaves (Severity 3).',
        treatment: [
            'Avoid excessive Nitrogen application.',
            'Improve air circulation if possible.',
            'Consider mild preventive fungicides if weather favors disease.'
        ]
    },
    'severity_5': {
        title: 'Moderate Infection',
        description: 'Significant lesions affecting photosynthesis (Severity 5).',
        treatment: [
            'Remove and destroy heavily infected leaves.',
            'Ensure field drainage is adequate.',
            'Apply recommended fungicides (e.g., Copper-based) if spreading.'
        ]
    },
    'severity_7': {
        title: 'High Infection',
        description: 'Large areas of leaves are damaged (Severity 7). Yield loss risk.',
        treatment: [
            'Immediate chemical control is likely needed.',
            'Consult local agricultural officer.',
            'Drain field water for 2-3 days to reduce humidity.'
        ]
    },
    'severity_9': {
        title: 'Severe Infection',
        description: 'Critical damage to the crop (Severity 9). High risk of major yield loss.',
        treatment: [
            'Harvest immediately if crop is mature.',
            'Burn/bury infected stubble after harvest.',
            'Do not use seeds from this field for next season.'
        ]
    },
    'unknown': {
        title: 'Unknown Condition',
        description: 'The image analysis was inconclusive.',
        treatment: [
            'Try scanning again with better lighting.',
            'Ensure the image is focused on the leaf.'
        ]
    }
};

export const getTreatment = (label: string): TreatmentData => {
    return TREATMENTS[label] || TREATMENTS['unknown'];
};
