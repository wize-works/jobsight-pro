'use client';

import { useState, useRef } from 'react';
import { transcribeAudio } from '@/app/actions/ai';

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
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
                await processVoiceNote(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            const errorMsg = "Could not access microphone. Please check permissions.";
            onTranscriptionError?.(errorMsg);
            console.error("Microphone access error:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

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
