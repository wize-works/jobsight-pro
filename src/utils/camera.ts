/**
 * Camera Utility for Media Capture
 * 
 * Provides enhanced camera functionality for capturing photos and videos
 * with support for different camera modes, quality settings, and geolocation.
 */

export interface CameraCapabilities {
    hasCamera: boolean;
    hasFrontCamera: boolean;
    hasBackCamera: boolean;
    supportsVideoRecording: boolean;
    supportsPhotos: boolean;
    maxResolution: { width: number; height: number } | null;
}

export interface CameraSettings {
    facingMode: 'user' | 'environment';
    width?: number;
    height?: number;
    quality?: number; // 0-1 for compression
    format?: 'jpeg' | 'png' | 'webp';
    includeLocation?: boolean;
}

export interface CaptureResult {
    file: File;
    blob: Blob;
    dataUrl: string;
    metadata: {
        width: number;
        height: number;
        size: number;
        type: string;
        timestamp: string;
        location?: {
            latitude: number;
            longitude: number;
            accuracy?: number;
        };
    };
}

export class CameraUtility {
    private static instance: CameraUtility;
    private stream: MediaStream | null = null;
    private video: HTMLVideoElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private capabilities: CameraCapabilities | null = null;

    private constructor() {
        this.canvas = document.createElement('canvas');
    }

    static getInstance(): CameraUtility {
        if (!CameraUtility.instance) {
            CameraUtility.instance = new CameraUtility();
        }
        return CameraUtility.instance;
    }

    /**
     * Check camera capabilities
     */
    async checkCapabilities(): Promise<CameraCapabilities> {
        if (this.capabilities) {
            return this.capabilities;
        }

        const capabilities: CameraCapabilities = {
            hasCamera: false,
            hasFrontCamera: false,
            hasBackCamera: false,
            supportsVideoRecording: false,
            supportsPhotos: false,
            maxResolution: null
        };

        try {
            // Check if MediaDevices API is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.capabilities = capabilities;
                return capabilities;
            }

            // Get available devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            capabilities.hasCamera = videoDevices.length > 0;
            capabilities.supportsPhotos = capabilities.hasCamera;
            capabilities.supportsVideoRecording = capabilities.hasCamera;

            // Check for front and back cameras
            for (const device of videoDevices) {
                const label = device.label.toLowerCase();
                if (label.includes('front') || label.includes('user')) {
                    capabilities.hasFrontCamera = true;
                }
                if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
                    capabilities.hasBackCamera = true;
                }
            }

            // If we can't determine from labels, assume at least one camera type
            if (videoDevices.length > 0 && !capabilities.hasFrontCamera && !capabilities.hasBackCamera) {
                capabilities.hasBackCamera = true; // Default assumption
                if (videoDevices.length > 1) {
                    capabilities.hasFrontCamera = true;
                }
            }

