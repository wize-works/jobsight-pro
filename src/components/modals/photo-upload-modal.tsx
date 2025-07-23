"use client"

import { useState, useRef, useEffect } from 'react';

interface PhotoUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPhotoCapture?: (photoData: {
        file: File;
        preview: string;
        description?: string;
        context?: {
            type: 'project' | 'client' | 'equipment' | 'dailylog' | 'general';
            id?: string;
            name?: string;
        };
    }) => void;
    // Optional context for automatic linking
    context?: {
        type: 'project' | 'client' | 'equipment' | 'dailylog' | 'general';
        id?: string;
        name?: string;
    };
}

export default function PhotoUploadModal({ isOpen, onClose, onPhotoCapture, context }: PhotoUploadModalProps) {
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [uploadMethod, setUploadMethod] = useState<'camera' | 'file' | null>(null);
    const [cameraSupported, setCameraSupported] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [photoDescription, setPhotoDescription] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Check camera support when modal opens
    useEffect(() => {
        const checkCameraSupport = async () => {
            if (!isOpen) return;

            try {
                // Check basic API support
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    console.log('Camera API not supported');
                    setCameraSupported(false);
                    return;
                }

                // Check if we're on HTTPS (required for camera access, except localhost)
                const isSecure = location.protocol === 'https:' ||
                    location.hostname === 'localhost' ||
                    location.hostname === '127.0.0.1';

                if (!isSecure) {
                    console.log('Camera requires HTTPS connection');
                    setCameraSupported(false);
                    return;
                }

                // Check permission status if available
                if ('permissions' in navigator) {
                    try {
                        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
                        console.log('Camera permission status:', permissionStatus.state);

                        if (permissionStatus.state === 'denied') {
                            console.log('Camera permission denied by user');
                            setCameraSupported(false);
                            return;
                        }
                    } catch (permError) {
                        console.log('Could not check camera permission status:', permError);
                        // Continue anyway - not all browsers support permission queries
                    }
                }

                // Check if any video input devices are available
                // Note: Device labels may be empty until permission is granted
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');

                if (videoDevices.length === 0) {
                    console.log('No video input devices found');
                    setCameraSupported(false);
                    return;
                }

                setCameraSupported(true);
            } catch (error) {
                console.error('Error checking camera support:', error);
                setCameraSupported(false);
            }
        };

        if (isOpen) {
            checkCameraSupport();
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

            console.log('Starting camera initialization...');

            // First check if mediaDevices is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }

            console.log('MediaDevices API available');
            console.log('Current location:', {
                protocol: location.protocol,
                hostname: location.hostname,
                secure: location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
            });

            // Request camera access with simplified constraints
            let stream: MediaStream;
            try {
                console.log('Attempting to access back camera...');
                // Try with back camera first
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                });
                console.log('Back camera stream obtained successfully');
            } catch (backCameraError) {
                console.log('Back camera failed:', backCameraError);
                try {
                    console.log('Attempting to access front camera...');
                    // Try front camera
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            facingMode: 'user',
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        },
                        audio: false
                    });
                    console.log('Front camera stream obtained successfully');
                } catch (frontCameraError) {
                    console.log('Front camera failed, trying any camera:', frontCameraError);
                    // Fallback to any available camera
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false
                    });
                    console.log('Any camera stream obtained successfully');
                    console.log('Any camera stream obtained');
                }
            }

            // Log stream details
            const videoTrack = stream.getVideoTracks()[0];

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                // Wait for video to be ready and play
                await new Promise<void>((resolve, reject) => {
                    const video = videoRef.current!;

                    const handleCanPlay = () => {
                        video.removeEventListener('canplay', handleCanPlay);
                        video.removeEventListener('error', handleError);

                        video.play().then(() => {
                            video.style.opacity = '1';
                            resolve();
                        }).catch((playError) => {
                            console.error('Video play failed:', playError);
                            reject(playError);
                        });
                    };

                    const handleError = (error: Event) => {
                        console.error('Video loading error:', error);
                        video.removeEventListener('canplay', handleCanPlay);
                        video.removeEventListener('error', handleError);
                        reject(error);
                    };

                    video.addEventListener('canplay', handleCanPlay);
                    video.addEventListener('error', handleError);

                    // Also check if video is already ready
                    if (video.readyState >= 3) { // HAVE_FUTURE_DATA
                        console.log('Video already ready, playing now');
                        handleCanPlay();
                    }

                    // Timeout after 10 seconds
                    setTimeout(() => {
                        video.removeEventListener('canplay', handleCanPlay);
                        video.removeEventListener('error', handleError);
                        reject(new Error('Video loading timeout'));
                    }, 10000);
                });
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            console.error('Error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : 'No stack trace'
            });

            setIsCapturing(false);
            setUploadMethod(null);
            setCameraSupported(false);

            // Provide more specific error messages
            let errorMessage = 'Unable to access camera. ';
            let actionMessage = '';

            if (error instanceof Error) {
                console.log('Processing error type:', error.name);
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    errorMessage += 'Camera permission was denied.';
                    actionMessage = 'To fix this:\n1. Look for a camera icon in your browser\'s address bar and click it\n2. Or go to your browser settings and allow camera access for this site\n3. Then refresh the page and try again';
                } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                    errorMessage += 'No camera found on this device.';
                    actionMessage = 'Please make sure:\n1. Your camera is connected and working\n2. No other applications are using the camera\n3. Your camera drivers are installed';
                } else if (error.name === 'NotSupportedError') {
                    errorMessage += 'Camera is not supported in this browser.';
                    actionMessage = 'Try using a modern browser like Chrome, Firefox, or Edge';
                } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                    errorMessage += 'Camera is already in use by another application.';
                    actionMessage = 'Please close other applications that might be using your camera (like Zoom, Teams, Skype, etc.) and try again';
                } else if (error.message.includes('not supported')) {
                    errorMessage += 'Camera API not supported in this browser.';
                    actionMessage = 'Make sure you\'re using HTTPS or try a different browser';
                } else {
                    errorMessage += error.message;
                }
            }

            // Check if we're on HTTP (not HTTPS)
            if (location.protocol === 'http:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                errorMessage += '\n\nCamera access requires a secure connection (HTTPS).';
                actionMessage = 'Please access this site using HTTPS or contact your administrator.';
            }

            errorMessage += '\n\nYou can try uploading a file instead.';
            if (actionMessage) {
                errorMessage += '\n\n' + actionMessage;
            }

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

                // Call the parent callback with the file data
                onPhotoCapture?.({
                    file,
                    preview: capturedPhoto,
                    description: photoDescription.trim() || undefined,
                    context: context || { type: 'general' }
                });

                // Close modal - parent will handle the upload
                handleClose();
            } catch (error) {
                console.error('Error saving photo:', error);
                alert('Error preparing photo for upload. Please try again.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleClose = () => {
        stopCamera();
        setCapturedPhoto(null);
        setUploadMethod(null);
        setPhotoDescription('');
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
                                {context?.name ? `Capture a photo for ${context.name}` : "Capture or upload a photo for your project"}
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
                <div className="flex-1 overflow-hidden">
                    {isLoading && (!isCapturing || !cameraSupported) ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="text-center">
                                <span className="loading loading-spinner loading-lg text-primary"></span>
                                <p className="mt-2 text-sm text-base-content/70">
                                    {isCapturing ? 'Starting camera...' : 'Saving photo...'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            {!cameraSupported && !capturedPhoto && (
                                <div className="flex-1 flex items-center justify-center p-4">
                                    <div className="card bg-warning/10 border border-warning/20 max-w-md">
                                        <div className="card-body p-4">
                                            <div className="alert alert-warning shadow-sm">
                                                <i className="fas fa-exclamation-triangle text-warning"></i>
                                                <div>
                                                    <h4 className="font-semibold">Camera Not Available</h4>
                                                    <p className="text-sm opacity-80">
                                                        Camera may not be supported, permission denied, or not available.
                                                    </p>
                                                    <details className="mt-2">
                                                        <summary className="text-xs cursor-pointer text-warning hover:underline">
                                                            Why might this happen?
                                                        </summary>
                                                        <div className="text-xs mt-1 opacity-70">
                                                            • Browser blocked camera access<br />
                                                            • Site needs HTTPS connection<br />
                                                            • Camera in use by another app<br />
                                                            • No camera device found
                                                        </div>
                                                    </details>
                                                </div>
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                <button
                                                    className="btn btn-outline btn-sm w-full gap-2"
                                                    onClick={() => {
                                                        setCameraSupported(true);
                                                        // This will re-run the camera support check and potentially trigger permission request
                                                    }}
                                                    disabled={isLoading}
                                                >
                                                    <i className="fas fa-refresh"></i>
                                                    Try Camera Again
                                                </button>
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
                                </div>
                            )}

                            {!isCapturing && cameraSupported && !capturedPhoto && (
                                <div className="flex-1 flex items-center justify-center p-4">
                                    <div className="text-center">
                                        <div className="mb-4">
                                            <i className="fas fa-camera text-6xl text-primary mb-4"></i>
                                            <h3 className="text-xl font-semibold mb-2">Ready to Take Photo</h3>
                                            <p className="text-base-content/70">Click the button below to start your camera</p>
                                        </div>
                                        <button
                                            className="btn btn-primary btn-lg gap-2"
                                            onClick={startCamera}
                                            disabled={isLoading}
                                        >
                                            <i className="fas fa-camera"></i>
                                            Start Camera
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isCapturing && cameraSupported && (
                                <div className="flex-1 bg-black relative overflow-hidden">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        playsInline
                                        style={{
                                            minHeight: '100%',
                                            backgroundColor: '#000',
                                            display: 'block'
                                        }}
                                        onLoadedMetadata={() => {
                                            console.log('Video metadata loaded - dimensions:', {
                                                videoWidth: videoRef.current?.videoWidth,
                                                videoHeight: videoRef.current?.videoHeight,
                                                clientWidth: videoRef.current?.clientWidth,
                                                clientHeight: videoRef.current?.clientHeight
                                            });
                                        }}
                                        onPlay={() => {
                                            console.log('Video started playing');
                                        }}
                                        onError={(e) => {
                                            console.error('Video element error:', e);
                                        }}
                                    />
                                    {/* Loading overlay while camera initializes */}
                                    {isLoading && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
                            )}

                            {capturedPhoto && (
                                <div className="flex-1 flex items-center justify-center p-4">
                                    <div className="w-full max-w-2xl">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <i className="far fa-image text-primary"></i>
                                            Photo Preview
                                        </h3>
                                        <div className="bg-black rounded-lg p-4 text-center mb-4">
                                            <img
                                                src={capturedPhoto}
                                                alt="Captured photo preview"
                                                className="max-w-full max-h-96 object-contain rounded-lg mx-auto"
                                                onLoad={() => console.log('Photo preview loaded successfully')}
                                                onError={(e) => {
                                                    console.error('Error loading photo preview:', e);
                                                }}
                                            />
                                        </div>

                                        {/* Photo description input */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-base-content">
                                                <i className="far fa-edit mr-2"></i>
                                                Photo Description (Optional)
                                            </label>
                                            <textarea
                                                value={photoDescription}
                                                onChange={(e) => setPhotoDescription(e.target.value)}
                                                className="textarea textarea-bordered w-full"
                                                placeholder="Add a description for this photo..."
                                                rows={3}
                                                maxLength={500}
                                                disabled={isLoading}
                                            />
                                            <div className="text-xs text-base-content/60 text-right">
                                                {photoDescription.length}/500 characters
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
