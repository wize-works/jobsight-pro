"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createDailyLog } from "@/app/actions/daily-logs";
import { getProjects } from "@/app/actions/projects";
import { getDailyLogs } from "@/app/actions/daily-logs";
import { getTasks } from "@/app/actions/tasks";
import { getEquipments } from "@/app/actions/equipments";
import { getCrews } from "@/app/actions/crews";
import type { DailyLogInsert } from "@/types/daily-logs";
import type { Project } from "@/types/projects";

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
    const [projects, setProjects] = useState<Project[]>([]);

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
            loadProjects();
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

    const loadProjects = async () => {
        try {
            const projectList = await getProjects();
            setProjects(projectList);
        } catch (error) {
            console.error("Error loading projects:", error);
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

    // Voice recording functions
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
                await processVoiceInput(audioBlob);
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setError("");
        } catch (err) {
            setError("Failed to start recording. Please check microphone permissions.");
            console.error("Recording error:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
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
            const userMessage = result.transcription || "Voice message processed";

            addToConversation("user", userMessage);
            await processAIQuery(userMessage);
        } catch (err) {
            setError("Failed to process voice input: " + (err as Error).message);
            console.error("Voice processing error:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    // Core AI processing function
    const processAIQuery = async (message: string) => {
        setIsProcessing(true);

        try {
            // Gather context data from your system
            const contextData = await gatherContextData();

            // Send to AI with intelligent prompt
            const response = await fetch("/api/ai/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    context: contextData,
                    conversationHistory: conversation.slice(-5), // Last 5 messages for context
                }),
            });

            if (!response.ok) {
                throw new Error(`AI query failed: ${response.status}`);
            }

            const result = await response.json();

            // Handle different types of AI responses
            if (result.action === 'create_daily_log') {
                await handleDailyLogCreation(result.data, message);
            } else if (result.action === 'navigate') {
                addToConversation("assistant", result.response);
                if (result.path) {
                    setTimeout(() => router.push(result.path), 1500);
                }
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

    // Gather relevant context data from your system
    const gatherContextData = async () => {
        try {
            const [projectsData, dailyLogsData, tasksData, equipmentData, crewsData] = await Promise.all([
                getProjects().catch(() => []),
                getDailyLogs().catch(() => []),
                getTasks().catch(() => []),
                getEquipments().catch(() => []),
                getCrews().catch(() => []),
            ]);

            return {
                projects: projectsData.slice(0, 20), // Limit to avoid token limits
                recentDailyLogs: dailyLogsData.slice(0, 10),
                activeTasks: tasksData.filter(t => t.status !== 'completed').slice(0, 15),
                equipment: equipmentData.slice(0, 10),
                crews: crewsData.slice(0, 10),
            };
        } catch (error) {
            console.error("Error gathering context:", error);
            return {
                projects: projects,
                recentDailyLogs: [],
                activeTasks: [],
                equipment: [],
                crews: [],
            };
        }
    };

    // Handle AI-suggested daily log creation
    const handleDailyLogCreation = async (logData: any, originalMessage: string) => {
        try {
            // Validate required fields
            if (!logData.project_id && !logData.project_name) {
                addToConversation(
                    "assistant",
                    "I can help create a daily log, but I need to know which project this is for. Which project should I create this log for?"
                );
                return;
            }

            // Try to match project if we have a name but no ID
            if (!logData.project_id && logData.project_name) {
                const matchingProject = projects.find(p =>
                    p.name.toLowerCase().includes(logData.project_name.toLowerCase()) ||
                    logData.project_name.toLowerCase().includes(p.name.toLowerCase())
                );

                if (matchingProject) {
                    logData.project_id = matchingProject.id;
                } else {
                    addToConversation(
                        "assistant",
                        `I couldn't find a project matching "${logData.project_name}". Available projects: ${projects.map(p => p.name).join(", ")}. Please specify which project this log is for.`
                    );
                    return;
                }
            }

            // Create the daily log
            const dailyLogData: DailyLogInsert = {
                project_id: logData.project_id,
                date: logData.date || new Date().toISOString().split('T')[0],
                work_completed: logData.work_completed || originalMessage,
                weather: logData.weather || "",
                safety: logData.safety || "",
                notes: logData.notes || "",
                start_time: logData.start_time || "08:00",
                end_time: logData.end_time || "17:00",
                hours_worked: logData.hours_worked || 8,
                overtime: logData.overtime || 0,
            };

            const savedLog = await createDailyLog(dailyLogData);

            if (savedLog) {
                addToConversation(
                    "assistant",
                    `Perfect! I've created your daily log for ${projects.find(p => p.id === logData.project_id)?.name}. The log includes your work details and has been saved successfully. You can view it in the daily logs section.`
                );
            } else {
                throw new Error("Failed to save daily log");
            }
        } catch (error) {
            console.error("Error creating daily log:", error);
            addToConversation(
                "assistant",
                "I had trouble saving the daily log. Would you like to try creating it manually, or can you provide more specific project information?"
            );
        }
    };

    const handleSubmit = async () => {
        if (!textInput.trim() || isProcessing) return;

        const message = textInput.trim();
        setTextInput("");

        addToConversation("user", message);
        await processAIQuery(message);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div
            className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-base-100 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
                isOpen ? "translate-x-0" : "translate-x-full"
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
                        className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`max-w-[80%] ${msg.type === "user" ? "order-2" : "order-1"}`}>
                            <div
                                className={`p-3 rounded-lg ${
                                    msg.type === "user"
                                        ? "bg-primary text-primary-content ml-2"
                                        : "bg-base-200 text-base-content mr-2"
                                }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            <p className="text-xs text-base-content/50 mt-1 px-3">
                                {msg.timestamp.toLocaleTimeString()}
                            </p>
                        </div>
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                msg.type === "user" ? "order-1 bg-primary" : "order-2 bg-secondary"
                            }`}
                        >
                            <i
                                className={`fas ${
                                    msg.type === "user" ? "fa-user" : "fa-brain"
                                } text-xs text-white`}
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
                            placeholder="Ask me anything about your projects..."
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isProcessing}
                            rows={2}
                        />
                    </div>

                    <button
                        className={`btn btn-sm btn-square ${
                            isRecording ? "btn-error animate-pulse" : "btn-secondary"
                        }`}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing}
                        title={isRecording ? "Stop recording" : "Start voice recording"}
                    >
                        <i
                            className={`fas ${
                                isRecording ? "fa-stop" : "fa-microphone"
                            } text-sm`}
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
    );
}