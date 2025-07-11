"use client"

import { useState, useRef, useEffect } from 'react';

interface PhotoUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPhotoCapture?: (photoData: { file: File; preview: string }) => void;
}

export default function PhotoUploadModal({ isOpen, onClose, onPhotoCapture }: PhotoUploadModalProps) {
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [uploadMethod, setUploadMethod] = useState<'camera' | 'file' | null>(null);
    const [cameraSupported, setCameraSupported] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Check camera support and auto-start camera when modal opens
    useEffect(() => {
        const initializeCamera = async () => {
            if (!isOpen) return;

            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    console.log('Camera API not supported');
                    setCameraSupported(false);
                    return;
                }

                // Check if any video input devices are available
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                console.log('Available video devices:', videoDevices.length);

                if (videoDevices.length === 0) {
                    console.log('No video input devices found');
                    setCameraSupported(false);
                    return;
                }

                // Auto-start camera
                console.log('Initializing camera...');
                await startCamera();
            } catch (error) {
                console.error('Error checking camera support:', error);
                setCameraSupported(false);
            }
        };

        if (isOpen) {
            initializeCamera();
        } else {
            // Clean up when modal closes
            console.log('Modal closed, cleaning up camera');
            stopCamera();
            setCapturedPhoto(null);
            setUploadMethod(null);
        }
    }, [isOpen]);

    const startCamera = async () => {
        try {
            setIsLoading(true);
            setIsCapturing(true);
            setUploadMethod('camera');

            // First check if mediaDevices is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }

            // Check current permissions
            try {
                const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
                // Only log permission status in development
                if (process.env.NODE_ENV === 'development') {
                    console.log('Camera permission status:', permission.state);
                }
            } catch (e) {
                // Permission API not supported, proceed with camera request
            }

            // Request camera access with mobile-optimized settings
            let stream: MediaStream;
            try {
                // Try with back camera first with specific constraints for mobile
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment', // Prefer back camera
                        width: { ideal: 1920, max: 1920 },
                        height: { ideal: 1080, max: 1080 },
                        frameRate: { ideal: 30, max: 30 }
                    }
                });
            } catch (backCameraError) {
                console.log('Back camera not available, trying front camera');
                try {
                    // Try front camera
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            facingMode: 'user',
                            width: { ideal: 1920, max: 1920 },
                            height: { ideal: 1080, max: 1080 },
                            frameRate: { ideal: 30, max: 30 }
                        }
                    });
                } catch (frontCameraError) {
                    // Fallback to any available camera with basic constraints
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            width: { ideal: 640, max: 1920 },
                            height: { ideal: 480, max: 1080 }
                        }
                    });
                }
            }

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                // Wait for video to load metadata
                await new Promise((resolve, reject) => {
                    const video = videoRef.current!;

                    const handleLoadedMetadata = () => {
                        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                        video.removeEventListener('error', handleError);
                        resolve(void 0);
                    };

                    const handleError = (error: Event) => {
                        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                        video.removeEventListener('error', handleError);
                        reject(error);
                    };

                    video.addEventListener('loadedmetadata', handleLoadedMetadata);
                    video.addEventListener('error', handleError);
                });

                await videoRef.current.play();
                console.log('Camera started successfully');
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setIsCapturing(false);
            setUploadMethod(null);
            setCameraSupported(false);

            // Provide more specific error messages
            let errorMessage = 'Unable to access camera. ';
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    errorMessage += 'Camera permission was denied. Please allow camera access and try again.';
                } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                    errorMessage += 'No camera found on this device.';
                } else if (error.name === 'NotSupportedError') {
                    errorMessage += 'Camera is not supported in this browser.';
                } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                    errorMessage += 'Camera is already in use by another application.';
                } else if (error.message.includes('not supported')) {
                    errorMessage += 'Camera API not supported in this browser.';
                } else {
                    errorMessage += error.message;
                }
            }
            errorMessage += ' You can try uploading a file instead.';

            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) {
                console.error('Could not get canvas context');
                return;
            }

            // Set canvas dimensions to video dimensions
            canvas.width = video.videoWidth || video.clientWidth;
            canvas.height = video.videoHeight || video.clientHeight;

            // Ensure we have valid dimensions
            if (canvas.width === 0 || canvas.height === 0) {
                console.error('Invalid video dimensions');
                return;
            }

            try {
                // Clear canvas first
                context.clearRect(0, 0, canvas.width, canvas.height);

                // Draw the video frame to canvas (flip horizontally to match the mirrored video)
                context.save();
                context.scale(-1, 1);
                context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
                context.restore();

                // Convert to data URL with high quality
                const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);

                // Validate that we got a valid image
                if (photoDataUrl === 'data:,') {
                    console.error('Failed to capture photo data');
                    alert('Failed to capture photo. Please try again.');
                    return;
                }

                setCapturedPhoto(photoDataUrl);
                console.log('Photo captured successfully');

                // Stop the camera stream
                stopCamera();
            } catch (error) {
                console.error('Error capturing photo:', error);
                alert('Error capturing photo. Please try again.');
            }
        } else {
            console.error('Video or canvas reference not available');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCapturing(false);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setCapturedPhoto(e.target?.result as string);
                setUploadMethod('file');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSavePhoto = async () => {
        if (capturedPhoto) {
            try {
                setIsLoading(true);
                // Convert data URL to File object
                const response = await fetch(capturedPhoto);
                const blob = await response.blob();
                const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
                onPhotoCapture?.({ file, preview: capturedPhoto });
                handleClose();
            } catch (error) {
                console.error('Error saving photo:', error);
                alert('Error saving photo. Please try again.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleClose = () => {
        stopCamera();
        setCapturedPhoto(null);
        setUploadMethod(null);
        onClose();
    };

    const retakePhoto = () => {
        setCapturedPhoto(null);
        if (uploadMethod === 'camera') {
            startCamera();
        } else {
            setUploadMethod(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-3xl h-full p-0 rounded-lg flex flex-col" style={{ maxHeight: "90vh" }}>
                {/* Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">Take Photo</h2>
                            <p className="text-primary-content/80 text-sm mt-1">
                                Capture or upload a photo for your project
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            disabled={isLoading}
                            aria-label="Close modal"
                        >
                            <i className="far fa-times text-lg"></i>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 h-full " style={{ maxHeight: "calc(90vh - 145px)" }}>

                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="text-center">
                                <span className="loading loading-spinner loading-lg text-primary"></span>
                                <p className="mt-2 text-sm text-base-content/70">
                                    {isCapturing ? 'Starting camera...' : 'Saving photo...'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {!cameraSupported && !capturedPhoto && (
                                <div className="card bg-warning/10 border border-warning/20">
                                    <div className="card-body p-4">
                                        <div className="alert alert-warning shadow-sm">
                                            <i className="fas fa-exclamation-triangle text-warning"></i>
                                            <div>
                                                <h4 className="font-semibold">Camera Not Available</h4>
                                                <p className="text-sm opacity-80">Camera not supported or not available on this device. You can upload a file instead.</p>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <button
                                                className="btn btn-primary btn-lg w-full gap-2"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isLoading}
                                            >
                                                <i className="fas fa-upload"></i>
                                                Choose File Instead
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isCapturing && cameraSupported && (
                                <div className="card border border-base-300 shadow-sm">
                                    <div className="card-body p-4">
                                        <div className="relative rounded-lg bg-black min-h-[400px] flex items-center justify-center overflow-hidden">
                                            <video
                                                ref={videoRef}
                                                className="w-full h-full min-h-[400px] object-cover rounded-lg"
                                                autoPlay
                                                muted
                                                playsInline
                                                style={{
                                                    transform: 'scaleX(-1)', // Mirror the video for better UX
                                                    minHeight: '400px',
                                                    maxHeight: '600px'
                                                }}
                                            />
                                            {/* Loading overlay while camera initializes */}
                                            {isLoading && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                                    <div className="text-center text-white">
                                                        <span className="loading loading-spinner loading-lg"></span>
                                                        <p className="mt-2 text-sm">Starting camera...</p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                                                <button
                                                    className="btn btn-circle btn-primary btn-lg shadow-xl hover:scale-105 transition-transform"
                                                    onClick={capturePhoto}
                                                    disabled={isLoading}
                                                    aria-label="Capture photo"
                                                >
                                                    <i className="fas fa-camera text-xl"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {capturedPhoto && (
                                <div className="card bg-base-100 border border-base-300 shadow-sm">
                                    <div className="card-body p-4">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <i className="far fa-image text-primary"></i>
                                            Photo Preview
                                        </h3>

                                        <div className="text-center">
                                            <div className="relative inline-block">
                                                <img
                                                    src={capturedPhoto}
                                                    alt="Captured photo preview"
                                                    className="max-w-full max-h-80 object-contain rounded-lg mx-auto border shadow-sm"
                                                    style={{ minHeight: '200px' }}
                                                    onLoad={() => console.log('Photo preview loaded successfully')}
                                                    onError={(e) => {
                                                        console.error('Error loading photo preview:', e);
                                                        // Fallback display
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                                {/* Fallback for when image fails to load */}
                                                <div className="absolute inset-0 flex items-center justify-center bg-base-200 rounded-lg" style={{ display: 'none' }}>
                                                    <div className="text-center">
                                                        <i className="far fa-image text-4xl text-base-content/50 mb-2"></i>
                                                        <p className="text-sm text-base-content/70">Photo preview unavailable</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300 flex-shrink-0">
                    <div className="flex justify-end gap-3">
                        <button
                            className="btn btn-secondary gap-2"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                        >
                            <i className="fas fa-upload"></i>
                            Upload File Instead
                        </button>
                        <button
                            className="btn btn-outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>

                        {capturedPhoto && (
                            <>
                                <button
                                    className="btn btn-ghost gap-2"
                                    onClick={retakePhoto}
                                    disabled={isLoading}
                                >
                                    <i className="fas fa-redo"></i>
                                    Retake
                                </button>
                                <button
                                    className="btn btn-primary gap-2"
                                    onClick={handleSavePhoto}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="far fa-save"></i>
                                            Save Photo
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileUpload}
                    aria-label="Upload photo file"
                />

                {/* Hidden canvas for photo capture */}
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
}
