
'use client';

import { useState, useRef } from 'react';

export default function TestVoicePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [structuredLog, setStructuredLog] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
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

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
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
      setStructuredLog(result.structuredLog);
    } catch (err) {
      setError('Failed to transcribe audio: ' + (err as Error).message);
      console.error('Transcription error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await transcribeAudio(file);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-header">
          <h2 className="card-title text-2xl font-bold">
            <i className="fas fa-microphone text-primary mr-2"></i>
            Voice Transcription Test
          </h2>
        </div>
        <div className="card-body space-y-4">
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`btn ${isRecording ? 'btn-error' : 'btn-primary'} gap-2`}
              disabled={isLoading}
            >
              {isRecording ? (
                <>
                  <i className="fas fa-stop"></i>
                  Stop Recording
                </>
              ) : (
                <>
                  <i className="fas fa-microphone"></i>
                  Start Recording
                </>
              )}
            </button>

            <div className="relative">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="audio-upload"
                disabled={isLoading}
              />
              <label htmlFor="audio-upload" className={`btn btn-outline gap-2 ${isLoading ? 'btn-disabled' : ''}`}>
                <i className="fas fa-upload"></i>
                Upload Audio File
              </label>
            </div>
          </div>

          {isLoading && (
            <div className="text-center text-base-content/70 flex items-center justify-center gap-2">
              <span className="loading loading-spinner loading-md"></span>
              Processing audio...
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {transcription && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-file-alt text-primary mr-2"></i>
              Transcription
            </h3>
          </div>
          <div className="card-body">
            <textarea
              value={transcription}
              readOnly
              className="textarea textarea-bordered w-full min-h-[100px] resize-none"
              placeholder="Transcription will appear here..."
            />
          </div>
        </div>
      )}

      {structuredLog && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-list-alt text-primary mr-2"></i>
              Structured Log
            </h3>
          </div>
          <div className="card-body">
            <div className="mockup-code">
              <pre className="text-sm overflow-auto">
                <code>{JSON.stringify(structuredLog, null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
