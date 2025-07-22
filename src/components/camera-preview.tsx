"use client";

import React, { useEffect, useRef } from 'react';
import { UseCamera, CaptureOptions } from '@/hooks/useCamera';

interface CameraPreviewProps {
    camera: UseCamera;
    onCapture?: (file: File) => void;
    onClose?: () => void;
    captureOptions?: CaptureOptions;
    className?: string;
    showControls?: boolean;
    fullscreen?: boolean;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
    camera,
    onCapture,
    onClose,
    captureOptions = {},
    className = '',
    showControls = true,
    fullscreen = false
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Set up video stream when component mounts or stream changes
    useEffect(() => {
        if (videoRef.current && camera.stream) {
            videoRef.current.srcObject = camera.stream;
        }
    }, [camera.stream]);

    // Handle photo capture
    const handleCapture = async () => {
        try {
            const file = await camera.capturePhoto(captureOptions);
            if (onCapture) {
                onCapture(file);
            }
        } catch (error) {
            console.error('Failed to capture photo:', error);
        }
    };

    // Handle camera switch
    const handleSwitchCamera = async () => {
        try {
            await camera.switchCamera();
        } catch (error) {
            console.error('Failed to switch camera:', error);
        }
    };

    if (!camera.isActive) {
        return (
            <div className={`flex items-center justify-center bg-base-200 rounded-lg ${className}`}>
                <div className="text-center p-8">
                    <i className="fas fa-camera text-4xl text-base-content/30 mb-4"></i>
                    <p className="text-base-content/60">Camera not active</p>
                </div>
            </div>
        );
    }

    const containerClasses = fullscreen
        ? "fixed inset-0 z-50 bg-black"
        : `relative bg-black rounded-lg overflow-hidden ${className}`;

    return (
        <div className={containerClasses}>
            {/* Video Preview */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }} // Mirror for natural selfie view
            />

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Loading overlay during capture */}
            {camera.isCapturing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                        <span className="loading loading-spinner loading-sm"></span>
                        <span className="text-sm font-medium">Capturing...</span>
                    </div>
                </div>
            )}

            {/* Error overlay */}
            {camera.error && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-error text-error-content rounded-lg p-4 max-w-md text-center">
                        <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
                        <p className="font-medium mb-2">Camera Error</p>
                        <p className="text-sm opacity-90">{camera.error}</p>
                    </div>
                </div>
            )}

            {/* Controls */}
            {showControls && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-center gap-4">
                        {/* Close button (fullscreen only) */}
                        {fullscreen && onClose && (
                            <button
                                type="button"
                                className="btn btn-circle btn-ghost text-white hover:bg-white/20"
                                onClick={onClose}
                                title="Close camera"
                            >
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        )}

                        {/* Switch camera button */}
                        {camera.capabilities?.hasMultipleCameras && (
                            <button
                                type="button"
                                className="btn btn-circle btn-ghost text-white hover:bg-white/20"
                                onClick={handleSwitchCamera}
                                disabled={camera.isCapturing}
                                title="Switch camera"
                            >
                                <i className="fas fa-sync-alt text-lg"></i>
                            </button>
                        )}

                        {/* Capture button */}
                        <button
                            type="button"
                            className="btn btn-circle btn-lg bg-white hover:bg-white/90 text-black border-4 border-white/50"
                            onClick={handleCapture}
                            disabled={camera.isCapturing}
                            title="Take photo"
                        >
                            {camera.isCapturing ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                <i className="fas fa-camera text-xl"></i>
                            )}
                        </button>

                        {/* Settings placeholder */}
                        <button
                            type="button"
                            className="btn btn-circle btn-ghost text-white hover:bg-white/20"
                            disabled
                            title="Camera settings (coming soon)"
                        >
                            <i className="fas fa-cog text-lg"></i>
                        </button>
                    </div>

                    {/* Camera info */}
                    <div className="text-center mt-3">
                        <p className="text-white/80 text-xs">
                            Tap the camera button or press spacebar to capture
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CameraPreview;
