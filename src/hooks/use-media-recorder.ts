"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseMediaRecorderState {
    isRecording: boolean;
    mediaBlob: Blob | null;
    error: string | null;
}

interface UseMediaRecorderOptions {
    audio?: boolean;
    video?: boolean;
    mimeType?: string;
    onDataAvailable?: (event: BlobEvent) => void;
    onStop?: (blob: Blob) => void;
    onError?: (error: Error) => void;
}

export function useMediaRecorder(options: UseMediaRecorderOptions = {}) {
    const [state, setState] = useState<UseMediaRecorderState>({
        isRecording: false,
        mediaBlob: null,
        error: null,
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const isMountedRef = useRef(true);

    const {
        audio = true,
        video = false,
        mimeType,
        onDataAvailable,
        onStop,
        onError,
    } = options;

    const cleanup = useCallback(() => {
        // Stop recording if active
        if (mediaRecorderRef.current && state.isRecording) {
            try {
                mediaRecorderRef.current.stop();
            } catch (error) {
                console.warn('Error stopping media recorder:', error);
            }
        }

        // Stop all media tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                try {
                    track.stop();
                } catch (error) {
                    console.warn('Error stopping media track:', error);
                }
            });
            streamRef.current = null;
        }

        mediaRecorderRef.current = null;
        chunksRef.current = [];

        if (isMountedRef.current) {
            setState(prev => ({ ...prev, isRecording: false }));
        }
    }, [state.isRecording]);

    const startRecording = useCallback(async () => {
        try {
            if (!isMountedRef.current) return;

            setState(prev => ({ ...prev, error: null }));

            // Request media stream
            const stream = await navigator.mediaDevices.getUserMedia({
                audio,
                video,
            });

            if (!isMountedRef.current) {
                // Component unmounted, clean up
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            streamRef.current = stream;
            chunksRef.current = [];

            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                ...(mimeType && { mimeType }),
            });

            mediaRecorderRef.current = mediaRecorder;

            // Set up event handlers
            mediaRecorder.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                    onDataAvailable?.(event);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: mimeType || 'audio/wav',
                });

                if (isMountedRef.current) {
                    setState(prev => ({
                        ...prev,
                        mediaBlob: blob,
                        isRecording: false,
                    }));
                }

                onStop?.(blob);
            };

            mediaRecorder.onerror = (event: Event) => {
                const error = new Error(`MediaRecorder error: ${event.toString()}`);

                if (isMountedRef.current) {
                    setState(prev => ({
                        ...prev,
                        error: error.message,
                        isRecording: false,
                    }));
                }

                onError?.(error);
            };

            // Start recording
            mediaRecorder.start();

            if (isMountedRef.current) {
                setState(prev => ({ ...prev, isRecording: true }));
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';

            if (isMountedRef.current) {
                setState(prev => ({
                    ...prev,
                    error: errorMessage,
                    isRecording: false,
                }));
            }

            onError?.(error instanceof Error ? error : new Error(errorMessage));
        }
    }, [audio, video, mimeType, onDataAvailable, onStop, onError]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && state.isRecording) {
            try {
                mediaRecorderRef.current.stop();
            } catch (error) {
                console.warn('Error stopping recording:', error);
            }
        }
    }, [state.isRecording]);

    const clearBlob = useCallback(() => {
        if (isMountedRef.current) {
            setState(prev => ({ ...prev, mediaBlob: null }));
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            cleanup();
        };
    }, [cleanup]);

    return {
        ...state,
        startRecording,
        stopRecording,
        clearBlob,
        cleanup,
    };
}
