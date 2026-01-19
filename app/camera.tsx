import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImageManipulator from 'expo-image-manipulator';

export default function CameraScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const router = useRouter();
    const [processing, setProcessing] = useState(false);

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current && !processing) {
            setProcessing(true);
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                });

                if (photo) {
                    // Resize to 224x224 immediately to save processing time later
                    const manipResult = await ImageManipulator.manipulateAsync(
                        photo.uri,
                        [{ resize: { width: 224, height: 224 } }],
                        { format: ImageManipulator.SaveFormat.JPEG }
                    );

                    // Navigate to result screen with the image URI
                    // We Encode URI component just in case
                    router.replace({
                        pathname: '/result',
                        params: { imageUri: manipResult.uri }
                    });
                }
            } catch (error) {
                console.error("Failed to take picture or process", error);
                setProcessing(false);
            }
        }
    };

    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} ref={cameraRef} facing="back">
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.captureButton} onPress={takePicture} disabled={processing}>
                        {processing ? (
                            <ActivityIndicator size="large" color="#4CAF50" />
                        ) : (
                            <View style={styles.captureInner} />
                        )}
                    </TouchableOpacity>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'black',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
        color: 'white',
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        margin: 64,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
    },
});
