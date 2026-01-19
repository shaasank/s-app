import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { Asset } from 'expo-asset';
import { imageToTensor } from '../utils/imageProcessing';

const LABELS = [
    'severity_0',
    'severity_1',
    'severity_3',
    'severity_5',
    'severity_7',
    'severity_9',
    'unknown'
];

let session: InferenceSession | null = null;

export async function loadModel() {
    if (session) return;

    try {
        // Load the model asset
        // IMPORTANT: Make sure 'leaf_classifier.onnx' is in assets/ folder
        const modelAsset = Asset.fromModule(require('../../assets/leaf_classifier.onnx'));
        await modelAsset.downloadAsync();

        // Create inference session
        session = await InferenceSession.create(modelAsset.localUri || modelAsset.uri);
        console.log('Model loaded successfully');
    } catch (e) {
        console.error('Failed to load model', e);
        throw new Error('Model loading failed');
    }
}

export async function runInference(imageUri: string): Promise<{ label: string; confidence: number }> {
    if (!session) {
        throw new Error('Model not loaded');
    }

    try {
        // 1. Preprocess input
        const inputTensorData = await imageToTensor(imageUri);

        // 2. Create ONNX Tensor
        const inputTensor = new Tensor('float32', inputTensorData, [1, 3, 224, 224]);

        // 3. Run inference
        // Note: You need to know the input name of your ONNX model. 
        // Usually it is 'input' or 'input.1' or something similar.
        // For now we assume the model has one input and we use the first name we find or a standard name.
        const inputNames = session.inputNames;
        const inputName = inputNames[0];

        const feeds: Record<string, Tensor> = {};
        feeds[inputName] = inputTensor;

        const outputMap = await session.run(feeds);

        // 4. Get output
        const outputNames = session.outputNames;
        const outputName = outputNames[0];
        const outputTensor = outputMap[outputName];
        const outputData = outputTensor.data as Float32Array;

        // 5. Post-process (Argmax)
        let maxVal = -Infinity;
        let maxIdx = -1;

        // Assuming output is [1, 7]
        for (let i = 0; i < outputData.length; i++) {
            if (outputData[i] > maxVal) {
                maxVal = outputData[i];
                maxIdx = i;
            }
        }

        const predictedLabel = LABELS[maxIdx] || 'unknown';

        return {
            label: predictedLabel,
            confidence: maxVal // Note: This might be raw logit, not probability if softmax is not in the model.
        };

    } catch (e) {
        console.error('Inference failed', e);
        throw new Error('Inference failed');
    }
}
