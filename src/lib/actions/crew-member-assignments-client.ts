/**
 * Client-Side Crew Member Assignments Actions
 * 
 * Replaces src/app/actions/crew-member-assignment.ts with offline-first implementation.
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

// Extract Supabase types for crew member assignments
type CrewMemberAssignment = Database['public']['Tables']['crew_member_assignments']['Row'];
type CrewMemberAssignmentInsert = Database['public']['Tables']['crew_member_assignments']['Insert'];
type CrewMemberAssignmentUpdate = Partial<Database['public']['Tables']['crew_member_assignments']['Update']> & { id: string };

// Create client-side crew member assignment actions
const insertCrewMemberAssignment = createInsertAction('crew_member_assignments', 'high');
const updateCrewMemberAssignment = createUpdateAction('crew_member_assignments', 'high');
const deleteCrewMemberAssignment = createDeleteAction('crew_member_assignments', 'high');
const selectCrewMemberAssignments = createSelectAction('crew_member_assignments');

/**
 * Get all crew member assignments for a business - works offline
 */
export const getCrewMemberAssignments = async (businessId: string): Promise<CrewMemberAssignment[]> => {
    try {
        const result = await selectCrewMemberAssignments({}, businessId);

        if (result.error) {
            console.error("Error fetching crew member assignments:", result.error);
            return [];
        }

        return (result.data || []) as CrewMemberAssignment[];
    } catch (err) {
        console.error("Error in getCrewMemberAssignments:", err);
        return [];
    }
};

/**
 * Get crew member assignment by ID - works offline
 */
export const getCrewMemberAssignmentById = async (businessId: string, id: string): Promise<CrewMemberAssignment | null> => {
    try {
        const result = await selectCrewMemberAssignments({ id }, businessId);

        if (result.error) {
            console.error("Error fetching crew member assignment:", result.error);
            return null;
        }

        const assignments = (result.data || []) as CrewMemberAssignment[];
        return assignments.length > 0 ? assignments[0] : null;
    } catch (err) {
        console.error("Error in getCrewMemberAssignmentById:", err);
        return null;
    }
};

/**
 * Create a new crew member assignment - works offline
 */
export const createCrewMemberAssignment = async (
    businessId: string,
    assignment: Omit<CrewMemberAssignmentInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<CrewMemberAssignment | null> => {
    try {
        const newAssignment: CrewMemberAssignmentInsert = {
            ...assignment,
            id: uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const result = await insertCrewMemberAssignment(newAssignment, businessId);

        if (result.error) {
            console.error("Error creating crew member assignment:", result.error);
            return null;
        }

        return result.data as CrewMemberAssignment;
    } catch (err) {
        console.error("Error in createCrewMemberAssignment:", err);
        return null;
    }
};

/**
 * Add a crew member to a crew - works offline
 */
export const addCrewMemberToCrew = async (businessId: string, crewId: string, memberId: string): Promise<CrewMemberAssignment | null> => {
    try {
        return await createCrewMemberAssignment(businessId, {
            crew_id: crewId,
            crew_member_id: memberId,
            business_id: businessId
        });
    } catch (err) {
        console.error("Error in addCrewMemberToCrew:", err);
        return null;
    }
};

/**
 * Remove a crew member from a crew - works offline
 */
export const removeCrewMemberFromCrew = async (businessId: string, crewId: string, memberId: string): Promise<boolean> => {
    try {
        const allAssignments = await getCrewMemberAssignments(businessId);
        const assignment = allAssignments.find(a => a.crew_id === crewId && a.crew_member_id === memberId);

        if (!assignment) {
            console.warn("Crew member assignment not found");
            return false;
        }

        const result = await deleteCrewMemberAssignment({ id: assignment.id }, businessId);

        if (result.error) {
            console.error("Error removing crew member from crew:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in removeCrewMemberFromCrew:", err);
        return false;
    }
};

/**
 * Get crew member assignments by crew ID - works offline
 */
export const getCrewMemberAssignmentsByCrewId = async (businessId: string, crewId: string): Promise<CrewMemberAssignment[]> => {
    try {
        const allAssignments = await getCrewMemberAssignments(businessId);
        return allAssignments.filter(assignment => assignment.crew_id === crewId);
    } catch (err) {
        console.error("Error in getCrewMemberAssignmentsByCrewId:", err);
        return [];
    }
};

/**
 * Get crew member assignments by member ID - works offline
 */
export const getCrewMemberAssignmentsByMemberId = async (businessId: string, memberId: string): Promise<CrewMemberAssignment[]> => {
    try {
        const allAssignments = await getCrewMemberAssignments(businessId);
        return allAssignments.filter(assignment => assignment.crew_member_id === memberId);
    } catch (err) {
        console.error("Error in getCrewMemberAssignmentsByMemberId:", err);
        return [];
    }
};

/**
 * Check if a crew member is assigned to a crew - works offline
 */
export const isCrewMemberAssignedToCrew = async (businessId: string, crewId: string, memberId: string): Promise<boolean> => {
    try {
        const allAssignments = await getCrewMemberAssignments(businessId);
        return allAssignments.some(assignment => assignment.crew_id === crewId && assignment.crew_member_id === memberId);
    } catch (err) {
        console.error("Error in isCrewMemberAssignedToCrew:", err);
        return false;
    }
};

/**
 * Get crew assignment statistics - works offline
 */
export const getCrewAssignmentStats = async (businessId: string): Promise<{
    totalAssignments: number;
    uniqueCrews: number;
    uniqueMembers: number;
    averageAssignmentsPerCrew: number;
    averageAssignmentsPerMember: number;
}> => {
    try {
        const assignments = await getCrewMemberAssignments(businessId);
        const uniqueCrews = new Set(assignments.map(a => a.crew_id)).size;
        const uniqueMembers = new Set(assignments.map(a => a.crew_member_id)).size;

        return {
            totalAssignments: assignments.length,
            uniqueCrews,
            uniqueMembers,
            averageAssignmentsPerCrew: uniqueCrews > 0 ? assignments.length / uniqueCrews : 0,
            averageAssignmentsPerMember: uniqueMembers > 0 ? assignments.length / uniqueMembers : 0
        };
    } catch (err) {
        console.error("Error in getCrewAssignmentStats:", err);
        return {
            totalAssignments: 0,
            uniqueCrews: 0,
            uniqueMembers: 0,
            averageAssignmentsPerCrew: 0,
            averageAssignmentsPerMember: 0
        };
    }
};

/**
 * Bulk assign crew members to a crew - works offline
 */
export const bulkAssignCrewMembers = async (businessId: string, crewId: string, memberIds: string[]): Promise<CrewMemberAssignment[]> => {
    try {
        const assignmentPromises = memberIds.map(memberId =>
            addCrewMemberToCrew(businessId, crewId, memberId)
        );

        const results = await Promise.all(assignmentPromises);
        return results.filter(result => result !== null) as CrewMemberAssignment[];
    } catch (err) {
        console.error("Error in bulkAssignCrewMembers:", err);
        return [];
    }
};

/**
 * Remove all crew members from a crew - works offline
 */
export const removeAllCrewMembersFromCrew = async (businessId: string, crewId: string): Promise<boolean> => {
    try {
        const assignments = await getCrewMemberAssignmentsByCrewId(businessId, crewId);

        const deletePromises = assignments.map(assignment =>
            deleteCrewMemberAssignment({ id: assignment.id }, businessId)
        );

        const results = await Promise.all(deletePromises);
        return results.every(result => !result.error);
    } catch (err) {
        console.error("Error in removeAllCrewMembersFromCrew:", err);
        return false;
    }
};
