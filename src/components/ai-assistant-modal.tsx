
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistantModal({ isOpen, onClose }: AIAssistantModalProps) {
  const [mode, setMode] = useState<'home' | 'text' | 'voice'>('home');
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const router = useRouter();

  const resetModal = () => {
    setMode('home');
    setTextInput('');
    setTranscription('');
    setError('');
    setIsRecording(false);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError('');
    } catch (err) {
      setError('Failed to start recording. Please check microphone permissions.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setTranscription(result.transcription);
      
      // Navigate to daily logs page with pre-filled data
      if (result.structuredLog) {
        // Store the AI-generated log data in sessionStorage for the daily log form
        sessionStorage.setItem('aiGeneratedLog', JSON.stringify(result.structuredLog));
        router.push('/dashboard/daily-logs?ai=true');
        handleClose();
      }
    } catch (err) {
      setError('Failed to process voice input: ' + (err as Error).message);
      console.error('Voice processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const processTextInput = async () => {
    if (!textInput.trim()) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      // For now, we'll use the same transcribe endpoint with text
      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textInput }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Navigate to daily logs page with pre-filled data
      if (result.structuredLog) {
        sessionStorage.setItem('aiGeneratedLog', JSON.stringify(result.structuredLog));
        router.push('/dashboard/daily-logs?ai=true');
        handleClose();
      }
    } catch (err) {
      setError('Failed to process text input: ' + (err as Error).message);
      console.error('Text processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <i className="fas fa-robot text-2xl text-primary"></i>
            <h2 className="text-xl font-bold">AI Assistant</h2>
          </div>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={handleClose}
            disabled={isProcessing}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        {mode === 'home' && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-lg mb-2">How would you like to create a daily log?</p>
              <p className="text-sm text-base-content/70">
                I can help you create structured daily logs from your input
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Text Input Option */}
              <button
                className="card bg-base-200 hover:bg-base-300 transition-colors p-6 text-left"
                onClick={() => setMode('text')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary text-primary-content rounded-full flex items-center justify-center">
                    <i className="fas fa-keyboard text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Type Daily Log</h3>
                    <p className="text-sm text-base-content/70">
                      Describe your work in text and I'll structure it
                    </p>
                  </div>
                </div>
              </button>

              {/* Voice Input Option */}
              <button
                className="card bg-base-200 hover:bg-base-300 transition-colors p-6 text-left"
                onClick={() => setMode('voice')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary text-secondary-content rounded-full flex items-center justify-center">
                    <i className="fas fa-microphone text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Voice Daily Log</h3>
                    <p className="text-sm text-base-content/70">
                      Speak your log and I'll transcribe and structure it
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-base-content/50">
                More AI features coming soon: task completion, project summaries, and more
              </p>
            </div>
          </div>
        )}

        {mode === 'text' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setMode('home')}
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <h3 className="font-semibold">Type Your Daily Log</h3>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Describe your work day</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32"
                placeholder="e.g., Today we poured concrete for the foundation. Used 10 cubic yards of concrete. Had John, Mike, and Sarah on the crew. Weather was sunny and 75 degrees. Completed the west wall framing..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={isProcessing}
              />
            </div>

            {error && (
              <div className="alert alert-error">
                <i className="fas fa-exclamation-triangle"></i>
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                className="btn btn-outline"
                onClick={() => setMode('home')}
                disabled={isProcessing}
              >
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={processTextInput}
                disabled={!textInput.trim() || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic"></i>
                    Create Daily Log
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {mode === 'voice' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setMode('home')}
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <h3 className="font-semibold">Voice Daily Log</h3>
            </div>

            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto bg-secondary text-secondary-content rounded-full flex items-center justify-center">
                <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} text-3xl`}></i>
              </div>

              {!isRecording && !transcription && (
                <p className="text-base-content/70">
                  Click the button below to start recording your daily log
                </p>
              )}

              {isRecording && (
                <div className="space-y-2">
                  <p className="text-lg font-medium text-error">Recording...</p>
                  <p className="text-sm text-base-content/70">
                    Speak clearly about your work, materials, crew, and any issues
                  </p>
                </div>
              )}

              {transcription && (
                <div className="text-left">
                  <h4 className="font-medium mb-2">Transcription:</h4>
                  <div className="bg-base-200 p-3 rounded">
                    {transcription}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="alert alert-error">
                <i className="fas fa-exclamation-triangle"></i>
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-center gap-4">
              {!isRecording ? (
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={startRecording}
                  disabled={isProcessing}
                >
                  <i className="fas fa-microphone mr-2"></i>
                  Start Recording
                </button>
              ) : (
                <button
                  className="btn btn-error btn-lg"
                  onClick={stopRecording}
                  disabled={isProcessing}
                >
                  <i className="fas fa-stop mr-2"></i>
                  Stop Recording
                </button>
              )}
            </div>

            {isProcessing && (
              <div className="text-center">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="mt-2">Processing your voice log...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
