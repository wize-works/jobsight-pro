"use server";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { CrewMember, CrewMemberInsert, CrewMemberUpdate } from "@/types/crew-members";
import { getUserBusiness } from "@/app/actions/business";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { CrewMemberAssignment } from "@/types/crew-member-assignments";

export const getCrewMembers = async (): Promise<CrewMember[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("crew_members", business.id);

    if (error) {
        console.error("Error fetching crew members:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
}

export const getCrewMemberById = async (id: string): Promise<CrewMember | null> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("crew_members", business.id, "*", {
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

export const createCrewMember = async (crewMember: CrewMemberInsert): Promise<CrewMember> => {
    const { business } = await withBusinessServer();

    crewMember = await applyCreated<CrewMemberInsert>(crewMember);

    const { data, error } = await insertWithBusiness("crew_members", crewMember, business.id);

    if (error) {
        console.error("Error creating crew member:", error);
        throw new Error("Failed to create crew member");
    }

    return data;
};

export const updateCrewMember = async (id: string, crewMember: CrewMemberUpdate): Promise<CrewMember> => {
    const { business } = await withBusinessServer();

    crewMember = await applyUpdated<CrewMemberUpdate>(crewMember);

    const { data, error } = await updateWithBusinessCheck("crew_members", id, crewMember, business.id);

    if (error) {
        console.error("Error updating crew member:", error);
        throw new Error("Failed to update crew member");
    }

    return data;
};

export const deleteCrewMember = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("crew_members", id, business.id);

    if (error) {
        console.error("Error deleting crew member:", error);
        return false;
    }

    // Also delete crew member assignments
    await getCrewMembersByCrewId(id);

    return true;
};

export const searchCrewMembers = async (searchTerm: string): Promise<CrewMember[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("crew_members", business.id, "*", {
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


export const getCrewMembersByCrewId = async (id: string): Promise<CrewMember[]> => {
    const { business } = await withBusinessServer();

    const { data: assignments, error: assignmentsError } = await fetchByBusiness("crew_member_assignments", business.id, "*", {
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

    const { data, error } = await fetchByBusiness("crew_members", business.id, "*", {
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
}