
export interface ConflictData {
    localVersion: any;
    serverVersion: any;
    field: string;
}

export interface ConflictResolution {
    strategy: 'server-wins' | 'client-wins' | 'merge' | 'manual';
    resolvedData?: any;
}

export function detectConflicts(localData: any, serverData: any): ConflictData[] {
    const conflicts: ConflictData[] = [];
    
    if (!localData || !serverData) return conflicts;

    // Compare timestamps
    if (localData.updated_at && serverData.updated_at) {
        const localTime = new Date(localData.updated_at).getTime();
        const serverTime = new Date(serverData.updated_at).getTime();
        
        if (Math.abs(localTime - serverTime) > 1000) { // More than 1 second difference
            // Check for field-level conflicts
            Object.keys(localData).forEach(key => {
                if (key !== 'updated_at' && localData[key] !== serverData[key]) {
                    conflicts.push({
                        localVersion: localData[key],
                        serverVersion: serverData[key],
                        field: key
                    });
                }
            });
        }
    }

    return conflicts;
}

export function resolveConflict(conflict: ConflictData, strategy: ConflictResolution['strategy']): any {
    switch (strategy) {
        case 'server-wins':
            return conflict.serverVersion;
        case 'client-wins':
            return conflict.localVersion;
        case 'merge':
            // Simple merge strategy - can be enhanced based on field types
            if (typeof conflict.localVersion === 'string' && typeof conflict.serverVersion === 'string') {
                return `${conflict.localVersion} | ${conflict.serverVersion}`;
            }
            return conflict.serverVersion; // Default to server
        default:
            return conflict.serverVersion;
    }
}

export function mergeData(localData: any, serverData: any, resolutions: Map<string, ConflictResolution>): any {
    const merged = { ...serverData };
    
    resolutions.forEach((resolution, field) => {
        if (resolution.resolvedData !== undefined) {
            merged[field] = resolution.resolvedData;
        }
    });

    return merged;
}
