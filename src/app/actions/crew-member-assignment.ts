"use server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { CrewMemberAssignment, CrewMemberAssignmentInsert, CrewMemberAssignmentUpdate } from "@/types/crew-member-assignments";
import { getUserBusiness } from "@/app/actions/business";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

// Get all crew member assignments for the current business
export const getCrewMemberAssignments = async (): Promise<CrewMemberAssignment[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("crew_member_assignments", business.id, "*", {
        orderBy: {
            column: "created_at",
            ascending: false
        }
    });

    if (error) {
        console.error("Error fetching crew member assignments:", error);
        return [];
    }

    return data as unknown as CrewMemberAssignment[];
};

// Create a new crew member assignment
export const createCrewMemberAssignment = async (
    assignment: CrewMemberAssignmentInsert
): Promise<CrewMemberAssignment | null> => {
    const { business } = await withBusinessServer();

    assignment = await applyCreated<CrewMemberAssignmentInsert>(assignment);

    const { data, error } = await insertWithBusiness("crew_member_assignments", assignment, business.id);

    if (error) {
        console.error("Error creating crew member assignment:", error);
        return null;
    }

    return data as unknown as CrewMemberAssignment;
};

export const addCrewMemberToCrew = async (crewId: string, memberId: string): Promise<CrewMemberAssignment | null> => {
    const { business } = await withBusinessServer();

    let assignment = {
        crew_id: crewId,
        crew_member_id: memberId,
        id: ""
    };

    assignment = await applyCreated<CrewMemberAssignmentInsert>(assignment);


    const { data, error } = await insertWithBusiness("crew_member_assignments", assignment as CrewMemberAssignmentInsert, business.id);
    if (error) {
        console.error("Error adding crew member to crew:", error);
        return null;
    }
    return data as unknown as CrewMemberAssignment;
};

// Update a crew member assignment
export const updateCrewMemberAssignment = async (
    id: string,
    assignment: CrewMemberAssignmentUpdate
): Promise<CrewMemberAssignment | null> => {
    const { business } = await withBusinessServer();

    assignment = await applyUpdated<CrewMemberAssignmentUpdate>(assignment);

    const { data, error } = await updateWithBusinessCheck("crew_member_assignments", id, assignment, business.id);

    if (error) {
        console.error("Error updating crew member assignment:", error);
        return null;
    }

    return data as unknown as CrewMemberAssignment;
};

// Delete a crew member assignment
export const deleteCrewMemberAssignment = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("crew_member_assignments", id, business.id);

    if (error) {
        console.error("Error deleting crew member assignment:", error);
        return false;
    }

    return true;
};

// Search crew member assignments by crew member or crew
export const searchCrewMemberAssignments = async (
    searchTerm: string
): Promise<CrewMemberAssignment[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("crew_member_assignments", business.id, "*", {
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

    return data as unknown as CrewMemberAssignment[];
};