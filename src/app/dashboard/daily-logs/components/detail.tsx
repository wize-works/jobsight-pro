"use client";
import { DailyLogWithDetails } from "@/types/daily-logs";
import { useState } from "react";

type DailyLogComponentProps = {
    log: DailyLogWithDetails;
};

export default function DailyLogComponent(params: DailyLogComponentProps) {
    const [activeTab, setActiveTab] = useState<"logs" | "create">("logs");
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Daily Logs</h1>

            <div className="tabs tabs-boxed mb-4">
                <button
                    className={`tab ${activeTab === "logs" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("logs")}
                >
                    Logs
                </button>
                <button
                    className={`tab ${activeTab === "create" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("create")}
                >
                    Create Log
                </button>
            </div>

            {activeTab === "logs" && (
                <div>
                    {/* Render daily logs list here */}
                    <p>List of daily logs will be displayed here.</p>
                </div>
            )}

            {activeTab === "create" && (
                <div>
                    {/* Render create daily log form here */}
                    <p>Create a new daily log form will be displayed here.</p>
                </div>
            )}
        </div>
    );
}