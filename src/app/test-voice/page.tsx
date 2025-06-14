
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Square, Upload } from 'lucide-react';

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
      <Card>
        <CardHeader>
          <CardTitle>Voice Transcription Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              disabled={isLoading}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </>
              )}
            </Button>

            <div>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="audio-upload"
                disabled={isLoading}
              />
              <Button asChild variant="outline" disabled={isLoading}>
                <label htmlFor="audio-upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Audio File
                </label>
              </Button>
            </div>
          </div>

          {isLoading && (
            <div className="text-center text-muted-foreground">
              Processing audio...
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {transcription && (
        <Card>
          <CardHeader>
            <CardTitle>Transcription</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={transcription}
              readOnly
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      )}

      {structuredLog && (
        <Card>
          <CardHeader>
            <CardTitle>Structured Log</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(structuredLog, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
