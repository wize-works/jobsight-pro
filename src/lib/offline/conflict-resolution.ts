
export interface ConflictData {
    localVersion: any;
    serverVersion: any;
    field: string;
    entityType: string;
    entityId: string;
    localTimestamp?: Date;
    serverTimestamp?: Date;
    conflictType: 'field' | 'record' | 'deletion';
    priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ConflictResolution {
    strategy: 'server-wins' | 'client-wins' | 'merge' | 'manual' | 'user-preference' | 'field-specific';
    resolvedData?: any;
    timestamp: Date;
    userId?: string;
    reason?: string;
    confidence?: number; // 0-1 scale for automatic resolutions
}

export interface ConflictResolutionRule {
    entityType: string;
    field?: string;
    strategy: ConflictResolution['strategy'];
    priority: number; // Higher priority rules override lower ones
    condition?: (local: any, server: any) => boolean;
}

export interface UserPreferences {
    userId: string;
    defaultStrategy: ConflictResolution['strategy'];
    fieldRules: Map<string, ConflictResolution['strategy']>; // field -> strategy
    entityRules: Map<string, ConflictResolution['strategy']>; // entityType -> strategy
    autoResolveThreshold: number; // Confidence threshold for auto-resolution
}

class ConflictResolutionService {
    private static instance: ConflictResolutionService;
    private rules: ConflictResolutionRule[] = [];
    private userPreferences: Map<string, UserPreferences> = new Map();
    private pendingConflicts: Map<string, ConflictData[]> = new Map();

    private constructor() {
        this.initializeDefaultRules();
    }

    public static getInstance(): ConflictResolutionService {
        if (!ConflictResolutionService.instance) {
            ConflictResolutionService.instance = new ConflictResolutionService();
        }
        return ConflictResolutionService.instance;
    }

    private initializeDefaultRules(): void {
        // High-priority rules for critical fields
        this.rules = [
            { entityType: '*', field: 'id', strategy: 'server-wins', priority: 1000 },
            { entityType: '*', field: 'created_at', strategy: 'server-wins', priority: 900 },
            { entityType: '*', field: 'user_id', strategy: 'server-wins', priority: 900 },

            // Task-specific rules
            { entityType: 'task', field: 'status', strategy: 'user-preference', priority: 800 },
            { entityType: 'task', field: 'priority', strategy: 'merge', priority: 700 },

            // Financial data rules
            { entityType: 'invoice', field: 'amount', strategy: 'manual', priority: 850 },
            { entityType: 'invoice', field: 'status', strategy: 'server-wins', priority: 800 },

            // Media rules
            { entityType: 'media', field: 'file_path', strategy: 'server-wins', priority: 800 },
            { entityType: 'media', field: 'metadata', strategy: 'merge', priority: 600 },

            // Default rules
            { entityType: '*', strategy: 'server-wins', priority: 100 }
        ];
    }

    public setUserPreferences(userId: string, preferences: Partial<UserPreferences>): void {
        const existing = this.userPreferences.get(userId) || {
            userId,
            defaultStrategy: 'server-wins',
            fieldRules: new Map(),
            entityRules: new Map(),
            autoResolveThreshold: 0.8
        };

        this.userPreferences.set(userId, { ...existing, ...preferences });
    }

    public getUserPreferences(userId: string): UserPreferences | undefined {
        return this.userPreferences.get(userId);
    }

    public addRule(rule: ConflictResolutionRule): void {
        this.rules.push(rule);
        this.rules.sort((a, b) => b.priority - a.priority);
    }

    public detectConflicts(
        localData: any,
        serverData: any,
        entityType: string,
        entityId: string
    ): ConflictData[] {
        const conflicts: ConflictData[] = [];

        if (!localData || !serverData) {
            if (localData && !serverData) {
                conflicts.push({
                    localVersion: localData,
                    serverVersion: null,
                    field: '_record',
                    entityType,
                    entityId,
                    conflictType: 'deletion',
                    priority: 'high'
                });
            }
            return conflicts;
        }

        // Check for record-level conflicts based on timestamps
        let hasTimestampConflict = false;
        if (localData.updated_at && serverData.updated_at) {
            const localTime = new Date(localData.updated_at).getTime();
            const serverTime = new Date(serverData.updated_at).getTime();
            hasTimestampConflict = Math.abs(localTime - serverTime) > 1000; // More than 1 second
        }

        if (hasTimestampConflict) {
            // Field-level conflict detection
            Object.keys(localData).forEach(key => {
                if (key !== 'updated_at' &&
                    key !== 'id' &&
                    this.hasFieldChanged(localData[key], serverData[key])) {

                    const priority = this.getFieldPriority(entityType, key);
                    conflicts.push({
                        localVersion: localData[key],
                        serverVersion: serverData[key],
                        field: key,
                        entityType,
                        entityId,
                        localTimestamp: new Date(localData.updated_at),
                        serverTimestamp: new Date(serverData.updated_at),
                        conflictType: 'field',
                        priority
                    });
                }
            });
        }

        return conflicts;
    }

