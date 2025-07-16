import { CrewMember } from '@/types/crew-members';
import { Equipment } from '@/types/equipment';

/**
 * Client-side utilities for crew members and equipment API endpoints
 */

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
}

/**
 * Crew Members API
 */
export const crewMembersApi = {
    /**
     * Get all crew members for a business
     */
    async getAll(businessId: string): Promise<CrewMember[]> {
        const response = await fetch(`/api/crew-members?businessId=${businessId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch crew members');
        }

        const result: ApiResponse<CrewMember[]> = await response.json();
        return result.data;
    },

    /**
     * Get crew member by ID
     */
    async getById(crewMemberId: string, businessId: string): Promise<CrewMember> {
        const response = await fetch(`/api/crew-members?businessId=${businessId}&id=${crewMemberId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch crew member');
        }

        const result: ApiResponse<CrewMember> = await response.json();
        return result.data;
    },
};

/**
 * Equipment API
 */
export const equipmentApi = {
    /**
     * Get all equipment for a business
     */
    async getAll(businessId: string): Promise<Equipment[]> {
        const response = await fetch(`/api/equipment?businessId=${businessId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch equipment');
        }

        const result: ApiResponse<Equipment[]> = await response.json();
        return result.data;
    },

    /**
     * Get equipment by ID
     */
    async getById(equipmentId: string, businessId: string): Promise<Equipment> {
        const response = await fetch(`/api/equipment?businessId=${businessId}&id=${equipmentId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch equipment');
        }

        const result: ApiResponse<Equipment> = await response.json();
        return result.data;
    },
};

/**
 * Combined utilities for easier usage
 */
export const businessDataApi = {
    /**
     * Get both crew members and equipment for a business
     */
    async getAll(businessId: string): Promise<{ crewMembers: CrewMember[], equipment: Equipment[] }> {
        const [crewMembers, equipment] = await Promise.all([
            crewMembersApi.getAll(businessId),
            equipmentApi.getAll(businessId)
        ]);

        return { crewMembers, equipment };
    },
};
