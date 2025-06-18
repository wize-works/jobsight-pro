'use client';

import { useState, forwardRef } from 'react';
import { VoiceInputButton } from './voice-input-button';

interface VoiceTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    onVoiceTranscription?: (text: string) => void;
    voiceButtonSize?: 'sm' | 'md' | 'lg';
    voiceButtonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    showVoiceButton?: boolean;
    voiceAppendMode?: 'replace' | 'append' | 'prepend';
    label?: string;
    error?: string;
    helperText?: string;
}

export const VoiceTextarea = forwardRef<HTMLTextAreaElement, VoiceTextareaProps>(({
    onVoiceTranscription,
    voiceButtonSize = 'sm',
    voiceButtonVariant = 'secondary',
    showVoiceButton = true,
    voiceAppendMode = 'append',
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

        if (voiceAppendMode === 'replace') {
            const syntheticEvent = {
                target: { value: transcribedText }
            } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange?.(syntheticEvent);
        } else if (voiceAppendMode === 'append') {
            const currentValue = (value as string) || '';
            const newValue = currentValue ? `${currentValue}\n${transcribedText}` : transcribedText;
            const syntheticEvent = {
                target: { value: newValue }
            } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange?.(syntheticEvent);
        } else if (voiceAppendMode === 'prepend') {
            const currentValue = (value as string) || '';
            const newValue = currentValue ? `${transcribedText}\n${currentValue}` : transcribedText;
            const syntheticEvent = {
                target: { value: newValue }
            } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange?.(syntheticEvent);
        }

        onVoiceTranscription?.(transcribedText);
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
                <textarea
                    ref={ref}
                    value={value}
                    onChange={onChange}
                    className={`textarea textarea-bordered w-full ${error ? 'textarea-error' : ''} ${className}`}
                    {...props}
                />
                {showVoiceButton && !label && (
                    <div className="absolute top-2 right-2">
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

VoiceTextarea.displayName = 'VoiceTextarea';