    private hasFieldChanged(local: any, server: any): boolean {
        if (local === server) return false;
        if (local == null && server == null) return false;
        if (typeof local === 'object' && typeof server === 'object') {
            return JSON.stringify(local) !== JSON.stringify(server);
        }
        return String(local) !== String(server);
    }

    private getFieldPriority(entityType: string, field: string): ConflictData['priority'] {
        const criticalFields = ['amount', 'status', 'priority', 'deadline'];
        const highFields = ['title', 'description', 'assigned_to'];

        if (criticalFields.includes(field)) return 'critical';
        if (highFields.includes(field)) return 'high';
        if (field.includes('_id') || field.includes('_at')) return 'medium';
        return 'low';
    }

    public async resolveConflicts(
        conflicts: ConflictData[],
        userId?: string
    ): Promise<Map<string, ConflictResolution>> {
        const resolutions = new Map<string, ConflictResolution>();
        const userPrefs = userId ? this.getUserPreferences(userId) : undefined;

        for (const conflict of conflicts) {
            const resolution = await this.resolveConflict(conflict, userPrefs);
            resolutions.set(conflict.field, resolution);
        }

        return resolutions;
    }

    private async resolveConflict(
        conflict: ConflictData,
        userPrefs?: UserPreferences
    ): Promise<ConflictResolution> {
        // Find applicable rule
        const rule = this.findApplicableRule(conflict);
        let strategy = rule?.strategy || 'server-wins';

        // Apply user preferences if available
        if (userPrefs) {
            const fieldRule = userPrefs.fieldRules.get(conflict.field);
            const entityRule = userPrefs.entityRules.get(conflict.entityType);

            if (fieldRule) strategy = fieldRule;
            else if (entityRule) strategy = entityRule;
            else if (strategy === 'user-preference') strategy = userPrefs.defaultStrategy;
        }

        const resolution: ConflictResolution = {
            strategy,
            timestamp: new Date(),
            userId: userPrefs?.userId,
            confidence: this.calculateConfidence(conflict, strategy)
        };

        // Apply resolution strategy
        switch (strategy) {
            case 'server-wins':
                resolution.resolvedData = conflict.serverVersion;
                resolution.reason = 'Server version selected as authoritative';
                break;

            case 'client-wins':
                resolution.resolvedData = conflict.localVersion;
                resolution.reason = 'Client version preserved';
                break;

            case 'merge':
                resolution.resolvedData = this.mergeFieldData(conflict);
                resolution.reason = 'Data merged automatically';
                break;

            case 'field-specific':
                resolution.resolvedData = this.applyFieldSpecificLogic(conflict);
                resolution.reason = 'Field-specific logic applied';
                break;

            case 'manual':
                // Store for manual resolution
                this.addPendingConflict(conflict);
                resolution.resolvedData = conflict.serverVersion; // Temporary fallback
                resolution.reason = 'Requires manual resolution';
                break;

            default:
                resolution.resolvedData = conflict.serverVersion;
                resolution.reason = 'Default to server version';
        }

        return resolution;
    }

    private findApplicableRule(conflict: ConflictData): ConflictResolutionRule | undefined {
        return this.rules.find(rule => {
            const entityMatch = rule.entityType === '*' || rule.entityType === conflict.entityType;
            const fieldMatch = !rule.field || rule.field === conflict.field;
            const conditionMatch = !rule.condition || rule.condition(conflict.localVersion, conflict.serverVersion);

            return entityMatch && fieldMatch && conditionMatch;
        });
    }

    private calculateConfidence(conflict: ConflictData, strategy: string): number {
        let confidence = 0.5; // Base confidence

        // Increase confidence for simple strategies
        if (strategy === 'server-wins' || strategy === 'client-wins') {
            confidence += 0.3;
        }

        // Adjust based on conflict type
        if (conflict.conflictType === 'field') {
            confidence += 0.1;
        }

        // Adjust based on field priority
        switch (conflict.priority) {
            case 'low': confidence += 0.2; break;
            case 'medium': confidence += 0.1; break;
            case 'high': confidence -= 0.1; break;
            case 'critical': confidence -= 0.3; break;
        }

        return Math.max(0, Math.min(1, confidence));
    }

