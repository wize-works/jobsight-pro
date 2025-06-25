'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { processAIQuery } from '@/app/actions/ai';
import { transcribeAudio } from '@/app/actions/ai';
import { handleAIQuery } from '@/lib/ai/dispatcher';
import { useBusiness } from '@/lib/business-context';
import { useKindeAuth } from '@kinde-oss/kinde-auth-nextjs';
import ErrorBoundary from '@/components/error-boundary';
import { FeatureGate } from '@/components/subscription/FeatureGate';

interface AIAssistantPanelProps {
    isOpen: boolean;
    onClose: () => void;
    context?: {
        page?: string;
        projectId?: string;
        projectName?: string;
        taskId?: string;
        dailyLogId?: string;
        location?: string;
    };
}

interface ConversationMessage {
    type: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export function AIAssistantPanel({ isOpen, onClose, context }: AIAssistantPanelProps) {
    const { user } = useKindeAuth();
    const { businessId } = useBusiness();
    const [textInput, setTextInput] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversation, setConversation] = useState<ConversationMessage[]>([]);
    const [error, setError] = useState("");
    const [sessionState, setSessionState] = useState<{ lastProjectId?: string, lastProjectName?: string }>({});

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
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
    }; const processVoiceNote = async (audioBlob: Blob) => {
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

            // Use a context-aware prompt for the AI
            let contextualMessage = transcribedText;
            if (context) {
                const contextInfo = [];
                if (context.page) contextInfo.push(`Current page: ${context.page}`);
                if (context.projectId && context.projectName) contextInfo.push(`Current project: ${context.projectName} (ID: ${context.projectId})`);
                if (context.taskId) contextInfo.push(`Current task ID: ${context.taskId}`);
                if (context.dailyLogId) contextInfo.push(`Current daily log ID: ${context.dailyLogId}`);
                if (context.location) contextInfo.push(`Current location: ${context.location}`);
                if (contextInfo.length > 0) {
                    contextualMessage = `Context: ${contextInfo.join(', ')}\n\nUser voice input: "${transcribedText}"`;
                }
            }

            // Use the new general voice prompt
            const aiPrompt = `${contextualMessage}\n\n[INSTRUCTION]\n${require('@/lib/ai/prompts').PROMPTS.VOICE_GENERAL}`;
            await processQuery(aiPrompt);

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
            const result = await handleAIQuery({
                businessId,
                userId: user?.id || "",
                message,
                conversationHistory: conversation.slice(-5).map(msg => ({
                    role: msg.type === "user" ? "user" : "assistant",
                    content: msg.content
                })),
                sessionState: {} // Provide actual session state if available
            });

            addToConversation("assistant", result.response);

        } catch (err) {
            const errorMsg = "I encountered an issue processing your request: " + (err as Error).message;
            addToConversation("assistant", errorMsg);
            console.error("AI processing error:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    }; const getContextualPlaceholder = () => {
        if (!context) return "Ask about projects, create daily logs, or use voice input...";

        if (context.page === 'daily-logs') {
            return "Create daily log, record voice notes about today's work...";
        } else if (context.page === 'tasks') {
            return "Create tasks, ask about task status, or record voice instructions...";
        } else if (context.page === 'projects') {
            return "Ask about project status, create project notes...";
        } else if (context.projectName) {
            return `Ask about ${context.projectName}, create logs or tasks...`;
        }

        return "Ask about projects, create daily logs, tasks, or use voice input...";
    };

    const getContextualSuggestions = () => {
        if (!context) return [];

        const suggestions = [];

        if (context.page === 'daily-logs') {
            suggestions.push("Record today's work progress");
            suggestions.push("What materials did we use?");
            suggestions.push("Any safety issues to report?");
        } else if (context.page === 'tasks') {
            suggestions.push("Create a new task");
            suggestions.push("What tasks are overdue?");
            suggestions.push("Update task progress");
        } else if (context.page === 'projects') {
            suggestions.push("Project status summary");
            suggestions.push("What's behind schedule?");
            suggestions.push("Create project update");
        }

        if (context.projectName) {
            suggestions.push(`Status of ${context.projectName}`);
            suggestions.push(`Create log for ${context.projectName}`);
        }

        return suggestions.slice(0, 3); // Limit to 3 suggestions
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!textInput.trim() || isProcessing) return;

        const message = textInput.trim();
        setTextInput("");
        addToConversation("user", message);
        await processQuery(message);        // Refocus the message input box after submission
        messageInputRef.current?.focus();
    }; if (!isOpen) return null;

    return (
        <FeatureGate
            feature="ai_assistant"
            requiredPlan="starter"
            fallback={
                <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-base-100 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l border-base-300`}>
                    <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-200">
                        <h3 className="font-semibold text-lg">AI Assistant</h3>
                        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                            <i className="far fa-times"></i>
                        </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="far fa-lock text-warning text-2xl"></i>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">AI Assistant Unavailable</h3>
                            <p className="text-base-content/70 mb-4">
                                The AI Assistant requires a Starter plan or higher to access intelligent project insights and voice commands.
                            </p>
                            <button
                                onClick={() => window.open('/dashboard/billing/upgrade?plan=starter', '_blank')}
                                className="btn btn-primary btn-sm"
                            >
                                <i className="far fa-arrow-up mr-2"></i>
                                Upgrade to Starter
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <ErrorBoundary fallback={() => (
                <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-base-100 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l border-base-300`}>
                    <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-200">
                        <h3 className="font-semibold text-lg">AI Assistant</h3>
                        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                            <i className="far fa-times"></i>
                        </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="alert alert-error">
                            <i className="fas fa-exclamation-triangle"></i>
                            <div>
                                <h3 className="font-bold">AI Assistant Error</h3>
                                <div className="text-xs">The AI Assistant encountered an error. Please refresh the page.</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}>
                {!isOpen ? null : (
                    <>
                        {/* Sliding panel */}
                        <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-base-100 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l border-base-300`} style={{ maxWidth: '100vw' }}>
                            {/* Header */}
                            <ErrorBoundary fallback={() => (
                                <div className="p-4 border-b border-base-300 bg-base-200">
                                    <div className="alert alert-warning">
                                        <i className="fas fa-exclamation-triangle"></i>
                                        <div>
                                            <h3 className="font-bold">Header temporarily unavailable</h3>
                                            <div className="text-xs">AI Assistant header couldn't be loaded.</div>
                                        </div>
                                    </div>
                                </div>
                            )}>
                                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-base-300 bg-base-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary text-primary-content rounded-full flex items-center justify-center">
                                            <i className="far fa-brain text-sm"></i>
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
                                                <i className="far fa-trash text-xs"></i>
                                            </button>
                                        )}
                                        <button
                                            onClick={handleClose}
                                            className="btn btn-sm btn-circle btn-ghost"
                                            disabled={isProcessing}
                                        >
                                            <i className="far fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </ErrorBoundary>

                            {/* Chat area */}
                            <ErrorBoundary fallback={() => (
                                <div className="flex-1 flex items-center justify-center p-8">
                                    <div className="alert alert-error">
                                        <i className="fas fa-exclamation-triangle"></i>
                                        <div>
                                            <h3 className="font-bold">Chat temporarily unavailable</h3>
                                            <div className="text-xs">AI chat interface couldn't be loaded.</div>
                                        </div>
                                    </div>
                                </div>
                            )}>
                                <div className="flex flex-col h-full">
                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4" style={{ maxHeight: 'calc(100vh - 190px)' }}>
                                        {conversation.length === 0 && (
                                            <div className="text-center py-8">
                                                <div className="w-16 h-16 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
                                                    <i className="far fa-brain text-2xl text-primary"></i>
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
                                        )}                        {conversation.map((msg, index) => (
                                            <div key={index} className={`chat ${msg.type === 'user' ? 'chat-end' : 'chat-start'}`}>
                                                <div className="chat-image avatar">
                                                    <div className={`w-8 h-8 rounded-full ${msg.type === 'user' ? 'bg-primary' : 'bg-secondary'}`}>
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <i
                                                                className={`far ${msg.type === 'user' ? 'fa-user' : 'fa-brain'
                                                                    } text-xs text-white`}
                                                            ></i>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="chat-header">
                                                    {msg.type === 'user' ? 'You' : 'AI Assistant'}
                                                    <time className="text-xs opacity-50 ml-1">
                                                        {msg.timestamp.toLocaleTimeString()}
                                                    </time>
                                                </div>
                                                <div className={`chat-bubble ${msg.type === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'}`}>
                                                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                                </div>
                                                <div className="chat-footer opacity-50">
                                                    {msg.type === 'assistant' && (
                                                        <span className="text-xs">AI Response</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}                        {isProcessing && (
                                            <div className="chat chat-start">
                                                <div className="chat-image avatar">
                                                    <div className="w-8 h-8 rounded-full bg-secondary">
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <i className="far fa-brain text-xs text-white"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="chat-header">
                                                    AI Assistant
                                                    <time className="text-xs opacity-50 ml-1">
                                                        {new Date().toLocaleTimeString()}
                                                    </time>
                                                </div>
                                                <div className="chat-bubble chat-bubble-secondary">
                                                    <div className="flex items-center gap-2">
                                                        <span className="loading loading-dots loading-sm"></span>
                                                        <span className="text-sm">Processing...</span>
                                                    </div>
                                                </div>
                                                <div className="chat-footer opacity-50">
                                                    <span className="text-xs">Thinking...</span>
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
                                            </div>)}

                                        {/* Contextual Suggestions */}
                                        {conversation.length === 0 && getContextualSuggestions().length > 0 && (
                                            <div className="p-3 border-b border-base-300">
                                                <p className="text-xs text-base-content/60 mb-2">Quick suggestions:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {getContextualSuggestions().map((suggestion, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => {
                                                                setTextInput(suggestion);
                                                                messageInputRef.current?.focus();
                                                            }}
                                                            className="btn btn-xs btn-outline btn-ghost text-xs"
                                                            disabled={isProcessing}
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                                            <div className="flex-1">
                                                <textarea
                                                    ref={messageInputRef}
                                                    value={textInput}
                                                    onChange={(e) => setTextInput(e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                    placeholder={getContextualPlaceholder()}
                                                    className="textarea textarea-bordered textarea-sm w-full resize-none"
                                                    disabled={isProcessing}
                                                    rows={2}
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={isRecording ? stopRecording : startRecording}
                                                className={`btn btn-sm btn-square ${isRecording ? 'btn-error' : 'btn-secondary'
                                                    }`}
                                                disabled={isProcessing}
                                            >
                                                <i className={`far ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                                            </button>

                                            <button
                                                type="submit"
                                                className="btn btn-primary btn-sm btn-square"
                                                disabled={!textInput.trim() || isProcessing}
                                            >
                                                <i className="far fa-paper-plane"></i>
                                            </button>
                                        </form>
                                        {isRecording && (
                                            <div className="text-center mt-2">
                                                <span className="text-xs text-error">
                                                    <i className="far fa-circle animate-pulse mr-1"></i>
                                                    Recording... Click stop when finished
                                                </span>
                                            </div>
                                        )}                                </div>
                                </div>
                            </ErrorBoundary>

                        </div>
                    </>
                )}
            </ErrorBoundary>
        </FeatureGate>
    );
}