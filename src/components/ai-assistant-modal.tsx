
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AIAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIAssistantModal({ isOpen, onClose }: AIAssistantModalProps) {
    const [textInput, setTextInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversation, setConversation] = useState<Array<{
        type: 'user' | 'assistant';
        content: string;
        timestamp: Date;
    }>>([]);
    const [error, setError] = useState('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const router = useRouter();

    // Load conversation from localStorage on mount
    useEffect(() => {
        const savedConversation = localStorage.getItem('aiAssistantConversation');
        if (savedConversation) {
            try {
                const parsed = JSON.parse(savedConversation);
                // Convert timestamp strings back to Date objects
                const conversationWithDates = parsed.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }));
                setConversation(conversationWithDates);
            } catch (err) {
                console.error('Error loading conversation:', err);
            }
        }
    }, []);

    // Save conversation to localStorage whenever it changes
    useEffect(() => {
        if (conversation.length > 0) {
            localStorage.setItem('aiAssistantConversation', JSON.stringify(conversation));
        }
    }, [conversation]);

    const resetModal = () => {
        setTextInput('');
        setConversation([]);
        setError('');
        setIsRecording(false);
        setIsProcessing(false);
        localStorage.removeItem('aiAssistantConversation');
    };

    const handleClose = () => {
        // Don't reset the conversation, just close the modal
        setTextInput('');
        setError('');
        setIsRecording(false);
        setIsProcessing(false);
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

            // Add transcribed text to conversation
            const userMessage = result.transcription || 'Voice message processed';
            addToConversation('user', userMessage);

            // Process the transcribed text
            await processMessage(userMessage);

        } catch (err) {
            setError('Failed to process voice input: ' + (err as Error).message);
            console.error('Voice processing error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const processMessage = async (message: string) => {
        const lowerMessage = message.toLowerCase();

        // Check if user wants to create a daily log
        const dailyLogKeywords = [
            'daily log', 'create log', 'submit log', 'log my day',
            'work completed', 'today we', 'daily report', 'site log'
        ];

        const isDailyLogRequest = dailyLogKeywords.some(keyword =>
            lowerMessage.includes(keyword)
        );

        if (isDailyLogRequest) {
            // Process as daily log creation
            await createDailyLogFromMessage(message);
        } else {
            // Process as general AI query
            await handleGeneralQuery(message);
        }
    };

    const createDailyLogFromMessage = async (message: string) => {
        try {
            const response = await fetch('/api/ai/transcribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            addToConversation('assistant', 'I\'ve created a structured daily log from your input. Taking you to the daily logs page to review and submit.');

            // Store the structured data properly for the daily logs page
            const structuredData = {
                work_completed: result.work_completed || result.summary || message,
                weather: result.weather || '',
                safety_notes: result.safety_notes || result.safety || '',
                issues: result.issues || [],
                notes: result.notes || result.crew_notes || '',
                materials_used: result.materials_used || result.materials || [],
                equipment_used: result.equipment_used || result.equipment || [],
                source: 'ai_chat'
            };

            sessionStorage.setItem('aiGeneratedLog', JSON.stringify(structuredData));

            setTimeout(() => {
                router.push('/dashboard/daily-logs?ai=true');
            }, 1500);
        } catch (err) {
            const errorMsg = 'Failed to create daily log: ' + (err as Error).message;
            addToConversation('assistant', errorMsg);
            console.error('Daily log creation error:', err);
        }
    };

    const handleGeneralQuery = async (message: string) => {
        try {
            const response = await fetch('/api/ai/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: message }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            addToConversation('assistant', result.response || 'I understand your request. How else can I help you today?');

        } catch (err) {
            const errorMsg = 'Sorry, I had trouble processing your request: ' + (err as Error).message;
            addToConversation('assistant', errorMsg);
            console.error('General query error:', err);
        }
    };

    const addToConversation = (type: 'user' | 'assistant', content: string) => {
        setConversation(prev => [...prev, {
            type,
            content,
            timestamp: new Date()
        }]);
    };

    const handleSubmit = async () => {
        if (!textInput.trim() || isProcessing) return;

        const message = textInput.trim();
        setTextInput('');
        setIsProcessing(true);

        // Add user message to conversation
        addToConversation('user', message);

        try {
            await processMessage(message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl h-[600px] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <i className="fas fa-robot text-2xl text-primary"></i>
                        <h2 className="text-xl font-bold">AI Assistant</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {conversation.length > 0 && (
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={resetModal}
                                disabled={isProcessing}
                                title="Clear conversation"
                            >
                                <i className="fas fa-trash text-sm"></i>
                            </button>
                        )}
                        <button
                            className="btn btn-sm btn-circle btn-ghost"
                            onClick={handleClose}
                            disabled={isProcessing}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Conversation Area */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                    {conversation.length === 0 && (
                        <div className="text-center text-base-content/70 py-8">
                            <div className="w-16 h-16 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
                                <i className="fas fa-comments text-2xl"></i>
                            </div>
                            <p className="text-lg mb-2">Hi! I'm your AI assistant.</p>
                            <p className="text-sm">
                                I can help you create daily logs, answer questions about your projects,
                                and assist with various construction management tasks.
                            </p>
                            <div className="mt-4 text-xs text-base-content/50">
                                <p>Try saying: "Create a daily log for today's concrete work"</p>
                                <p>Or ask: "What safety issues were reported this week?"</p>
                            </div>
                        </div>
                    )}

                    {conversation.map((msg, index) => (
                        <div
                            key={index}
                            className={`chat ${msg.type === 'user' ? 'chat-end' : 'chat-start'}`}
                        >
                            <div className="chat-image avatar">
                                <div className="w-8 rounded-full">
                                    {msg.type === 'user' ? (
                                        <div className="w-8 h-8 bg-primary text-primary-content rounded-full flex items-center justify-center">
                                            <i className="fas fa-user text-xs"></i>
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 bg-secondary text-secondary-content rounded-full flex items-center justify-center">
                                            <i className="fas fa-robot text-xs"></i>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={`chat-bubble ${msg.type === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'}`}>
                                {msg.content}
                            </div>
                            <div className="chat-footer opacity-50 text-xs">
                                {msg.timestamp.toLocaleTimeString()}
                            </div>
                        </div>
                    ))}

                    {isProcessing && (
                        <div className="chat chat-start">
                            <div className="chat-image avatar">
                                <div className="w-8 h-8 bg-secondary text-secondary-content rounded-full flex items-center justify-center">
                                    <span className="loading loading-spinner loading-xs"></span>
                                </div>
                            </div>
                            <div className="chat-bubble chat-bubble-secondary">
                                <span className="loading loading-dots loading-sm"></span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="alert alert-error mb-4 flex-shrink-0">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>{error}</span>
                    </div>
                )}

                {/* Input Area */}
                <div className="flex-shrink-0">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <textarea
                                className="textarea textarea-bordered w-full resize-none"
                                placeholder="Type your message or ask me anything..."
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isProcessing}
                                rows={3}
                            />
                        </div>

                        {/* Voice Recording Button */}
                        <button
                            className={`btn btn-square ${isRecording ? 'btn-error animate-pulse' : 'btn-secondary'}`}
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isProcessing}
                            title={isRecording ? 'Stop recording' : 'Start voice recording'}
                        >
                            <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                        </button>

                        {/* Send Button */}
                        <button
                            className="btn btn-primary btn-square"
                            onClick={handleSubmit}
                            disabled={!textInput.trim() || isProcessing}
                            title="Send message"
                        >
                            <i className="fas fa-paper-plane"></i>
                        </button>
                    </div>

                    {isRecording && (
                        <div className="text-center mt-2">
                            <span className="text-sm text-error">
                                <i className="fas fa-circle animate-pulse mr-1"></i>
                                Recording... Click the stop button when finished
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
