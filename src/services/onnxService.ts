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
let loadingPromise: Promise<void> | null = null;

export async function loadModel() {
    if (session) return;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        try {
            console.log('Loading model...');
            // Load the model asset
            const modelAsset = Asset.fromModule(require('../../assets/leaf_classifier.onnx'));
            await modelAsset.downloadAsync();

            if (!modelAsset.localUri && !modelAsset.uri) {
                throw new Error('Model asset URI is null');
            }

            // Create inference session
            // On Android, we might need to use the file:// URI explicitly if it's not handled automatically
            const uri = modelAsset.localUri || modelAsset.uri;

            session = await InferenceSession.create(uri);
            console.log('Model loaded successfully');
        } catch (e) {
            console.error('Failed to load model', e);
            throw e;
        } finally {
            loadingPromise = null;
        }
    })();

    return loadingPromise;
}

export async function runInference(imageUri: string): Promise<{ label: string; confidence: number }> {
    if (!session) {
        console.log('Session not ready, attempting to load...');
        await loadModel();
        if (!session) {
            throw new Error('Model failed to load');
        }
    }

    try {
        // 1. Preprocess input
        const inputTensorData = await imageToTensor(imageUri);

        // 2. Create ONNX Tensor
        const inputTensor = new Tensor('float32', inputTensorData, [1, 3, 224, 224]);

        // 3. Run inference
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

        for (let i = 0; i < outputData.length; i++) {
            if (outputData[i] > maxVal) {
                maxVal = outputData[i];
                maxIdx = i;
            }
        }

        const predictedLabel = LABELS[maxIdx] || 'unknown';

        return {
            label: predictedLabel,
            confidence: maxVal
        };

    } catch (e) {
        console.error('Inference failed', e);
        throw e;
    }
}
