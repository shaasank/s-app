# Farmer App - Rice Leaf Disease Severity Detector

Offline Android app built with Expo React Native and ONNX Runtime.

## Prerequisites

1.  **Node.js** and **npm** installed.
2.  **Android Studio** set up with an Android Emulator or a physical device connected via USB debugging.
3.  **Place your ONNX model**:
    *   Rename your ONNX model file to `leaf_classifier.onnx`.
    *   Place it in the `assets/` directory of this project.

## Installation

```bash
# Install dependencies
npm install
```

## Running the App

Since this app uses `onnxruntime-react-native`, it includes native code that is **not supported in Expo Go**. You must build a development build or run it locally using `prebuild`.

```bash
# 1. Generate native android folders
npx expo prebuild

# 2. Run on Android Emulator or Device
npx expo run:android
```

## Troubleshooting

*   **Model not found**: Ensure `leaf_classifier.onnx` is exactly the filename in `assets/`.
*   **ONNX Runtime Error**: Make sure you are NOT using Expo Go. Use `npx expo run:android`.

## Project Structure

*   `app/`: UI Screens (Home, Camera, Result).
*   `src/services/onnxService.ts`: Loads model and runs inference.
*   `src/utils/imageProcessing.ts`: Resizes and normalizes image to Tensor.
*   `assets/`: Place your `.onnx` model here.
"# s-app" 
