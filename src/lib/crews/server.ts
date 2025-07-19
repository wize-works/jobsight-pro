import { createServerClient } from '@/lib/supabase';
import { serverFetchByBusiness, serverDeleteWithBusinessCheck, serverUpdateWithBusinessCheck, serverInsertWithBusiness } from '@/lib/db';
import { Crew, CrewInsert, CrewUpdate } from '@/types/crews';

/**
 * Server-side utility to get all crews for a business
 * Replaces server action for API route usage
 */
export async function getCrewsServer(businessId: string): Promise<Crew[]> {
    try {
        const { data, error } = await serverFetchByBusiness("crews", businessId, "*", {
            orderBy: { column: "name", ascending: true },
        });

        if (error) {
            console.error("Error fetching crews:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        return data as unknown as Crew[];
    } catch (err) {
        console.error("Error in getCrewsServer:", err);
        return [];
    }
}

/**
 * Server-side utility to get a crew by ID
 * Replaces server action for API route usage
 */
export async function getCrewByIdServer(businessId: string, id: string): Promise<Crew | null> {
    try {
        const { data, error } = await serverFetchByBusiness("crews", businessId, "*", {
            filter: { id }
        });

        if (error) {
            console.error("Error fetching crew by ID:", error);
            return null;
        }

        if (data && data.length > 0) {
            return data[0] as unknown as Crew;
        }

        return null;
    } catch (err) {
        console.error("Error in getCrewByIdServer:", err);
        return null;
    }
}

/**
 * Server-side utility to create a new crew
 * Replaces server action for API route usage
 */
export async function createCrewServer(businessId: string, userId: string, crew: CrewInsert): Promise<Crew | null> {
    try {
        const crewWithTimestamp = {
            ...crew,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await serverInsertWithBusiness(
            "crews",
            crewWithTimestamp,
            businessId,
            userId
        );

        if (error) {
            console.error("Error creating crew:", error);
            return null;
        }

        return data as unknown as Crew;
    } catch (err) {
        console.error("Error in createCrewServer:", err);
        return null;
    }
}

/**
 * Server-side utility to update a crew
 * Replaces server action for API route usage
 */
export async function updateCrewServer(businessId: string, userId: string, id: string, crew: CrewUpdate): Promise<Crew | null> {
    try {
        const crewWithTimestamp = {
            ...crew,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await serverUpdateWithBusinessCheck(
            "crews",
            id,
            crewWithTimestamp,
            businessId,
            userId
        );

        if (error) {
            console.error("Error updating crew:", error);
            return null;
        }

        return data as unknown as Crew;
    } catch (err) {
        console.error("Error in updateCrewServer:", err);
        return null;
    }
}

/**
 * Server-side utility to delete a crew
 * Replaces server action for API route usage
 */
export async function deleteCrewServer(businessId: string, id: string): Promise<boolean> {
    try {
        const { error } = await serverDeleteWithBusinessCheck("crews", id, businessId);

        if (error) {
            console.error("Error deleting crew:", error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteCrewServer:", err);
        return false;
    }
}

/**
 * Server-side utility to search crews
 * Replaces server action for API route usage
 */
export async function searchCrewsServer(businessId: string, query: string): Promise<Crew[]> {
    try {
        const { data, error } = await serverFetchByBusiness("crews", businessId, "*", {
            filter: {
                or: [
                    { name: { ilike: `%${query}%` } },
                    { leader: { ilike: `%${query}%` } },
                ],
            },
            orderBy: { column: "name", ascending: true },
        });

        if (error) {
            console.error("Error searching crews:", error);
            return [];
        }

        return (data as unknown as Crew[]) || [];
    } catch (err) {
        console.error("Error in searchCrewsServer:", err);
        return [];
    }
}

/**
 * Server-side utility to get available crews (not assigned to specific project)
 * Replaces server action for API route usage
 */
export async function getAvailableCrewsServer(businessId: string): Promise<Crew[]> {
    try {
        // For now, return all crews - this could be enhanced with project filtering
        return await getCrewsServer(businessId);
    } catch (err) {
        console.error("Error in getAvailableCrewsServer:", err);
        return [];
    }
}

/**
 * Server-side utility to get available crews with member information
 * Replaces server action for API route usage
 */
export async function getAvailableCrewsWithMemberInfoServer(businessId: string): Promise<any[]> {
    try {
        const supabase = createServerClient();
        if (!supabase) {
            console.error("Supabase client not initialized");
            return [];
        }

        const { data, error } = await supabase
            .from('crews')
            .select(`
                *,
                leader:crew_members!crews_leader_id_fkey(id, first_name, last_name),
                crew_member_assignments(id, crew_member_id)
            `)
            .eq('business_id', businessId)
            .order('name', { ascending: true });

        if (error) {
            console.error("Error fetching crews with member info:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        // Transform the data to include member count and leader name
        const crewsWithMemberInfo = data.map((crew: any) => ({
            ...crew,
            member_count: crew.crew_member_assignments?.length || 0,
            leader_name: crew.leader ? `${crew.leader.first_name} ${crew.leader.last_name}`.trim() : null
        }));

        return crewsWithMemberInfo;
    } catch (err) {
        console.error("Error in getAvailableCrewsWithMemberInfoServer:", err);
        return [];
    }
}
