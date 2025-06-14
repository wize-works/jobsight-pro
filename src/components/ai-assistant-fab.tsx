
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface AIAssistantFABProps {
    className?: string;
}

export default function AIAssistantFAB({ className = "" }: AIAssistantFABProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showTextInput, setShowTextInput] = useState(false);
    const [textInput, setTextInput] = useState("");
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const router = useRouter();

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
                await processAudioLog(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error starting recording:", error);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsProcessing(true);
        }
    };

    const processAudioLog = async (audioBlob: Blob) => {
        try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "voice-note.wav");

            const response = await fetch("/api/ai/transcribe", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to transcribe audio");
            }

            const result = await response.json();
            
            // Navigate to daily logs with the AI-generated content
            const searchParams = new URLSearchParams({
                ai_summary: result.summary || "",
                ai_transcription: result.transcription || "",
                ai_tasks: JSON.stringify(result.tasks || []),
                ai_materials: JSON.stringify(result.materials || []),
                ai_equipment: JSON.stringify(result.equipment || []),
                ai_safety_notes: result.safety_notes || "",
                ai_weather: result.weather || "",
                ai_crew_notes: result.crew_notes || ""
            });

            router.push(`/dashboard/daily-logs?${searchParams.toString()}`);
            
        } catch (error) {
            console.error("Error processing voice log:", error);
            alert("Failed to process voice recording. Please try again.");
        } finally {
            setIsProcessing(false);
            setIsOpen(false);
        }
    };

    const processTextLog = async () => {
        if (!textInput.trim()) return;

        setIsProcessing(true);
        try {
            const response = await fetch("/api/ai/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question: `Convert this into a structured daily log: ${textInput}`,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to process text");
            }

            const result = await response.json();
            
            // Navigate to daily logs with the AI-generated content
            const searchParams = new URLSearchParams({
                ai_summary: result.response || textInput,
                ai_source: "text_input"
            });

            router.push(`/dashboard/daily-logs?${searchParams.toString()}`);
            
        } catch (error) {
            console.error("Error processing text log:", error);
            alert("Failed to process text input. Please try again.");
        } finally {
            setIsProcessing(false);
            setIsOpen(false);
            setShowTextInput(false);
            setTextInput("");
        }
    };

    const handleTextInputToggle = () => {
        setShowTextInput(!showTextInput);
        setIsOpen(false);
    };

    return (
        <>
            {/* Floating Action Button */}
            <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
                <div className="relative">
                    {/* Main FAB */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="btn btn-circle btn-primary btn-lg shadow-lg hover:shadow-xl transition-all duration-200"
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <span className="loading loading-spinner loading-md"></span>
                        ) : (
                            <i className="fas fa-robot text-xl"></i>
                        )}
                    </button>

                    {/* Action Menu */}
                    {isOpen && (
                        <div className="absolute bottom-16 right-0 flex flex-col gap-3">
                            {/* Voice Recording Button */}
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`btn btn-circle ${isRecording ? "btn-error animate-pulse" : "btn-secondary"} shadow-lg`}
                                disabled={isProcessing}
                            >
                                <i className={`fas ${isRecording ? "fa-stop" : "fa-microphone"} text-lg`}></i>
                            </button>

                            {/* Text Input Button */}
                            <button
                                onClick={handleTextInputToggle}
                                className="btn btn-circle btn-accent shadow-lg"
                                disabled={isProcessing}
                            >
                                <i className="fas fa-keyboard text-lg"></i>
                            </button>
                        </div>
                    )}

                    {/* Recording Status */}
                    {isRecording && (
                        <div className="absolute -top-12 right-0 bg-error text-error-content px-3 py-1 rounded-lg text-sm whitespace-nowrap">
                            Recording... Tap to stop
                        </div>
                    )}
                </div>
            </div>

            {/* Text Input Modal */}
            {showTextInput && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <i className="fas fa-keyboard mr-2"></i>
                            Create Daily Log from Text
                        </h3>
                        
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Describe your daily activities, materials used, crew notes, safety observations, or any work completed today..."
                            className="textarea textarea-bordered w-full h-32 mb-4"
                            autoFocus
                        />
                        
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setShowTextInput(false);
                                    setTextInput("");
                                }}
                                className="btn btn-ghost"
                                disabled={isProcessing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={processTextLog}
                                className="btn btn-primary"
                                disabled={isProcessing || !textInput.trim()}
                            >
                                {isProcessing ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-magic mr-2"></i>
                                        Generate Log
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
