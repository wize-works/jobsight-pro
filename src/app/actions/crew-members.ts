"use server";
import { getCrewMembersByCrewId } from "@/app/actions/crews";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { CrewMember, CrewMemberInsert, CrewMemberUpdate } from "@/types/crew-members";
import { getUserBusiness } from "@/app/actions/business";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getCrewMembers = async (): Promise<CrewMember[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("crew_members", business.id);

    if (error) {
        console.error("Error fetching crew members:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as CrewMember[];
    }

    return data as unknown as CrewMember[];
}

export const getCrewMemberById = async (id: string): Promise<CrewMember | null> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("crew_members", business.id, "*", {
        filter: { id },
    });

    if (error) {
        console.error("Error fetching crew member by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as CrewMember;
    }

    return null;
};

export const createCrewMember = async (crewMember: CrewMemberInsert): Promise<CrewMember | null> => {
    const { business } = await withBusinessServer();

    crewMember = await applyCreated<CrewMemberInsert>(crewMember);

    const { data, error } = await insertWithBusiness("crew_members", crewMember, business.id);

    if (error) {
        console.error("Error creating crew member:", error);
        return null;
    }

    return data as unknown as CrewMember;
};

export const updateCrewMember = async (id: string, crewMember: CrewMemberUpdate): Promise<CrewMember | null> => {
    const { business } = await withBusinessServer();

    crewMember = await applyUpdated<CrewMemberUpdate>(crewMember);

    const { data, error } = await updateWithBusinessCheck("crew_members", id, crewMember, business.id);

    if (error) {
        console.error("Error updating crew member:", error);
        return null;
    }

    return data as unknown as CrewMember;
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
        return [] as CrewMember[];
    }

    return data as unknown as CrewMember[];
};