"use server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { CrewMemberAssignment, CrewMemberAssignmentInsert, CrewMemberAssignmentUpdate } from "@/types/crew-member-assignments";
import { getUserBusiness } from "@/app/actions/business";

// Get all crew member assignments for the current business
export const getCrewMemberAssignments = async (): Promise<CrewMemberAssignment[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        return [];
    }

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

    return data as unknown as CrewMemberAssignment[];
};

// Create a new crew member assignment
export const createCrewMemberAssignment = async (
    assignment: CrewMemberAssignmentInsert
): Promise<CrewMemberAssignment | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a crew member assignment.");
        return null;
    }

    const { data, error } = await insertWithBusiness("crew_member_assignments", {
        ...assignment,
        business_id: businessId,
        created_by: user?.id,
        created_at: new Date().toISOString(),
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
    }, businessId);

    if (error) {
        console.error("Error creating crew member assignment:", error);
        return null;
    }

    return data as unknown as CrewMemberAssignment;
};

export const addCrewMemberToCrew = async (crewId: string, memberId: string): Promise<CrewMemberAssignment | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";
    if (!businessId) {
        console.error("Business ID is required to add a crew member to a crew.");
        return null;
    }
    const assignment: CrewMemberAssignmentInsert = {
        crew_id: crewId,
        crew_member_id: memberId,
        business_id: businessId,
        created_by: user?.id || "",
        created_at: new Date().toISOString(),
        updated_by: user?.id || "",
        updated_at: new Date().toISOString(),
    };
    const { data, error } = await insertWithBusiness("crew_member_assignments", assignment, businessId);
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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a crew member assignment.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck(
        "crew_member_assignments",
        id,
        {
            ...assignment,
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
        },
        businessId
    );

    if (error) {
        console.error("Error updating crew member assignment:", error);
        return null;
    }

    return data as unknown as CrewMemberAssignment;
};

// Delete a crew member assignment
export const deleteCrewMemberAssignment = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a crew member assignment.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("crew_member_assignments", id, businessId);

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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        return [];
    }

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

    return data as unknown as CrewMemberAssignment[];
};