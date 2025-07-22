"use client";

import { useState, useRef, useCallback } from 'react';

export interface CameraCapabilities {
    hasCamera: boolean;
    hasMultipleCameras: boolean;
    supportsFacingMode: boolean;
    maxResolution?: { width: number; height: number };
}

export interface CaptureOptions {
    facingMode?: 'user' | 'environment';
    width?: number;
    height?: number;
    quality?: number; // 0-1 for JPEG quality
    format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface UseCamera {
    // State
    stream: MediaStream | null;
    isActive: boolean;
    isCapturing: boolean;
    error: string | null;
    capabilities: CameraCapabilities | null;

    // Actions
    startCamera: (options?: CaptureOptions) => Promise<void>;
    stopCamera: () => void;
    capturePhoto: (options?: CaptureOptions) => Promise<File>;
    switchCamera: () => Promise<void>;

    // Utility
    checkCameraSupport: () => Promise<CameraCapabilities>;
}

export const useCamera = (): UseCamera => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [capabilities, setCapabilities] = useState<CameraCapabilities | null>(null);
    const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment');

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Check camera support and capabilities
    const checkCameraSupport = useCallback(async (): Promise<CameraCapabilities> => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return {
                    hasCamera: false,
                    hasMultipleCameras: false,
                    supportsFacingMode: false
                };
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            const caps: CameraCapabilities = {
                hasCamera: videoDevices.length > 0,
                hasMultipleCameras: videoDevices.length > 1,
                supportsFacingMode: videoDevices.length > 1
            };

            setCapabilities(caps);
            return caps;
        } catch (err) {
            console.error('Error checking camera support:', err);
            const caps: CameraCapabilities = {
                hasCamera: false,
                hasMultipleCameras: false,
                supportsFacingMode: false
            };
            setCapabilities(caps);
            return caps;
        }
    }, []);

    // Start camera with specified options
    const startCamera = useCallback(async (options: CaptureOptions = {}) => {
        try {
            setError(null);
            setIsActive(false);

            // Check camera support first
            const caps = await checkCameraSupport();
            if (!caps.hasCamera) {
                throw new Error('No camera devices found');
            }

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: options.facingMode || currentFacingMode,
                    width: options.width ? { ideal: options.width } : { ideal: 1280 },
                    height: options.height ? { ideal: options.height } : { ideal: 720 }
                },
                audio: false
            };

            let mediaStream: MediaStream;

            try {
                // Try with specified facing mode
                mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (facingModeError) {
                // Fallback: try without facing mode constraint
                const fallbackConstraints = {
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                };
                mediaStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
            }

            setStream(mediaStream);
            setIsActive(true);
            setCurrentFacingMode(options.facingMode || currentFacingMode);

            // If video ref is available, set the stream
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to start camera';
            setError(errorMessage);
            setIsActive(false);
            console.error('Error starting camera:', err);
            throw new Error(errorMessage);
        }
    }, [currentFacingMode, checkCameraSupport]);

    // Stop camera and cleanup
    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsActive(false);
        setError(null);

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, [stream]);

    // Capture photo from current stream
    const capturePhoto = useCallback(async (options: CaptureOptions = {}): Promise<File> => {
        if (!stream || !isActive) {
            throw new Error('Camera is not active');
        }

        setIsCapturing(true);

        try {
            // Create video element if not using ref
            const video = videoRef.current || document.createElement('video');
            if (!videoRef.current) {
                video.srcObject = stream;
                video.play();
                await new Promise(resolve => {
                    video.onloadedmetadata = resolve;
                });
            }

            // Create canvas for capture
            const canvas = canvasRef.current || document.createElement('canvas');
            const context = canvas.getContext('2d');

            if (!context) {
                throw new Error('Failed to get canvas context');
            }

            // Set canvas dimensions to video dimensions
            canvas.width = video.videoWidth || options.width || 1280;
            canvas.height = video.videoHeight || options.height || 720;

            // Draw video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert canvas to blob
            const quality = options.quality || 0.8;
            const format = options.format || 'image/jpeg';

            return new Promise((resolve, reject) => {
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to capture photo'));
                            return;
                        }

                        // Create file from blob
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        const extension = format.split('/')[1];
                        const filename = `photo-${timestamp}.${extension}`;

                        const file = new File([blob], filename, {
                            type: format,
                            lastModified: Date.now()
                        });

                        resolve(file);
                    },
                    format,
                    quality
                );
            });

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to capture photo';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsCapturing(false);
        }
    }, [stream, isActive]);

    // Switch between front and back camera
    const switchCamera = useCallback(async () => {
        if (!capabilities?.hasMultipleCameras) {
            throw new Error('Device does not have multiple cameras');
        }

        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

        // Stop current stream
        stopCamera();

        // Start with new facing mode
        await startCamera({ facingMode: newFacingMode });
    }, [capabilities, currentFacingMode, stopCamera, startCamera]);

    return {
        // State
        stream,
        isActive,
        isCapturing,
        error,
        capabilities,

        // Actions
        startCamera,
        stopCamera,
        capturePhoto,
        switchCamera,

        // Utility
        checkCameraSupport
    };
};
