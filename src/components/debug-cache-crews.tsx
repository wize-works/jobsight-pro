'use client';

import { useState } from 'react';
import { debugCacheAndCrewsClient } from '@/lib/debug/client';
import { useBusiness } from '@/lib/business-context';

export function DebugCacheCrews() {
    const { businessId } = useBusiness();
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleDebug = async () => {
        if (!businessId) return;

        setLoading(true);
        try {
            const result = await debugCacheAndCrewsClient();
            setResult(result);
        } catch (error) {
            setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-base-100">
            <h3 className="font-bold mb-2">Debug Cache & Crews</h3>
            <button
                onClick={handleDebug}
                disabled={loading || !businessId}
                className="btn btn-primary btn-sm"
            >
                {loading ? 'Debugging...' : 'Clear Cache & Test Crews'}
            </button>

            {result && (
                <div className="mt-4 p-3 bg-base-200 rounded">
                    <pre className="text-xs overflow-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
