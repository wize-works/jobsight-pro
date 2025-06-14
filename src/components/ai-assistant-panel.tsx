'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { processAIQuery, transcribeAudio, createDailyLogFromAI } from '@/app/actions/ai';

interface AIAssistantPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ConversationMessage {
    type: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export function AIAssistantPanel({ isOpen, onClose }: AIAssistantPanelProps) {
    const [textInput, setTextInput] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversation, setConversation] = useState<ConversationMessage[]>([]);
    const [error, setError] = useState("");

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation]);

    useEffect(() => {
        if (isOpen) {
            // Load conversation from localStorage
            const savedConversation = localStorage.getItem("aiAssistantConversation");
            if (savedConversation) {
                try {
                    const parsed = JSON.parse(savedConversation);
                    const conversationWithDates = parsed.map((msg: any) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp),
                    }));
                    setConversation(conversationWithDates);
                } catch (err) {
                    console.error("Error loading conversation:", err);
                }
            }
        }
    }, [isOpen]);

    useEffect(() => {
        if (conversation.length > 0) {
            localStorage.setItem("aiAssistantConversation", JSON.stringify(conversation));
        }
    }, [conversation]);

    const addToConversation = (type: "user" | "assistant", content: string) => {
        setConversation(prev => [...prev, {
            type,
            content,
            timestamp: new Date()
        }]);
    };

    const handleClose = () => {
        if (isRecording) {
            stopRecording();
        }
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
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
                await processVoiceNote(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setError("");
        } catch (err) {
            setError("Could not access microphone. Please check permissions.");
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
            addToConversation("user", "🎙️ Voice message");

            const transcriptionResult = await transcribeAudio(audioBlob);

            if (transcriptionResult.error) {
                addToConversation("assistant", `Sorry, I couldn't transcribe your voice message: ${transcriptionResult.error}`);
                return;
            }

            const transcribedText = transcriptionResult.text;
            addToConversation("user", transcribedText);

            // Process the transcribed text
            await processAIQuery(transcribedText, conversation.slice(-5).map(msg => ({
                role: msg.type === "user" ? "user" : "assistant",
                content: msg.content
            })));

        } catch (err) {
            addToConversation("assistant", "I had trouble processing your voice message. Please try again.");
            console.error("Voice processing error:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    const processQuery = async (message: string) => {
        setIsProcessing(true);
        setError("");

        try {
            // Convert conversation to the format expected by the action
            const conversationHistory = conversation.slice(-5).map(msg => ({
                role: msg.type === "user" ? "user" : "assistant" as const,
                content: msg.content
            }));

            const result = await processAIQuery(message, conversationHistory);

            // Handle different types of AI responses
            if (result.action === 'create_daily_log' && result.data) {
                addToConversation("assistant", "I'm creating a daily log for this work. Let me structure your information...");

                const logResult = await createDailyLogFromAI(result.data);

                if (logResult.success) {
                    const successMessage = `Great! I've created your daily log for ${result.data.projectName}. You can view it in your daily logs or make any adjustments needed.`;
                    addToConversation("assistant", successMessage);

                    // Optionally navigate to the daily log
                    if (logResult.logId) {
                        setTimeout(() => {
                            router.push(`/dashboard/daily-logs/${logResult.logId}`);
                        }, 2000);
                    }
                } else {
                    addToConversation("assistant", `I had trouble saving the daily log: ${logResult.error}. You can try creating it manually with the enhanced information I provided.`);
                }
            } else if (result.action === 'navigate' && result.path) {
                addToConversation("assistant", result.response);
                setTimeout(() => router.push(result.path), 1500);
            } else {
                addToConversation("assistant", result.response);
            }

        } catch (err) {
            const errorMsg = "I encountered an issue processing your request: " + (err as Error).message;
            addToConversation("assistant", errorMsg);
            console.error("AI processing error:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!textInput.trim() || isProcessing) return;

        const message = textInput.trim();
        setTextInput("");
        addToConversation("user", message);
        await processQuery(message);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Sliding panel */}
            <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-base-100 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
                isOpen ? 'translate-x-0' : 'translate-x-full'
            } flex flex-col border-l border-base-300`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-base-300 bg-base-200">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary text-primary-content rounded-full flex items-center justify-center">
                            <i className="fas fa-brain text-sm"></i>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">AI Assistant</h3>
                            <p className="text-xs text-base-content/70">
                                Intelligent project insights
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {conversation.length > 0 && (
                            <button
                                className="btn btn-xs btn-ghost"
                                onClick={() => setConversation([])}
                                disabled={isProcessing}
                                title="Clear conversation"
                            >
                                <i className="fas fa-trash text-xs"></i>
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="btn btn-sm btn-circle btn-ghost"
                            disabled={isProcessing}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Chat area */}
                <div className="flex flex-col h-full">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4" style={{ maxHeight: 'calc(100vh - 160px)' }}>
                        {conversation.length === 0 && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
                                    <i className="fas fa-brain text-2xl text-primary"></i>
                                </div>
                                <p className="text-lg font-medium mb-2">
                                    Hi! I'm your intelligent assistant.
                                </p>
                                <p className="text-sm text-base-content/70 mb-4">
                                    I can analyze your project data, answer questions about work progress,
                                    create daily logs, and provide insights about your construction projects.
                                </p>
                                <div className="text-xs text-base-content/50 space-y-1">
                                    <p>"What safety issues happened this week?"</p>
                                    <p>"Create a daily log for the Oakridge project"</p>
                                    <p>"Show me tasks that are behind schedule"</p>
                                </div>
                            </div>
                        )}

                        {conversation.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] p-3 rounded-lg ${
                                        msg.type === 'user'
                                            ? 'bg-primary text-primary-content ml-2'
                                            : 'bg-base-200 text-base-content mr-2'
                                    }`}
                                >
                                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                    <div className="text-xs opacity-70 mt-1">
                                        {msg.timestamp.toLocaleTimeString()}
                                    </div>
                                </div>
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        msg.type === 'user' ? 'order-1 bg-primary' : 'order-2 bg-secondary'
                                    }`}
                                >
                                    <i
                                        className={`fas ${
                                            msg.type === 'user' ? 'fa-user' : 'fa-brain'
                                        } text-xs text-white`}
                                    ></i>
                                </div>
                            </div>
                        ))}

                        {isProcessing && (
                            <div className="flex justify-start">
                                <div className="bg-base-200 text-base-content p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="loading loading-dots loading-sm"></span>
                                        <span className="text-sm">Processing...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input area */}
                    <div className="p-3 sm:p-4 border-t border-base-300 bg-base-200">
                        {error && (
                            <div className="alert alert-error alert-sm mb-2">
                                <span className="text-xs">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                            <div className="flex-1">
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Ask about projects, create daily logs..."
                                    className="textarea textarea-bordered textarea-sm w-full resize-none"
                                    disabled={isProcessing}
                                    rows={2}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`btn btn-sm btn-square ${
                                    isRecording ? 'btn-error' : 'btn-secondary'
                                }`}
                                disabled={isProcessing}
                            >
                                <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                            </button>

                            <button
                                type="submit"
                                className="btn btn-primary btn-sm btn-square"
                                disabled={!textInput.trim() || isProcessing}
                            >
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </form>
                        {isRecording && (
                            <div className="text-center mt-2">
                                <span className="text-xs text-error">
                                    <i className="fas fa-circle animate-pulse mr-1"></i>
                                    Recording... Click stop when finished
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}