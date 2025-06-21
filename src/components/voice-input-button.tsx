'use client';

import { useState } from 'react';
import { transcribeAudio } from '@/app/actions/ai';
import { useMediaRecorder } from '@/hooks/use-media-recorder';

interface VoiceInputButtonProps {
    onTranscriptionComplete: (text: string) => void;
    onTranscriptionError?: (error: string) => void;
    disabled?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    tooltip?: string;
}

export function VoiceInputButton({
    onTranscriptionComplete,
    onTranscriptionError,
    disabled = false,
    className = '',
    size = 'md',
    variant = 'secondary',
    tooltip = 'Click to record voice input'
}: VoiceInputButtonProps) {
    const [isProcessing, setIsProcessing] = useState(false); const {
        isRecording,
        error: recordingError,
        startRecording,
        stopRecording
    } = useMediaRecorder({
        onDataAvailable: async (event: BlobEvent) => {
            if (event.data.size > 0) {
                await processVoiceNote(event.data);
            }
        },
        onError: (error) => {
            const errorMsg = "Could not access microphone. Please check permissions.";
            onTranscriptionError?.(errorMsg);
            console.error("Microphone access error:", error);
        }
    });

    const processVoiceNote = async (audioBlob: Blob) => {
        setIsProcessing(true);
        try {
            const transcriptionResult = await transcribeAudio(audioBlob);

            if (transcriptionResult.error) {
                onTranscriptionError?.(transcriptionResult.error);
                return;
            }

            onTranscriptionComplete(transcriptionResult.text);
        } catch (err) {
            const errorMsg = "Failed to process voice recording. Please try again.";
            onTranscriptionError?.(errorMsg);
            console.error("Voice processing error:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const getSizeClass = () => {
        switch (size) {
            case 'sm': return 'btn-sm';
            case 'lg': return 'btn-lg';
            default: return '';
        }
    };

    const getVariantClass = () => {
        if (isRecording) return 'btn-error';

        switch (variant) {
            case 'primary': return 'btn-primary';
            case 'secondary': return 'btn-secondary';
            case 'outline': return 'btn-outline';
            case 'ghost': return 'btn-ghost';
            default: return 'btn-secondary';
        }
    };

    const getIcon = () => {
        if (isProcessing) return 'fa-spinner fa-spin';
        if (isRecording) return 'fa-stop';
        return 'fa-microphone';
    };

    const getTooltipText = () => {
        if (isProcessing) return 'Processing audio...';
        if (isRecording) return 'Click to stop recording';
        return tooltip;
    };

    return (
        <div className="tooltip" data-tip={getTooltipText()}>
            <button
                type="button"
                onClick={handleClick}
                disabled={disabled || isProcessing}
                className={`btn btn-square ${getSizeClass()} ${getVariantClass()} ${className}`}
            >
                <i className={`far ${getIcon()}`}></i>
            </button>
            {isRecording && (
                <div className="absolute -top-1 -right-1">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-error opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
                </div>
            )}
        </div>
    );
}
