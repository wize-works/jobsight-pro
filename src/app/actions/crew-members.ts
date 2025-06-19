"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { CrewMember, CrewMemberInsert, CrewMemberUpdate } from "@/types/crew-members";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { CrewMemberAssignment } from "@/types/crew-member-assignments";

export const getCrewMembers = async (businessId: string): Promise<CrewMember[]> => {
    const { data, error } = await fetchByBusiness("crew_members", businessId);

    if (error) {
        console.error("Error fetching crew members:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
};

export const getCrewMemberById = async (businessId: string, id: string): Promise<CrewMember | null> => {
    if (businessId === "undefined" || !id) {
        console.error("Invalid businessId or id provided");
        return null;
    }

    const { data, error } = await fetchByBusiness("crew_members", businessId, "*", {
        filter: { id },
    });

    if (error) {
        console.error("Error fetching crew member by ID:", error);
        throw new Error("Failed to fetch crew member");
    }

    if (data && data[0]) {
        return data[0];
    }

    return null;
};

export const createCrewMember = async (businessId: string, crewMember: CrewMemberInsert): Promise<CrewMember> => {
    crewMember = await applyCreated<CrewMemberInsert>(crewMember);

    const { data, error } = await insertWithBusiness("crew_members", crewMember, businessId);

    if (error) {
        console.error("Error creating crew member:", error);
        throw new Error("Failed to create crew member");
    }

    return data;
};

export const updateCrewMember = async (businessId: string, id: string, crewMember: CrewMemberUpdate): Promise<CrewMember> => {
    crewMember = await applyUpdated<CrewMemberUpdate>(crewMember);

    const { data, error } = await updateWithBusinessCheck("crew_members", id, crewMember, businessId);

    if (error) {
        console.error("Error updating crew member:", error);
        throw new Error("Failed to update crew member");
    }

    return data;
};

export const deleteCrewMember = async (businessId: string, id: string): Promise<boolean> => {
    const { error } = await deleteWithBusinessCheck("crew_members", id, businessId);

    if (error) {
        console.error("Error deleting crew member:", error);
        return false;
    }

    // Also delete crew member assignments
    await getCrewMembersByCrewId(businessId, id);

    return true;
};

export const searchCrewMembers = async (businessId: string, searchTerm: string): Promise<CrewMember[]> => {
    const { data, error } = await fetchByBusiness("crew_members", businessId, "*", {
        filter: {
            or: [
                { first_name: { ilike: `%${searchTerm}%` } },
                { last_name: { ilike: `%${searchTerm}%` } },
                { email: { ilike: `%${searchTerm}%` } },
                { phone_number: { ilike: `%${searchTerm}%` } }
            ]
        },
        orderBy: {
            column: "created_at",
            ascending: false
        }
    });

    if (error) {
        console.error("Error searching crew members:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
};

export const getCrewMembersByCrewId = async (businessId: string, id: string): Promise<CrewMember[]> => {
    const { data: assignments, error: assignmentsError } = await fetchByBusiness("crew_member_assignments", businessId, "*", {
        filter: { crew_id: id },
        orderBy: { column: "created_at", ascending: false }
    });

    if (assignmentsError) {
        console.error("Error fetching crew member assignments:", assignmentsError);
        return [];
    }

    if (!assignments || assignments.length === 0) {
        return [];
    }

    const assightmentsIds = assignments.map(assignment => assignment.crew_member_id) || [];

    const { data, error } = await fetchByBusiness("crew_members", businessId, "*", {
        filter: { id: { in: assightmentsIds } },
        orderBy: { column: "created_at", ascending: false }
    });

    if (error) {
        console.error("Error fetching crew members:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
};