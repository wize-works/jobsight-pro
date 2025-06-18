'use client';

import { useState, forwardRef } from 'react';
import { VoiceInputButton } from './voice-input-button';

interface VoiceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onVoiceTranscription?: (text: string) => void;
    voiceButtonSize?: 'sm' | 'md' | 'lg';
    voiceButtonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    showVoiceButton?: boolean;
    voiceAppendMode?: 'replace' | 'append' | 'prepend';
    label?: string;
    error?: string;
    helperText?: string;
}

export const VoiceInput = forwardRef<HTMLInputElement, VoiceInputProps>(({
    onVoiceTranscription,
    voiceButtonSize = 'sm',
    voiceButtonVariant = 'ghost',
    showVoiceButton = true,
    voiceAppendMode = 'replace',
    label,
    error,
    helperText,
    className = '',
    value,
    onChange,
    ...props
}, ref) => {
    const [voiceError, setVoiceError] = useState<string | null>(null);

    const handleVoiceTranscription = (transcribedText: string) => {
        setVoiceError(null);

        // For inputs, we'll clean up the transcription (remove newlines, trim)
        const cleanedText = transcribedText.replace(/\n/g, ' ').trim();

        if (voiceAppendMode === 'replace') {
            const syntheticEvent = {
                target: { value: cleanedText }
            } as React.ChangeEvent<HTMLInputElement>;
            onChange?.(syntheticEvent);
        } else if (voiceAppendMode === 'append') {
            const currentValue = (value as string) || '';
            const newValue = currentValue ? `${currentValue} ${cleanedText}` : cleanedText;
            const syntheticEvent = {
                target: { value: newValue }
            } as React.ChangeEvent<HTMLInputElement>;
            onChange?.(syntheticEvent);
        } else if (voiceAppendMode === 'prepend') {
            const currentValue = (value as string) || '';
            const newValue = currentValue ? `${cleanedText} ${currentValue}` : cleanedText;
            const syntheticEvent = {
                target: { value: newValue }
            } as React.ChangeEvent<HTMLInputElement>;
            onChange?.(syntheticEvent);
        }

        onVoiceTranscription?.(cleanedText);
    };

    const handleVoiceError = (errorMessage: string) => {
        setVoiceError(errorMessage);
    };

    return (
        <div className="form-control w-full">
            {label && (
                <label className="label">
                    <span className="label-text font-medium">{label}</span>
                    {showVoiceButton && (
                        <div className="label-text-alt">
                            <VoiceInputButton
                                onTranscriptionComplete={handleVoiceTranscription}
                                onTranscriptionError={handleVoiceError}
                                size={voiceButtonSize}
                                variant={voiceButtonVariant}
                                tooltip="Add voice input to this field"
                            />
                        </div>
                    )}
                </label>
            )}

            <div className="relative">
                <input
                    ref={ref}
                    value={value}
                    onChange={onChange}
                    className={`input input-bordered w-full ${error ? 'input-error' : ''} ${showVoiceButton && !label ? 'pr-12' : ''} ${className}`}
                    {...props}
                />
                {showVoiceButton && !label && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <VoiceInputButton
                            onTranscriptionComplete={handleVoiceTranscription}
                            onTranscriptionError={handleVoiceError}
                            size={voiceButtonSize}
                            variant={voiceButtonVariant}
                            tooltip="Add voice input to this field"
                        />
                    </div>
                )}
            </div>

            {(error || voiceError || helperText) && (
                <label className="label">
                    {error && <span className="label-text-alt text-error">{error}</span>}
                    {voiceError && <span className="label-text-alt text-warning">{voiceError}</span>}
                    {helperText && !error && !voiceError && (
                        <span className="label-text-alt text-base-content/60">{helperText}</span>
                    )}
                </label>
            )}
        </div>
    );
});

VoiceInput.displayName = 'VoiceInput';
