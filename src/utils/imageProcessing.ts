import { decode } from 'jpeg-js';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';

export async function imageToTensor(uri: string): Promise<Float32Array> {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
    });

    // Decode the JPEG
    const buffer = Buffer.from(base64, 'base64');
    const rawData = decode(buffer, { useTArray: true }); // returns { width, height, data } where data is Uint8Array used as a buffer

    const { width, height, data } = rawData;

    // We assume the image is already resized to 224x224 by the caller (Camera or ImageManipulator)
    // Target dimensions
    const dims = [1, 3, 224, 224];
    const float32Data = new Float32Array(3 * 224 * 224);

    // Normalization constants
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];

    // Loop through pixels
    // data is [r, g, b, a, r, g, b, a, ...] (row-major)
    // We want planar [1, 3, 224, 224] -> Red plane, Green plane, Blue plane

    for (let i = 0; i < 224 * 224; i++) {
        const r = data[i * 4 + 0] / 255.0;
        const g = data[i * 4 + 1] / 255.0;
        const b = data[i * 4 + 2] / 255.0;

        // Normalize and assign to NCHW layout
        // Red channel
        float32Data[0 * 224 * 224 + i] = (r - mean[0]) / std[0];
        // Green channel
        float32Data[1 * 224 * 224 + i] = (g - mean[1]) / std[1];
        // Blue channel
        float32Data[2 * 224 * 224 + i] = (b - mean[2]) / std[2];
    }

    return float32Data;
}
