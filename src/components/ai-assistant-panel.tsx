"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createDailyLog } from "@/app/actions/daily-logs";
import type { DailyLogInsert } from "@/types/daily-logs";
import { getProjects } from "@/app/actions/projects";
import type { Project } from "@/types/projects";

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
    const [projects, setProjects] = useState<Project[]>([]);

    // Multi-turn conversation state
    const [conversationState, setConversationState] = useState<string | null>(null);

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

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            // Load projects when panel opens
            loadProjects();
        }
    }, [isOpen, conversation]);

    const loadProjects = async () => {
        try {
            const projectList = await getProjects();
            setProjects(projectList);
        } catch (error) {
            console.error("Error loading projects:", error);
        }
    };

    useEffect(() => {
        // Load conversation from localStorage on mount
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
    }, []);

    useEffect(() => {
        // Save conversation to localStorage whenever it changes
        if (conversation.length > 0) {
            localStorage.setItem("aiAssistantConversation", JSON.stringify(conversation));
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

    // Fetch open projects dynamically
    const fetchOpenProjects = async () => {
        try {
            const response = await fetch("/actions/get-open-projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ auth_id: "user-auth-id" }), // Replace with actual auth_id
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch open projects: ${response.status}`);
            }

            const openProjects = await response.json();
            return openProjects;
        } catch (error) {
            console.error("Error fetching open projects:", error);
            return null;
        }
    };

    // Fetch daily logs summary dynamically
    const fetchDailyLogsSummary = async (date: string) => {
        try {
            const response = await fetch("/actions/get-daily-logs-summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ auth_id: "user-auth-id", date }), // Replace with actual auth_id
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch daily logs summary: ${response.status}`);
            }

            const dailyLogsSummary = await response.json();
            return dailyLogsSummary;
        } catch (error) {
            console.error("Error fetching daily logs summary:", error);
            return null;
        }
    };

    // Handle open projects query
    const handleOpenProjectsQuery = async () => {
        const openProjects = await fetchOpenProjects();

        if (openProjects && openProjects.length > 0) {
            const projectList = openProjects.map((project: any) => project.name).join(", ");
            addToConversation(
                "assistant",
                `Here are your open projects: ${projectList}`
            );
        } else {
            addToConversation(
                "assistant",
                "I couldn't find any open projects. Please try again later."
            );
        }
    };

    // Handle daily logs summary query
    const handleDailyLogsSummaryQuery = async (date: string) => {
        const dailyLogsSummary = await fetchDailyLogsSummary(date);

        if (dailyLogsSummary && dailyLogsSummary.length > 0) {
            const summaryList = dailyLogsSummary
                .map((log: any) => `• ${log.summary}`)
                .join("\n");

            addToConversation(
                "assistant",
                `Here are today's daily logs:\n${summaryList}`
            );
        } else {
            addToConversation(
                "assistant",
                "I couldn't find any daily logs for today."
            );
        }
    };

    // Call OpenAI to interpret user input and generate a response
    const callOpenAI = async (message: string, context: any) => {
        try {
            const response = await fetch("/actions/openai-query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: `You are an AI assistant. Here is the context: ${JSON.stringify(context)}. User says: ${message}. Respond appropriately.`,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to get response from OpenAI: ${response.status}`);
            }

            const result = await response.json();
            return result.response;
        } catch (error) {
            console.error("Error calling OpenAI:", error);
            return "I'm sorry, I couldn't process your request. Please try again later.";
        }
    };

    // Update processMessage to use OpenAI
    const processMessage = async (message: string) => {
        try {
            const context = {
                userRole, // User's role
                recentInteractions: conversation.slice(-5), // Last 5 messages for context
                projects, // List of projects
            };

            const aiResponse = await callOpenAI(message, context);
            addToConversation("assistant", aiResponse);
        } catch (error) {
            console.error("Error processing message:", error);
            addToConversation(
                "assistant",
                "I'm sorry, I encountered an issue while processing your request. Could you try rephrasing it?"
            );
        }
    };

    // User feedback loop
    const handleFeedback = async (messageId: number, feedback: "positive" | "negative") => {
        try {
            const response = await fetch("/actions/store-feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message_id: messageId,
                    feedback_type: feedback,
                    auth_id: "user-auth-id", // Replace with actual auth_id from context or state
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to store feedback: ${response.status}`);
            }

            addToConversation("assistant", "Thank you for your feedback!");
        } catch (error) {
            console.error("Error storing feedback:", error);
            addToConversation("assistant", "Sorry, we couldn't process your feedback. Please try again later.");
        }
    };

    // Render feedback buttons
    const renderFeedbackButtons = (messageId: number) => (
        <div className="feedback-buttons">
            <button onClick={() => handleFeedback(messageId, "positive")}>👍</button>
            <button onClick={() => handleFeedback(messageId, "negative")}>👎</button>
        </div>
    );

    // Enhanced error recovery
    const processMessageEnhanced = async (message: string) => {
        try {
            const context = {
                userRole, // User's role
                recentInteractions: conversation.slice(-5), // Last 5 messages for context
                projects, // List of projects
            };

            const aiResponse = await callOpenAI(message, context);
            addToConversation("assistant", aiResponse);
        } catch (error) {
            console.error("Error processing message:", error);
            addToConversation(
                "assistant",
                "I'm sorry, I encountered an issue while processing your request. Could you try rephrasing it?"
            );
        }
    };

    // Fetch project details dynamically
    const fetchProjectDetails = async (projectId: string) => {
        try {
            const response = await fetch(`/api/projects/${projectId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch project details: ${response.status}`);
            }
            const projectDetails = await response.json();
            return projectDetails;
        } catch (error) {
            console.error("Error fetching project details:", error);
            return null;
        }
    };

    // Fetch project statuses dynamically
    const fetchProjectStatuses = async () => {
        try {
            const response = await fetch("/actions/get-project-statuses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ auth_id: "user-auth-id" }), // Replace with actual auth_id
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch project statuses: ${response.status}`);
            }

            const projectStatuses = await response.json();
            return projectStatuses;
        } catch (error) {
            console.error("Error fetching project statuses:", error);
            return null;
        }
    };

    // Handle project-related queries
    const handleProjectQuery = async (message: string) => {
        const project = projects.find((p) =>
            message.toLowerCase().includes(p.name.toLowerCase())
        );

        if (project) {
            const projectDetails = await fetchProjectDetails(project.id);
            if (projectDetails) {
                addToConversation(
                    "assistant",
                    `Here are the details for project ${project.name}: ${JSON.stringify(projectDetails)}`
                );
            } else {
                addToConversation(
                    "assistant",
                    "I couldn't retrieve the project details. Please try again later."
                );
            }
        } else {
            addToConversation(
                "assistant",
                "I couldn't find the project you're referring to. Could you clarify?"
            );
        }
    };

    // Handle project status queries
    const handleProjectStatusQuery = async () => {
        const projectStatuses = await fetchProjectStatuses();

        if (projectStatuses && projectStatuses.length > 0) {
            const statusMessage = projectStatuses
                .map((project: any) => `${project.name}: ${project.status}`)
                .join("\n");

            addToConversation(
                "assistant",
                `Here are the statuses of your projects:\n${statusMessage}`
            );
        } else {
            addToConversation(
                "assistant",
                "I couldn't retrieve your project statuses. Please try again later."
            );
        }
    };

    // Helper functions to enhance user statements for professional daily logs
    const enhanceWorkStatement = async (statement: string): Promise<string> => {
        if (!statement || statement.length > 150) return statement; // Don't enhance if already detailed

        try {
            const response = await fetch("/api/ai/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: `Only fix grammar and improve clarity of this work statement. Do NOT add new information or details that weren't provided. Keep the same tone and structure: "${statement}"`,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                const enhanced = result.response || statement;
                // Only use enhanced version if it's not significantly longer
                if (enhanced.length <= statement.length * 1.5) {
                    return enhanced;
                }
            }
        } catch (error) {
            console.error("Error enhancing work statement:", error);
        }

        return statement;
    };

    const enhanceNotesStatement = async (notes: string): Promise<string> => {
        if (!notes || notes.length > 100) return notes;

        try {
            const response = await fetch("/api/ai/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: `Only fix grammar and improve clarity of this note. Do NOT add new information. Keep it brief: "${notes}"`,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                const enhanced = result.response || notes;
                // Only use enhanced version if it's not significantly longer
                if (enhanced.length <= notes.length * 1.3) {
                    return enhanced;
                }
            }
        } catch (error) {
            console.error("Error enhancing notes:", error);
        }

        return notes;
    };

    const enhanceSafetyStatement = async (safety: string): Promise<string> => {
        if (!safety || safety.length > 80) return safety;

        try {
            const response = await fetch("/api/ai/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: `Only fix grammar and improve clarity of this safety note. Do NOT add new information or details: "${safety}"`,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                const enhanced = result.response || safety;
                // Only use enhanced version if it's not significantly longer
                if (enhanced.length <= safety.length * 1.2) {
                    return enhanced;
                }
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
            suggestions.push("• Which project or site did you work on today?");
        }

        if (
            !logData.work_completed &&
            !logData.summary &&
            !logData.tasks_completed
        ) {
            missingFields.push("work completed");
            suggestions.push("• Can you describe what work was completed today?");
        }

        if (!logData.date) {
            missingFields.push("date");
            suggestions.push("• What date was this work performed? (or say 'today' for today's date)");
        }

        // Optional but helpful fields
        if (!logData.start_time && !logData.end_time) {
            suggestions.push("• What time did you start and finish work? (optional - I can use standard 8am-5pm if not specified)");
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

    const continueDailyLogConversation = async (
        message: string,
        partialDataStr: string | null,
        enhancedDataStr: string | null
    ) => {
        try {
            let dailyLogData: any = {};

            // Parse existing data
            if (enhancedDataStr) {
                dailyLogData = JSON.parse(enhancedDataStr);
            } else if (partialDataStr) {
                dailyLogData = JSON.parse(partialDataStr);
            }

            // Extract additional information from the new message
            const projectName = extractProjectFromMessage(message);
            if (projectName) {
                dailyLogData.project_name = projectName;
            }

            // Use AI to extract any additional details from the message
            const response = await fetch("/api/ai/transcribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message }),
            });

            if (response.ok) {
                const newData = await response.json();

                // Merge new data with existing data
                dailyLogData = {
                    ...dailyLogData,
                    ...newData,
                    // Don't overwrite existing enhanced data
                    work_completed: dailyLogData.work_completed || newData.work_completed,
                    safety: dailyLogData.safety || newData.safety_notes || newData.safety,
                    notes: dailyLogData.notes || newData.notes,
                };
            }

            // Check if we have enough information now
            const validation = validateDailyLogFields(dailyLogData);

            if (!validation.isValid) {
                // Still missing information, ask for more details
                addToConversation(
                    "assistant",
                    `Thanks for the additional information! I still need a few more details:\n\n${validation.suggestions.join("\n")}\n\nOnce you provide these, I'll create the complete daily log for you.`,
                );

                // Update stored data with new information
                sessionStorage.setItem(
                    "aiGeneratedLog",
                    JSON.stringify(dailyLogData),
                );
            } else {
                // We have enough information, enhance and save
                addToConversation(
                    "assistant",
                    "Perfect! I now have all the information needed. Creating your daily log...",
                );

                // If we don't have enhanced data yet, enhance it
                if (!enhancedDataStr) {
                    const enhancedWorkCompleted = await enhanceWorkStatement(
                        dailyLogData.work_completed || message
                    );
                    const enhancedNotes = await enhanceNotesStatement(
                        dailyLogData.notes || ""
                    );
                    const enhancedSafety = await enhanceSafetyStatement(
                        dailyLogData.safety || ""
                    );

                    dailyLogData.work_completed = enhancedWorkCompleted;
                    dailyLogData.notes = enhancedNotes;
                    dailyLogData.safety = enhancedSafety;
                }

                // Create the final daily log data structure
                const finalLogData: DailyLogInsert = {
                    work_completed: dailyLogData.work_completed,
                    weather: dailyLogData.weather || "",
                    safety: dailyLogData.safety,
                    notes: dailyLogData.notes,
                    date: dailyLogData.date || new Date().toISOString().split('T')[0],
                    project_id: dailyLogData.project_id || "temp-project-id", // This should be resolved from project name
                    start_time: dailyLogData.start_time || "08:00",
                    end_time: dailyLogData.end_time || "17:00",
                    hours_worked: dailyLogData.hours_worked || 8,
                    overtime: dailyLogData.overtime || 0,
                } as DailyLogInsert;

                try {
                    // Save the daily log directly using the action
                    const savedLog = await createDailyLog(finalLogData);

                    if (savedLog) {
                        addToConversation(
                            "assistant",
                            `Excellent! Your daily log has been successfully created and saved with the details you provided:\n\n• Work completed\n• Safety notes\n• Project details\n\nYou can view it in the daily logs section. Is there anything else you'd like me to help you with?`,
                        );

                        // Clear the stored data since we're done
                        sessionStorage.removeItem("aiGeneratedLog");
                        sessionStorage.removeItem("aiEnhancedLog");
                    } else {
                        throw new Error("Failed to save daily log");
                    }
                } catch (saveError) {
                    console.error("Error saving daily log:", saveError);
                    addToConversation(
                        "assistant",
                        `I couldn't save the daily log automatically. This might be because the project "${dailyLogData.project_name}" isn't set up in your system yet. Would you like me to guide you through creating the project first, or you can manually create the daily log with this enhanced information:\n\n• Work: ${dailyLogData.work_completed}\n• Safety: ${dailyLogData.safety}\n• Notes: ${dailyLogData.notes}`,
                    );
                }
            }
        } catch (error) {
            console.error("Error continuing daily log conversation:", error);
            addToConversation(
                "assistant",
                "I had trouble processing that information. Could you please provide the missing details again?",
            );
        }
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
                // Ask for missing information but acknowledge what we already have
                const hasInfo = [];
                if (result.work_completed || result.summary) hasInfo.push("work details");
                if (result.weather) hasInfo.push("weather conditions");
                if (result.safety_notes || result.safety) hasInfo.push("safety notes");

                let response = "I'm starting to create your daily log! ";
                if (hasInfo.length > 0) {
                    response += `I've captured your ${hasInfo.join(", ")}, but I need some additional information:\n\n${validation.suggestions.join("\n")}\n\n`;
                } else {
                    response += `I need some information to create your daily log:\n\n${validation.suggestions.join("\n")}\n\n`;
                }
                response += "Just provide the missing details and I'll complete the log for you.";

                addToConversation("assistant", response);

                // Store partial data for continuation
                sessionStorage.setItem(
                    "aiGeneratedLog",
                    JSON.stringify(result),
                );
            } else {
                addToConversation(
                    "assistant",
                    "Creating your daily log with the details you provided...",
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

                // Try to find matching project
                let projectId = result.project_id;

                if (!projectId && (result.project_name || result.project)) {
                    const projectName = result.project_name || result.project;
                    const matchingProject = projects.find(p =>
                        p.name.toLowerCase().includes(projectName.toLowerCase()) ||
                        projectName.toLowerCase().includes(p.name.toLowerCase())
                    );

                    if (matchingProject) {
                        projectId = matchingProject.id;
                        addToConversation(
                            "assistant",
                            `Found matching project: "${matchingProject.name}". Creating daily log...`,
                        );
                    }
                }

                // Check if we still don't have a project_id
                if (!projectId) {
                    const projectNames = projects.map(p => p.name).join(", ");
                    addToConversation(
                        "assistant",
                        `I've enhanced your daily log information, but I couldn't find a matching project. Available projects: ${projectNames}.\n\nPlease specify which project this daily log is for, or would you like me to guide you through creating a new project?\n\nEnhanced details:\n• Work: ${enhancedWorkCompleted}\n• Safety: ${enhancedSafety}\n• Notes: ${enhancedNotes}`,
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
                    project_id: projectId,
                    start_time: result.start_time || "08:00",
                    end_time: result.end_time || "17:00",
                    hours_worked: result.hours_worked || 8,
                    overtime: result.overtime || 0,
                } as DailyLogInsert;

                try {
                    // Save the daily log directly using the action
                    const savedLog = await createDailyLog(dailyLogData);

                    if (savedLog) {
                        addToConversation(
                            "assistant",
                            `Daily log created successfully! You can view it in the daily logs section.`,
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

    const generateDynamicPrompt = (userRole: string, recentInteractions: string[]): string => {
        let basePrompt = "You are an AI assistant for a construction management platform.";

        // Adjust prompt based on user role
        if (userRole === "Project Manager") {
            basePrompt += " Focus on providing project summaries, task updates, and risk assessments.";
        } else if (userRole === "Foreman") {
            basePrompt += " Focus on daily logs, safety notes, and crew management.";
        } else {
            basePrompt += " Provide general assistance for construction-related queries.";
        }

        // Incorporate recent interactions
        if (recentInteractions.length > 0) {
            basePrompt += ` Recent interactions include: ${recentInteractions.join(", ")}.`;
        }

        return basePrompt;
    };

    const handleGeneralQuery = async (message: string, userRole: string, recentInteractions: string[]) => {
        try {
            const dynamicPrompt = generateDynamicPrompt(userRole, recentInteractions);

            const response = await fetch("/api/ai/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question: message,
                    prompt: dynamicPrompt,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            addToConversation(
                "assistant",
                result.response || "I understand your request. How else can I help you today?",
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

    const userRole = "Project Manager"; // Example role, replace with actual user role logic
    const recentInteractions = conversation.map((msg) => msg.content).slice(-5); // Last 5 messages

    const handleSubmit = async () => {
        if (!textInput.trim() || isProcessing) return;

        const message = textInput.trim();
        setTextInput("");
        setIsProcessing(true);

        addToConversation("user", message);

        try {
            await handleGeneralQuery(message, userRole, recentInteractions);
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
                className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-base-100 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? "translate-x-0" : "translate-x-full"
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
                                    className={`p-3 rounded-lg ${msg.type === "user"
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
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === "user"
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