    private mergeFieldData(conflict: ConflictData): any {
        const { localVersion, serverVersion, field } = conflict;

        // String merge
        if (typeof localVersion === 'string' && typeof serverVersion === 'string') {
            if (localVersion.includes(serverVersion) || serverVersion.includes(localVersion)) {
                return localVersion.length > serverVersion.length ? localVersion : serverVersion;
            }
            return `${localVersion} | ${serverVersion}`;
        }

        // Array merge
        if (Array.isArray(localVersion) && Array.isArray(serverVersion)) {
            const merged = [...new Set([...localVersion, ...serverVersion])];
            return merged;
        }

        // Object merge
        if (typeof localVersion === 'object' && typeof serverVersion === 'object') {
            return { ...serverVersion, ...localVersion };
        }

        // Number merge (take the more recent one based on timestamps)
        if (typeof localVersion === 'number' && typeof serverVersion === 'number') {
            // Could implement business logic here (e.g., take max for quantities)
            return serverVersion; // Default to server
        }

        return serverVersion;
    }

    private applyFieldSpecificLogic(conflict: ConflictData): any {
        const { field, localVersion, serverVersion, entityType } = conflict;

        // Status field logic
        if (field === 'status') {
            const statusPriority = {
                'completed': 5,
                'in_progress': 4,
                'assigned': 3,
                'pending': 2,
                'created': 1
            };

            const localPriority = statusPriority[localVersion as keyof typeof statusPriority] || 0;
            const serverPriority = statusPriority[serverVersion as keyof typeof statusPriority] || 0;

            return localPriority > serverPriority ? localVersion : serverVersion;
        }

        // Priority field logic
        if (field === 'priority') {
            const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'urgent': 4 };
            const localLevel = priorityOrder[localVersion as keyof typeof priorityOrder] || 1;
            const serverLevel = priorityOrder[serverVersion as keyof typeof priorityOrder] || 1;

            return localLevel > serverLevel ? localVersion : serverVersion;
        }

        // Amount field logic (for financial entities)
        if (field === 'amount' && entityType === 'invoice') {
            // Always prefer the higher amount for invoices (business rule)
            return Math.max(Number(localVersion) || 0, Number(serverVersion) || 0);
        }

        return serverVersion;
    }

    private addPendingConflict(conflict: ConflictData): void {
        const key = `${conflict.entityType}:${conflict.entityId}`;
        const existing = this.pendingConflicts.get(key) || [];
        existing.push(conflict);
        this.pendingConflicts.set(key, existing);
    }

    public getPendingConflicts(entityType?: string): ConflictData[] {
        const allConflicts: ConflictData[] = [];

        for (const [key, conflicts] of this.pendingConflicts.entries()) {
            if (!entityType || key.startsWith(entityType + ':')) {
                allConflicts.push(...conflicts);
            }
        }

        return allConflicts;
    }

    public resolvePendingConflict(
        entityType: string,
        entityId: string,
        field: string,
        resolution: ConflictResolution
    ): boolean {
        const key = `${entityType}:${entityId}`;
        const conflicts = this.pendingConflicts.get(key);

        if (conflicts) {
            const index = conflicts.findIndex(c => c.field === field);
            if (index !== -1) {
                conflicts.splice(index, 1);
                if (conflicts.length === 0) {
                    this.pendingConflicts.delete(key);
                }
                return true;
            }
        }

        return false;
    }

    public mergeData(
        localData: any,
        serverData: any,
        resolutions: Map<string, ConflictResolution>
    ): any {
        const merged = { ...serverData };

        resolutions.forEach((resolution, field) => {
            if (resolution.resolvedData !== undefined) {
                merged[field] = resolution.resolvedData;
            }
        });

        // Update timestamp to indicate merge
        merged.updated_at = new Date().toISOString();
        merged._conflict_resolved = true;
        merged._resolution_strategy = Array.from(resolutions.values())
            .map(r => r.strategy)
            .join(',');

        return merged;
    }
}

// Legacy functions for backward compatibility
export function detectConflicts(
    localData: any,
    serverData: any,
    entityType: string = 'unknown',
    entityId: string = 'unknown'
): ConflictData[] {
    return ConflictResolutionService.getInstance().detectConflicts(localData, serverData, entityType, entityId);
}

export function resolveConflict(conflict: ConflictData, strategy: ConflictResolution['strategy']): any {
    return ConflictResolutionService.getInstance().resolveConflicts([conflict]).then(resolutions => {
        const resolution = resolutions.get(conflict.field);
        return resolution?.resolvedData || conflict.serverVersion;
    });
}

export function mergeData(localData: any, serverData: any, resolutions: Map<string, ConflictResolution>): any {
    return ConflictResolutionService.getInstance().mergeData(localData, serverData, resolutions);
}

// Export the service for advanced usage
export { ConflictResolutionService };
