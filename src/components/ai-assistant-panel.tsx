"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createDailyLog } from "@/app/actions/daily-logs";
import type { DailyLogInsert } from "@/types/daily-logs";

interface AIAssistantPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIAssistantPanel({ isOpen, onClose }: AIAssistantPanelProps) {
    const [textInput, setTextInput] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversation, setConversation] = useState<
        Array<{
            type: "user" | "assistant";
            content: string;
            timestamp: Date;
        }>
    >([]);
    const [error, setError] = useState("");

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation]);

    // Load conversation from localStorage on mount
    useEffect(() => {
        const savedConversation = localStorage.getItem(
            "aiAssistantConversation",
        );
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
    }, []);

    // Save conversation to localStorage whenever it changes
    useEffect(() => {
        if (conversation.length > 0) {
            localStorage.setItem(
                "aiAssistantConversation",
                JSON.stringify(conversation),
            );
        }
    }, [conversation]);

    const resetConversation = () => {
        setConversation([]);
        setError("");
        localStorage.removeItem("aiAssistantConversation");
    };

    const handleClose = () => {
        setTextInput("");
        setError("");
        setIsRecording(false);
        setIsProcessing(false);
        onClose();
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: "audio/wav",
                });
                await processVoiceInput(audioBlob);
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setError("");
        } catch (err) {
            setError(
                "Failed to start recording. Please check microphone permissions.",
            );
            console.error("Recording error:", err);
        }
    };

    const stopRecording = () => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording"
        ) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const processVoiceInput = async (audioBlob: Blob) => {
        setIsProcessing(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.wav");

            const response = await fetch("/api/ai/transcribe", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            const userMessage =
                result.transcription || "Voice message processed";
            addToConversation("user", userMessage);

            await processMessage(userMessage);
        } catch (err) {
            setError(
                "Failed to process voice input: " + (err as Error).message,
            );
            console.error("Voice processing error:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    const processMessage = async (message: string) => {
        const lowerMessage = message.toLowerCase();

        const dailyLogKeywords = [
            "daily log",
            "create log",
            "submit log",
            "log my day",
            "work completed",
            "today we",
            "daily report",
            "site log",
        ];

        const isDailyLogRequest = dailyLogKeywords.some((keyword) =>
            lowerMessage.includes(keyword),
        );

        if (isDailyLogRequest) {
            await createDailyLogFromMessage(message);
        } else {
            await handleGeneralQuery(message);
        }
    };

    // Helper functions to enhance user statements for professional daily logs
    const enhanceWorkStatement = async (statement: string): Promise<string> => {
        if (!statement || statement.length > 200) return statement; // Don't enhance if already detailed

        try {
            const response = await fetch("/api/ai/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: `Enhance this brief work statement into a more detailed professional daily log entry. Keep it concise but add context typical for construction work: "${statement}"`,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                return result.response || statement;
            }
        } catch (error) {
            console.error("Error enhancing work statement:", error);
        }

        return statement;
    };

    const enhanceNotesStatement = async (notes: string): Promise<string> => {
        if (!notes || notes.length > 150) return notes;

        try {
            const response = await fetch("/api/ai/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: `Enhance these brief notes into more professional daily log notes for construction: "${notes}"`,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                return result.response || notes;
            }
        } catch (error) {
            console.error("Error enhancing notes:", error);
        }

        return notes;
    };

    const enhanceSafetyStatement = async (safety: string): Promise<string> => {
        if (!safety || safety.length > 100) return safety;

        try {
            const response = await fetch("/api/ai/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: `Enhance this brief safety note into a more detailed safety observation for a construction daily log: "${safety}"`,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                return result.response || safety;
            }
        } catch (error) {
            console.error("Error enhancing safety statement:", error);
        }

        return safety;
    };

    const validateDailyLogFields = (logData: any) => {
        const missingFields = [];
        const suggestions = [];

        if (!logData.project_id && !logData.project_name) {
            missingFields.push("project");
            suggestions.push("Which project did you work on today?");
        }

        if (
            !logData.work_completed &&
            !logData.summary &&
            !logData.tasks_completed
        ) {
            missingFields.push("work completed");
            suggestions.push("Can you describe what work was completed today?");
        }

        if (!logData.date) {
            missingFields.push("date");
            suggestions.push("What date was this work performed?");
        }

        return {
            missingFields,
            suggestions,
            isValid: missingFields.length === 0,
        };
    };

    const extractProjectFromMessage = (message: string): string | null => {
        // Look for common project patterns in the message
        const projectPatterns = [
            /daily log for ([^:]+):/i,
            /project ([^:,\.]+)/i,
            /working on ([^:,\.]+)/i,
            /at ([^:,\.]+) today/i,
        ];

        for (const pattern of projectPatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return null;
    };

    const createDailyLogFromMessage = async (message: string) => {
        try {
            const response = await fetch("/api/ai/transcribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Try to extract project name from the original message if not found by AI
            if (!result.project_id && !result.project_name) {
                const extractedProject = extractProjectFromMessage(message);
                if (extractedProject) {
                    result.project_name = extractedProject;
                }
            }

            // Validate the extracted fields
            const validation = validateDailyLogFields(result);

            if (!validation.isValid) {
                // Ask for missing information
                addToConversation(
                    "assistant",
                    `I'd like to help you create a daily log, but I need some additional information:\n\n${validation.suggestions.join("\n")}\n\nPlease provide these details and I'll create the log for you.`,
                );
                // Store partial data for continuation
                sessionStorage.setItem(
                    "aiGeneratedLog",
                    JSON.stringify(result),
                );
            } else {
                addToConversation(
                    "assistant",
                    "I'm enhancing your statements and creating a structured daily log. This will take a moment...",
                );

                // Enhance the user's statements before saving
                const enhancedWorkCompleted = await enhanceWorkStatement(
                    result.work_completed || result.summary || message
                );
                const enhancedNotes = await enhanceNotesStatement(
                    result.notes || result.crew_notes || ""
                );
                const enhancedSafety = await enhanceSafetyStatement(
                    result.safety_notes || result.safety || ""
                );

                // Check if we have a project_id from the message
                if (!result.project_id && !result.project_name) {
                    addToConversation(
                        "assistant",
                        `I've enhanced your daily log information, but I need to know which project this is for. I noticed you mentioned "Oakridge Tower" - is this the project name? Please confirm the project and I'll save the daily log for you.\n\nEnhanced details:\n• Work: ${enhancedWorkCompleted}\n• Safety: ${enhancedSafety}\n• Notes: ${enhancedNotes}`,
                    );
                    
                    // Store the enhanced data for continuation
                    sessionStorage.setItem(
                        "aiEnhancedLog",
                        JSON.stringify({
                            work_completed: enhancedWorkCompleted,
                            weather: result.weather || "",
                            safety: enhancedSafety,
                            notes: enhancedNotes,
                            date: result.date || new Date().toISOString().split('T')[0],
                            start_time: result.start_time || "08:00",
                            end_time: result.end_time || "17:00",
                            hours_worked: result.hours_worked || 8,
                            overtime: result.overtime || 0,
                        })
                    );
                    return;
                }

                // Create the daily log data structure
                const dailyLogData: DailyLogInsert = {
                    work_completed: enhancedWorkCompleted,
                    weather: result.weather || "",
                    safety: enhancedSafety,
                    notes: enhancedNotes,
                    date: result.date || new Date().toISOString().split('T')[0],
                    project_id: result.project_id || "temp-project-id", // This should be resolved from project name
                    start_time: result.start_time || "08:00",
                    end_time: result.end_time || "17:00",
                    hours_worked: result.hours_worked || 8,
                    overtime: result.overtime || 0,
                };

                try {
                    // Save the daily log directly using the action
                    const savedLog = await createDailyLog(dailyLogData);

                    if (savedLog) {
                        addToConversation(
                            "assistant",
                            `Daily log created successfully! You can view it in the daily logs section. The enhanced log includes detailed work descriptions and safety notes.`,
                        );
                    } else {
                        throw new Error("Failed to save daily log");
                    }
                } catch (saveError) {
                    console.error("Error saving daily log:", saveError);
                    addToConversation(
                        "assistant",
                        `I couldn't save the daily log automatically. This might be because the project "Oakridge Tower" isn't set up in your system yet. Would you like me to guide you through creating the project first, or you can manually create the daily log with this enhanced information:\n\n• Work: ${enhancedWorkCompleted}\n• Safety: ${enhancedSafety}\n• Notes: ${enhancedNotes}`,
                    );
                }
            }
        } catch (err) {
            const errorMsg =
                "Failed to create daily log: " + (err as Error).message;
            addToConversation("assistant", errorMsg);
            console.error("Daily log creation error:", err);
        }
    };

    const handleGeneralQuery = async (message: string) => {
        try {
            const response = await fetch("/api/ai/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ question: message }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            addToConversation(
                "assistant",
                result.response ||
                    "I understand your request. How else can I help you today?",
            );
        } catch (err) {
            const errorMsg =
                "Sorry, I had trouble processing your request: " +
                (err as Error).message;
            addToConversation("assistant", errorMsg);
            console.error("General query error:", err);
        }
    };

    const addToConversation = (type: "user" | "assistant", content: string) => {
        setConversation((prev) => [
            ...prev,
            {
                type,
                content,
                timestamp: new Date(),
            },
        ]);
    };

    const handleSubmit = async () => {
        if (!textInput.trim() || isProcessing) return;

        const message = textInput.trim();
        setTextInput("");
        setIsProcessing(true);

        addToConversation("user", message);

        try {
            await processMessage(message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <>
            {/* Sliding panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-base-100 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                } flex flex-col border-l border-base-300`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-base-300 bg-base-200">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary text-primary-content rounded-full flex items-center justify-center">
                            <i className="fas fa-robot text-sm"></i>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">
                                AI Assistant
                            </h3>
                            <p className="text-xs text-base-content/70">
                                Always here to help
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {conversation.length > 0 && (
                            <button
                                className="btn btn-xs btn-ghost"
                                onClick={resetConversation}
                                disabled={isProcessing}
                                title="Clear conversation"
                            >
                                <i className="fas fa-trash text-xs"></i>
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

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                    {conversation.length === 0 && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
                                <i className="fas fa-comments text-2xl text-primary"></i>
                            </div>
                            <p className="text-lg font-medium mb-2">
                                Hi! I'm your AI assistant.
                            </p>
                            <p className="text-sm text-base-content/70 mb-4">
                                I can help you create daily logs, answer
                                questions about your projects, and assist with
                                various construction management tasks.
                            </p>
                            <div className="text-xs text-base-content/50 space-y-1">
                                <p>
                                    "Create a daily log for today's concrete
                                    work"
                                </p>
                                <p>
                                    "What safety issues were reported this
                                    week?"
                                </p>
                            </div>
                        </div>
                    )}

                    {conversation.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] ${msg.type === "user" ? "order-2" : "order-1"}`}
                            >
                                <div
                                    className={`p-3 rounded-lg ${
                                        msg.type === "user"
                                            ? "bg-primary text-primary-content ml-2"
                                            : "bg-base-200 text-base-content mr-2"
                                    }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">
                                        {msg.content}
                                    </p>
                                </div>
                                <p className="text-xs text-base-content/50 mt-1 px-3">
                                    {msg.timestamp.toLocaleTimeString()}
                                </p>
                            </div>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    msg.type === "user"
                                        ? "order-1 bg-primary"
                                        : "order-2 bg-secondary"
                                }`}
                            >
                                <i
                                    className={`fas ${msg.type === "user" ? "fa-user" : "fa-robot"} text-xs text-white`}
                                ></i>
                            </div>
                        </div>
                    ))}

                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                <span className="loading loading-spinner loading-xs text-white"></span>
                            </div>
                            <div className="bg-base-200 p-3 rounded-lg mr-2 ml-2">
                                <span className="loading loading-dots loading-sm"></span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mx-3 sm:mx-4 mb-2">
                        <div className="alert alert-error alert-sm">
                            <i className="fas fa-exclamation-triangle text-sm"></i>
                            <span className="text-sm">{error}</span>
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-3 sm:p-4 border-t border-base-300 bg-base-200">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <textarea
                                className="textarea textarea-bordered textarea-sm w-full resize-none"
                                placeholder="Type your message..."
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isProcessing}
                                rows={2}
                            />
                        </div>

                        <button
                            className={`btn btn-sm btn-square ${isRecording ? "btn-error animate-pulse" : "btn-secondary"}`}
                            onClick={
                                isRecording ? stopRecording : startRecording
                            }
                            disabled={isProcessing}
                            title={
                                isRecording
                                    ? "Stop recording"
                                    : "Start voice recording"
                            }
                        >
                            <i
                                className={`fas ${isRecording ? "fa-stop" : "fa-microphone"} text-sm`}
                            ></i>
                        </button>

                        <button
                            className="btn btn-primary btn-sm btn-square"
                            onClick={handleSubmit}
                            disabled={!textInput.trim() || isProcessing}
                            title="Send message"
                        >
                            <i className="fas fa-paper-plane text-sm"></i>
                        </button>
                    </div>

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
        </>
    );
}
