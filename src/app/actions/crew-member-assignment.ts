"use server";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { CrewMemberAssignment, CrewMemberAssignmentInsert, CrewMemberAssignmentUpdate } from "@/types/crew-member-assignments";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

// Get all crew member assignments for the current business
export const getCrewMemberAssignments = async (businessId: string): Promise<CrewMemberAssignment[]> => {
    const { data, error } = await fetchByBusiness("crew_member_assignments", businessId, "*", {
        orderBy: {
            column: "created_at",
            ascending: false
        }
    });

    if (error) {
        console.error("Error fetching crew member assignments:", error);
        return [];
    }

    return data || [];
};

// Create a new crew member assignment
export const createCrewMemberAssignment = async (
    businessId: string,
    assignment: CrewMemberAssignmentInsert
): Promise<CrewMemberAssignment> => {
    assignment = await applyCreated<CrewMemberAssignmentInsert>(assignment);

    const { data, error } = await insertWithBusiness("crew_member_assignments", assignment, businessId);

    if (error) {
        console.error("Error creating crew member assignment:", error);
        throw new Error("Failed to create crew member assignment");
    }

    return data;
};

export const addCrewMemberToCrew = async (businessId: string, crewId: string, memberId: string): Promise<CrewMemberAssignment> => {
    let assignment = {
        crew_id: crewId,
        crew_member_id: memberId,
        id: ""
    };

    assignment = await applyCreated<CrewMemberAssignmentInsert>(assignment);

    const { data, error } = await insertWithBusiness("crew_member_assignments", assignment as CrewMemberAssignmentInsert, businessId);
    if (error) {
        console.error("Error adding crew member to crew:", error);
        throw new Error("Failed to add crew member to crew");
    }
    return data;
};

// Update a crew member assignment
export const updateCrewMemberAssignment = async (
    businessId: string,
    id: string,
    assignment: CrewMemberAssignmentUpdate
): Promise<CrewMemberAssignment> => {
    assignment = await applyUpdated<CrewMemberAssignmentUpdate>(assignment);

    const { data, error } = await updateWithBusinessCheck("crew_member_assignments", id, assignment, businessId);

    if (error) {
        console.error("Error updating crew member assignment:", error);
        throw new Error("Failed to update crew member assignment");
    }

    return data;
};

// Delete a crew member assignment
export const deleteCrewMemberAssignment = async (businessId: string, id: string): Promise<boolean> => {
    const { error } = await deleteWithBusinessCheck("crew_member_assignments", id, businessId);

    if (error) {
        console.error("Error deleting crew member assignment:", error);
        return false;
    }

    return true;
};

// Search crew member assignments by crew member or crew
export const searchCrewMemberAssignments = async (
    businessId: string,
    searchTerm: string
): Promise<CrewMemberAssignment[]> => {
    const { data, error } = await fetchByBusiness("crew_member_assignments", businessId, "*", {
        filter: {
            or: [
                { crew_id: { ilike: `%${searchTerm}%` } },
                { crew_member_id: { ilike: `%${searchTerm}%` } }
            ]
        },
        orderBy: {
            column: "created_at",
            ascending: false
        }
    });

    if (error) {
        console.error("Error searching crew member assignments:", error);
        return [];
    }

    return data || [];
};