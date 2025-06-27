/**
 * Client-Side Crew Members Actions
 * 
 * Replaces src/app/actions/crew-members.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from "@/types/supabase";
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from "@/lib/actions/client-action-factory";
import { v4 as uuidv4 } from 'uuid';

// Extract Supabase types for crew members
type CrewMember = Database['public']['Tables']['crew_members']['Row'];
type CrewMemberInsert = Database['public']['Tables']['crew_members']['Insert'];
type CrewMemberUpdate = Partial<Database['public']['Tables']['crew_members']['Update']> & { id: string };

// Create client-side crew member actions
const insertCrewMember = createInsertAction('crew_members', 'high');
const updateCrewMember = createUpdateAction('crew_members', 'high');
const deleteCrewMember = createDeleteAction('crew_members', 'high');
const selectCrewMembers = createSelectAction('crew_members');

/**
 * Get all crew members for a business - works offline
 */
export const getCrewMembers = async (businessId: string): Promise<CrewMember[]> => {
    try {
        const result = await selectCrewMembers({}, businessId);

        if (result.error) {
            console.error("Error fetching crew members:", result.error);
            return [];
        }

        return (result.data || []) as CrewMember[];
    } catch (err) {
        console.error("Error in getCrewMembers:", err);
        return [];
    }
};

/**
 * Get a crew member by ID - works offline
 */
export const getCrewMemberById = async (businessId: string, id: string): Promise<CrewMember | null> => {
    try {
        if (!businessId || businessId === "undefined" || !id) {
            console.error("Invalid businessId or id provided");
            return null;
        }

        const result = await selectCrewMembers({ id }, businessId);

        if (result.error) {
            console.error("Error fetching crew member:", result.error);
            return null;
        }

        const crewMembers = (result.data || []) as CrewMember[];
        return crewMembers.length > 0 ? crewMembers[0] : null;
    } catch (err) {
        console.error("Error in getCrewMemberById:", err);
        return null;
    }
};

/**
 * Create a new crew member - works offline
 */
export const createCrewMember = async (
    businessId: string,
    crewMember: Omit<CrewMemberInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<CrewMember | null> => {
    try {
        const newCrewMember: CrewMemberInsert = {
            ...crewMember,
            id: uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const result = await insertCrewMember(newCrewMember, businessId);

        if (result.error) {
            console.error("Error creating crew member:", result.error);
            return null;
        }

        return result.data as CrewMember;
    } catch (err) {
        console.error("Error in createCrewMember:", err);
        return null;
    }
};

/**
 * Update a crew member - works offline
 */
export const updateCrewMemberById = async (
    businessId: string,
    id: string,
    updates: Partial<CrewMemberUpdate>
): Promise<CrewMember | null> => {
    try {
        const updateData: CrewMemberUpdate = {
            ...updates,
            id,
            updated_at: new Date().toISOString()
        };

        const result = await updateCrewMember(updateData, businessId);

        if (result.error) {
            console.error("Error updating crew member:", result.error);
            return null;
        }

        return result.data as CrewMember;
    } catch (err) {
        console.error("Error in updateCrewMemberById:", err);
        return null;
    }
};

/**
 * Delete a crew member - works offline
 */
export const deleteCrewMemberById = async (businessId: string, id: string): Promise<boolean> => {
    try {
        const result = await deleteCrewMember({ id }, businessId);

        if (result.error) {
            console.error("Error deleting crew member:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteCrewMemberById:", err);
        return false;
    }
};

/**
 * Search crew members by query - works offline
 */
export const searchCrewMembers = async (businessId: string, searchTerm: string): Promise<CrewMember[]> => {
    try {
        const allCrewMembers = await getCrewMembers(businessId);
        const searchQuery = searchTerm.toLowerCase();

        return allCrewMembers.filter((member: CrewMember) =>
            member.name?.toLowerCase().includes(searchQuery) ||
            member.email?.toLowerCase().includes(searchQuery) ||
            member.phone?.toLowerCase().includes(searchQuery) ||
            member.role?.toLowerCase().includes(searchQuery)
        );
    } catch (err) {
        console.error("Error in searchCrewMembers:", err);
        return [];
    }
};

/**
 * Get crew members by crew ID - works offline
 */
export const getCrewMembersByCrewId = async (businessId: string, crewId: string): Promise<CrewMember[]> => {
    try {
        // Import the crew member assignments functions
        const { getCrewMemberAssignmentsByCrewId } = await import('./crew-member-assignments-client');

        // Get all assignments for the crew
        const assignments = await getCrewMemberAssignmentsByCrewId(businessId, crewId);

        if (assignments.length === 0) {
            return [];
        }

        // Get all crew members and filter by the assigned member IDs
        const allCrewMembers = await getCrewMembers(businessId);
        const assignedMemberIds = assignments.map(a => a.crew_member_id);

        return allCrewMembers.filter(member => assignedMemberIds.includes(member.id));
    } catch (err) {
        console.error("Error in getCrewMembersByCrewId:", err);
        return [];
    }
};

/**
 * Get crew member by email - works offline
 */
export const getCrewMemberByEmail = async (businessId: string, email: string): Promise<CrewMember | null> => {
    try {
        const allCrewMembers = await getCrewMembers(businessId);
        return allCrewMembers.find(member => member.email === email) || null;
    } catch (err) {
        console.error("Error in getCrewMemberByEmail:", err);
        return null;
    }
};

/**
 * Get active crew members - works offline
 */
export const getActiveCrewMembers = async (businessId: string): Promise<CrewMember[]> => {
    try {
        const allCrewMembers = await getCrewMembers(businessId);
        return allCrewMembers.filter(member => member.status === 'active');
    } catch (err) {
        console.error("Error in getActiveCrewMembers:", err);
        return [];
    }
};

/**
 * Validate crew member data
 */
export const validateCrewMember = (crewMember: Partial<CrewMemberInsert>): string[] => {
    const errors: string[] = [];

    if (!crewMember.name || crewMember.name.trim().length === 0) {
        errors.push('Name is required');
    }

    if (crewMember.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(crewMember.email)) {
        errors.push('Invalid email format');
    }

    if (crewMember.phone && crewMember.phone.length > 0 &&
        !/^[\+]?[1-9][\d]{0,15}$/.test(crewMember.phone.replace(/\s|-|\(|\)/g, ''))) {
        errors.push('Invalid phone number format');
    }

    return errors;
};

/**
 * Get crew member statistics - works offline
 */
export const getCrewMemberStats = async (businessId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    withEmail: number;
    withPhone: number;
}> => {
    try {
        const crewMembers = await getCrewMembers(businessId);

        return {
            total: crewMembers.length,
            active: crewMembers.filter(m => m.status === 'active').length,
            inactive: crewMembers.filter(m => m.status === 'inactive').length,
            withEmail: crewMembers.filter(m => m.email && m.email.trim().length > 0).length,
            withPhone: crewMembers.filter(m => m.phone && m.phone.trim().length > 0).length
        };
    } catch (err) {
        console.error("Error in getCrewMemberStats:", err);
        return { total: 0, active: 0, inactive: 0, withEmail: 0, withPhone: 0 };
    }
};
