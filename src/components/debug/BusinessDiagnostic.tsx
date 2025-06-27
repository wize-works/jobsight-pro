// Temporary diagnostic component for debugging business-user relationship
"use client";

import { useState } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { getUserBusiness } from "@/lib/actions/business-client";
import { getUserBusiness as getServerUserBusiness } from "@/app/actions/business";

export default function BusinessDiagnostic() {
    const { user } = useKindeBrowserClient();
    const [clientResult, setClientResult] = useState<any>(null);
    const [serverResult, setServerResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const runDiagnostic = async () => {
        if (!user) {
            console.log("No user found");
            return;
        }

        setLoading(true);
        console.log("🔍 Running diagnostic for user:", user.id);

        try {
            // Test client action
            console.log("Testing client action...");
            const clientBusiness = await getUserBusiness(user.id);
            setClientResult(clientBusiness);
            console.log("Client result:", clientBusiness);

            // Test server action
            console.log("Testing server action...");
            const serverBusiness = await getServerUserBusiness(user.id);
            setServerResult(serverBusiness);
            console.log("Server result:", serverBusiness);

        } catch (error) {
            console.error("Diagnostic error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div>No user logged in</div>;
    }

    return (
        <div className="p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-semibold">Business Diagnostic</h3>
            <div>
                <strong>User ID:</strong> {user.id}
            </div>
            <div>
                <strong>User Email:</strong> {user.email}
            </div>

            <button
                onClick={runDiagnostic}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
                {loading ? "Running..." : "Run Diagnostic"}
            </button>

            {clientResult !== null && (
                <div>
                    <h4 className="font-semibold">Client Action Result:</h4>
                    <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                        {JSON.stringify(clientResult, null, 2)}
                    </pre>
                </div>
            )}

            {serverResult !== null && (
                <div>
                    <h4 className="font-semibold">Server Action Result:</h4>
                    <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                        {JSON.stringify(serverResult, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
