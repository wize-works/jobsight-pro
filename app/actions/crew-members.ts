"use server";
import { getCrewMembersByCrewId } from "@/app/actions/crews";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { CrewMember, CrewMemberInsert, CrewMemberUpdate } from "@/types/crew-members";
import { getUserBusiness } from "@/app/actions/business";

export const getCrewMembers = async (): Promise<CrewMember[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch crew members.");
        return [];
    }

    const { data, error } = await fetchByBusiness("crew_members", businessId);

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

    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch crew members.");
        return null;
    }

    const { data, error } = await fetchByBusiness("crew_members", businessId, id);

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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a crew member.");
        return null;
    }

    const { data, error } = await insertWithBusiness("crew_members", crewMember, businessId);

    if (error) {
        console.error("Error creating crew member:", error);
        return null;
    }

    return data as unknown as CrewMember;
};

export const updateCrewMember = async (id: string, crewMember: CrewMemberUpdate): Promise<CrewMember | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a crew member.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("crew_members", id, crewMember, businessId);

    if (error) {
        console.error("Error updating crew member:", error);
        return null;
    }

    return data as unknown as CrewMember;
};

export const deleteCrewMember = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a crew member.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("crew_members", id, businessId);

    if (error) {
        console.error("Error deleting crew member:", error);
        return false;
    }

    // Also delete crew member assignments
    await getCrewMembersByCrewId(id);

    return true;
};

export const searchCrewMembers = async (searchTerm: string): Promise<CrewMember[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search crew members.");
        return [];
    }

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
        return [] as CrewMember[];
    }

    return data as unknown as CrewMember[];
};