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
                    setCameraSupported(false);
                    return;
                }

                // Check if any video input devices are available
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');

                if (videoDevices.length === 0) {
                    setCameraSupported(false);
                    return;
                }

                // Auto-start camera
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

            // Request camera access with fallback options
            let stream: MediaStream;
            try {
                // Try with back camera first
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment' // Prefer back camera for better quality
                    }
                });
            } catch (backCameraError) {
                // Fallback to any available camera
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true
                });
            }

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
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

            // Set canvas dimensions to video dimensions
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw the video frame to canvas
            context?.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to data URL
            const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedPhoto(photoDataUrl);

            // Stop the camera stream
            stopCamera();
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
            <div className="modal-box w-11/12 max-w-3xl p-0 rounded-lg flex flex-col" style={{ maxHeight: "90vh", height: "auto" }}>
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
                <div className="p-6 overflow-y-auto space-y-6" style={{ maxHeight: "calc(90vh - 145px)" }}>
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
                        <div className="card bg-base-100 border border-base-300 shadow-sm">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-camera text-primary"></i>
                                    Camera View
                                </h3>

                                <div className="relative bg-black rounded-lg overflow-hidden">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-80 object-cover"
                                        autoPlay
                                        muted
                                        playsInline
                                    />
                                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
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

                                <div className="flex justify-center gap-3 mt-4">
                                    <button
                                        className="btn btn-outline gap-2"
                                        onClick={stopCamera}
                                        disabled={isLoading}
                                    >
                                        <i className="fas fa-times"></i>
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-secondary gap-2"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLoading}
                                    >
                                        <i className="fas fa-upload"></i>
                                        Upload File Instead
                                    </button>
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
                                    <img
                                        src={capturedPhoto}
                                        alt="Captured photo preview"
                                        className="max-w-full h-80 object-cover rounded-lg mx-auto border shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <div className="text-center">
                                <span className="loading loading-spinner loading-lg text-primary"></span>
                                <p className="mt-2 text-sm text-base-content/70">
                                    {isCapturing ? 'Starting camera...' : 'Saving photo...'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300 flex-shrink-0">
                    <div className="flex justify-end gap-3">
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
