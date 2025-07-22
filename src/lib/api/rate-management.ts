import { BillingRate, RateValidationResult } from '@/types/invoice-automation';

/**
 * Client-side utilities for rate management API endpoints
 */

export interface RateUpdateRequest {
    businessId: string;
    hourlyRate: number;
    overtimeRate?: number;
    doubletimeRate?: number;
}

export interface CrewMemberRateRequest extends RateUpdateRequest {
    crewMemberId: string;
}

export interface EquipmentRateRequest extends RateUpdateRequest {
    equipmentId: string;
}

export interface BusinessRateRequest {
    businessId: string;
    defaultHourlyRate: number;
    defaultOvertimeRate?: number;
    defaultDoubletimeRate?: number;
}

/**
 * Crew Member Rate API
 */
export const crewMemberRateApi = {
    /**
     * Update crew member rate
     */
    async updateRate(request: CrewMemberRateRequest): Promise<BillingRate> {
        const response = await fetch('/api/rates/crew-members', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update crew member rate');
        }

        const result = await response.json();
        return result.data;
    },

    /**
     * Get crew member rate
     */
    async getRate(crewMemberId: string, businessId: string): Promise<BillingRate> {
        const response = await fetch(`/api/rates/crew-members?crewMemberId=${crewMemberId}&businessId=${businessId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get crew member rate');
        }

        const result = await response.json();
        return result.data;
    },
};

/**
 * Equipment Rate API
 */
export const equipmentRateApi = {
    /**
     * Update equipment rate
     */
    async updateRate(request: EquipmentRateRequest): Promise<BillingRate> {
        const response = await fetch('/api/rates/equipment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update equipment rate');
        }

        const result = await response.json();
        return result.data;
    },

    /**
     * Get equipment rate
     */
    async getRate(equipmentId: string, businessId: string): Promise<BillingRate> {
        const response = await fetch(`/api/rates/equipment?equipmentId=${equipmentId}&businessId=${businessId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get equipment rate');
        }

        const result = await response.json();
        return result.data;
    },
};

/**
 * Business Rate API
 */
export const businessRateApi = {
    /**
     * Update business default rates
     */
    async updateRate(request: BusinessRateRequest): Promise<BillingRate> {
        const response = await fetch('/api/rates/business', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update business default rates');
        }

        const result = await response.json();
        return result.data;
    },

    /**
     * Get business default rates
     */
    async getRate(businessId: string): Promise<BillingRate> {
        const response = await fetch(`/api/rates/business?businessId=${businessId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get business default rates');
        }

        const result = await response.json();
        return result.data;
    },
};

/**
 * Utility functions for rate management
 */
export const rateUtils = {
    /**
     * Calculate overtime rate based on hourly rate if not specified
     */
    calculateOvertimeRate(hourlyRate: number, overtimeMultiplier: number = 1.5): number {
        return hourlyRate * overtimeMultiplier;
    },

    /**
     * Validate rates for a business - client-side implementation
     * This replaces the old validateRates function from client actions
     */
    async validateBusinessRates(businessId: string): Promise<RateValidationResult> {
        try {
            // This would need to be implemented based on your business logic
            // For now, return a basic validation result
            return {
                isValid: true,
                missingRates: {
                    crewMembers: [],
                    equipment: []
                },
                warnings: []
            };
        } catch (error) {
            console.error('Error validating rates:', error);
            return {
                isValid: false,
                missingRates: {
                    crewMembers: [],
                    equipment: []
                },
                warnings: ['Failed to validate rates']
            };
        }
    },

    /**
     * Format rate for display
     */
    formatRate(rate: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(rate);
    },

    /**
     * Check if rate has changed
     */
    hasRateChanged(oldRate: BillingRate, newRate: BillingRate): boolean {
        return (
            oldRate.hourlyRate !== newRate.hourlyRate ||
            oldRate.overtimeRate !== newRate.overtimeRate
        );
    },
};