            // Try to get max resolution (this is approximate)
            if (capabilities.hasCamera) {
                try {
                    const testStream = await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 4096 }, height: { ideal: 4096 } }
                    });

                    const track = testStream.getVideoTracks()[0];
                    const settings = track.getSettings();

                    if (settings.width && settings.height) {
                        capabilities.maxResolution = {
                            width: settings.width,
                            height: settings.height
                        };
                    }

                    // Clean up test stream
                    testStream.getTracks().forEach(track => track.stop());
                } catch (error) {
                    // If high resolution fails, try standard resolution
                    capabilities.maxResolution = { width: 1920, height: 1080 };
                }
            }

        } catch (error) {
            console.error('Error checking camera capabilities:', error);
        }

        this.capabilities = capabilities;
        return capabilities;
    }

    /**
     * Start camera stream
     */
    async startCamera(settings: CameraSettings): Promise<HTMLVideoElement> {
        try {
            // Stop any existing stream
            await this.stopCamera();

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: settings.facingMode,
                    width: settings.width ? { ideal: settings.width } : { ideal: 1920 },
                    height: settings.height ? { ideal: settings.height } : { ideal: 1080 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);

            this.video = document.createElement('video');
            this.video.srcObject = this.stream;
            this.video.autoplay = true;
            this.video.muted = true;
            this.video.playsInline = true; // Important for mobile Safari

            return new Promise((resolve, reject) => {
                if (!this.video) {
                    reject(new Error('Video element not created'));
                    return;
                }

                this.video.onloadedmetadata = () => {
                    resolve(this.video!);
                };

                this.video.onerror = (error) => {
                    reject(error);
                };
            });

        } catch (error) {
            console.error('Error starting camera:', error);
            throw new Error('Failed to access camera. Please check permissions.');
        }
    }

    /**
     * Capture photo from current stream
     */
    async capturePhoto(settings: CameraSettings): Promise<CaptureResult> {
        if (!this.video || !this.stream || !this.canvas) {
            throw new Error('Camera not started');
        }

        const video = this.video;
        const canvas = this.canvas;

        // Set canvas size to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas context not available');
        }

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0);

        // Get location if requested
        let location: { latitude: number; longitude: number; accuracy?: number } | undefined;
        if (settings.includeLocation) {
            location = await this.getCurrentLocation();
        }

        // Convert to blob with specified format and quality
        const blob = await new Promise<Blob>((resolve, reject) => {
            const format = `image/${settings.format || 'jpeg'}`;
            const quality = settings.quality || 0.8;

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create blob from canvas'));
                }
            }, format, quality);
        });

        // Create file
        const timestamp = new Date().toISOString();
        const extension = settings.format || 'jpeg';
        const filename = `photo_${Date.now()}.${extension}`;
        const file = new File([blob], filename, { type: blob.type });

        // Create data URL
        const dataUrl = canvas.toDataURL(`image/${settings.format || 'jpeg'}`, settings.quality || 0.8);

        return {
            file,
            blob,
            dataUrl,
            metadata: {
                width: canvas.width,
                height: canvas.height,
                size: blob.size,
                type: blob.type,
                timestamp,
                location
            }
        };
    }

    /**
     * Stop camera stream
     */
    async stopCamera(): Promise<void> {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.video) {
            this.video.srcObject = null;
            this.video = null;
        }
    }

    /**
     * Switch camera (front/back)
     */
    async switchCamera(currentFacingMode: 'user' | 'environment'): Promise<'user' | 'environment'> {
        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

        const capabilities = await this.checkCapabilities();

        // Check if the desired camera is available
        if (newFacingMode === 'user' && !capabilities.hasFrontCamera) {
            throw new Error('Front camera not available');
        }
        if (newFacingMode === 'environment' && !capabilities.hasBackCamera) {
            throw new Error('Back camera not available');
        }

        return newFacingMode;
    }

    /**
     * Get current location
     */
    private async getCurrentLocation(): Promise<{ latitude: number; longitude: number; accuracy?: number } | undefined> {
        if (!navigator.geolocation) {
            return undefined;
        }

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                });
            });

            return {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
        } catch (error) {
            console.log('Could not get location:', error);
            return undefined;
        }
    }

    /**
     * Get optimal settings for device
     */
    async getOptimalSettings(preferredFacingMode: 'user' | 'environment' = 'environment'): Promise<CameraSettings> {
        const capabilities = await this.checkCapabilities();

        // Default settings
        const settings: CameraSettings = {
            facingMode: preferredFacingMode,
            width: 1920,
            height: 1080,
            quality: 0.8,
            format: 'jpeg',
            includeLocation: true
        };

        // Adjust based on capabilities
        if (!capabilities.hasCamera) {
            throw new Error('No camera available');
        }

        // Check facing mode availability
        if (preferredFacingMode === 'user' && !capabilities.hasFrontCamera) {
            settings.facingMode = 'environment';
        } else if (preferredFacingMode === 'environment' && !capabilities.hasBackCamera) {
            settings.facingMode = 'user';
        }

        // Adjust resolution based on max capabilities
        if (capabilities.maxResolution) {
            // Use 80% of max resolution for better performance
            settings.width = Math.min(1920, Math.floor(capabilities.maxResolution.width * 0.8));
            settings.height = Math.min(1080, Math.floor(capabilities.maxResolution.height * 0.8));
        }

        // Check if it's a mobile device (adjust quality for mobile)
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            settings.quality = 0.7; // Lower quality for mobile to save bandwidth
            settings.width = Math.min(settings.width || 1920, 1280);
            settings.height = Math.min(settings.height || 1080, 720);
        }

        return settings;
    }

    /**
     * Create file picker as fallback
     */
    async openFilePicker(accept: string = 'image/*'): Promise<File | null> {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;
            input.multiple = false;

            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                resolve(file || null);
            };

            input.oncancel = () => {
                resolve(null);
            };

            input.click();
        });
    }

    /**
     * Check if device supports camera
     */
    static async isCameraSupported(): Promise<boolean> {
        try {
            const instance = CameraUtility.getInstance();
            const capabilities = await instance.checkCapabilities();
            return capabilities.hasCamera;
        } catch (error) {
            return false;
        }
    }

    /**
     * Request camera permissions
     */
    static async requestCameraPermission(): Promise<boolean> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Camera permission denied:', error);
            return false;
        }
    }
}

// Export singleton instance
export const cameraUtil = CameraUtility.getInstance();
