"use client";

import { useEffect, useState } from "react";
import clarityUtils from "@/lib/clarity-utils";

interface DebugInfo {
    isLoaded: boolean;
    sessionId: string | null;
    hasGlobalObject: boolean;
    environmentId: string;
    userAgent: string;
    timestamp: string;
}

export default function ClarityDebugPage() {
    const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
    const [testResult, setTestResult] = useState<string>("");

    useEffect(() => {
        // Wait a bit for Clarity to load, then get debug info
        const timer = setTimeout(() => {
            const info = clarityUtils.getDebugInfo();
            setDebugInfo(info);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const runTest = () => {
        const success = clarityUtils.testConnection();
        setTestResult(success ? "✅ Test passed!" : "❌ Test failed!");

        // Refresh debug info
        const info = clarityUtils.getDebugInfo();
        setDebugInfo(info);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Microsoft Clarity Debug Page
                </h1>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Debug Information</h2>

                    {debugInfo ? (
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="font-medium">Clarity Loaded:</span>
                                <span className={debugInfo.isLoaded ? "text-green-600" : "text-red-600"}>
                                    {debugInfo.isLoaded ? "✅ Yes" : "❌ No"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Session ID:</span>
                                <span className="text-gray-600">
                                    {debugInfo.sessionId || "Not available"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Global Object:</span>
                                <span className={debugInfo.hasGlobalObject ? "text-green-600" : "text-red-600"}>
                                    {debugInfo.hasGlobalObject ? "✅ Present" : "❌ Missing"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Environment ID:</span>
                                <span className="text-gray-600 break-all">
                                    {debugInfo.environmentId}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">User Agent:</span>
                                <span className="text-gray-600 text-sm">
                                    {debugInfo.userAgent.substring(0, 50)}...
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Timestamp:</span>
                                <span className="text-gray-600">
                                    {debugInfo.timestamp}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500">Loading debug information...</div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Connection Test</h2>

                    <button
                        onClick={runTest}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                        Test Clarity Connection
                    </button>

                    {testResult && (
                        <div className="mt-4 p-3 rounded bg-gray-100">
                            {testResult}
                        </div>
                    )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">
                        Troubleshooting Tips
                    </h3>
                    <ul className="text-yellow-700 space-y-1">
                        <li>• Check browser console for any CSP violations</li>
                        <li>• Verify NEXT_PUBLIC_CLARITY_ID is set in your environment</li>
                        <li>• Ensure Microsoft Clarity domains are whitelisted in CSP</li>
                        <li>• Try disabling ad blockers or privacy extensions</li>
                        <li>• Check network tab for failed requests to clarity.ms domains</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
