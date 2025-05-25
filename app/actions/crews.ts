"use server";
import type { Crew, CrewWithDetails } from "@/types/crews";
import type { CrewInsert, CrewUpdate } from "@/types/crews";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { ProjectCrew, ProjectCrewWithDetails } from "@/types/project-crews";
import { Project } from "@/types/projects";
import { CrewMember, CrewMemberUpdate } from "@/types/crew-members";
import { EquipmentAssignment } from "@/types/equipment-assignments";
import { Equipment } from "@/types/equipments";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getUserBusiness } from "@/lib/business";
import { CrewMemberAssignment } from "@/types/crew-member-assignments";
import { EquipmentWithAssignment, EquipmentWithAssignments } from "@/types/equipments";

export const getCrews = async (): Promise<Crew[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a crew.");
        return [] as Crew[];
    }

    const { data, error } = await fetchByBusiness("crews", businessId, "*", {
        orderBy: { column: "name", ascending: true },
    });
    if (error) {
        console.error("Error fetching crews:", error);
        return [];
    }
    if (!data || data.length === 0) {
        return [] as Crew[];
    }
    return data as unknown as Crew[];
};

export const getCrewById = async (id: string): Promise<Crew | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a crew.");
        return null;
    }

    const { data, error } = await fetchByBusiness("crews", businessId, "*", { filter: { id } });

    if (error) {
        console.error("Error fetching crew by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as Crew;
    }

    return null;
}

export const createCrew = async (crew: CrewInsert): Promise<Crew | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a crew.");
        return null;
    }

    const { data, error } = await insertWithBusiness("crews", crew, businessId);

    if (error) {
        console.error("Error creating crew:", error);
        return null;
    }
    return data as unknown as Crew;
};

export const updateCrew = async (id: string, crew: CrewUpdate): Promise<Crew | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a crew.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("crews", id, crew, businessId);

    if (error) {
        console.error("Error updating crew:", error);
        return null;
    }
    return data as unknown as Crew;
}

export const deleteCrewById = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a crew.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("crews", id, businessId);

    if (error) {
        console.error("Error deleting crew:", error);
        return false;
    }
    return true;
}

export const searchCrews = async (query: string): Promise<Crew[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search crews.");
        return [];
    }

    const { data, error } = await fetchByBusiness("crews", businessId, "*", {
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

    if (!data || data.length === 0) {
        return [] as Crew[];
    }
    return data as unknown as Crew[];
};

export const getCrewsWithDetails = async (): Promise<CrewWithDetails[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to get crews with details.");
        return [];
    }

    const crews = await getCrews();
    if (!crews || crews.length === 0) {
        return [];
    }

    const crewIds = crews.map((crew) => crew.id);
    const leaderIds = crews.map((crew) => crew.leader_id).filter((id) => id !== null);
    const leaders = await fetchByBusiness("crew_members", businessId, "*", {
        filter: { id: { in: leaderIds } },
    });

    const { data: members } = await fetchByBusiness("crew_member_assignments", businessId, `id, crew_id`, {
        filter: { crew_id: { in: crewIds } },
    });

    const leaderData = leaders.data as unknown as CrewMember[];

    const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format
    const { data: projectCrews } = await fetchByBusiness("project_crews", businessId, "*", {
        filter: { crew_id: { in: crewIds }, start_date: { lte: today }, end_date: { gte: today } },
    });

    const projectCrewsData = projectCrews as unknown as ProjectCrew[];
    const projectIds = projectCrewsData?.map((pc) => pc.project_id) || [];
    const { data: projects } = await fetchByBusiness("projects", businessId, "*", {
        filter: { id: { in: projectIds } },
    });

    const projectsData = projects as unknown as Project[];
    const data = crews.map((crew) => {
        const projectId = projectCrewsData?.find((pc) => pc.crew_id === crew.id)?.project_id || null;
        return {
            ...crew,
            member_count: (members as unknown as CrewMemberAssignment[])?.filter((member) => member.crew_id === crew.id).length,
            leader: leaderData.find((member) => member.id === crew.leader_id)?.name || "No Assigned Leader",
            current_project_id: projectId,
            current_project: projectsData?.find((project) => project.id === projectId)?.name || "No Current Project",

        }
    });
    return data as unknown as CrewWithDetails[];
};

export const getCrewWithDetailsById = async (id: string): Promise<CrewWithDetails | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to get crews with details.");
        return null;
    }

    const crew = await getCrewById(id);
    if (!crew) {
        return null;
    }

    let leaderName = "No Assigned Leader";
    if (crew.leader_id !== null) {
        const { data: leader, error: leaderError } = await fetchByBusiness("crew_members", businessId, "*", { filter: { id: crew.leader_id } });
        leaderName = leaderError ? "No Assigned Leader" : (leader[0] as unknown as CrewMember).name || "No Assigned Leader";
    }

    const { data: members } = await fetchByBusiness("crew_member_assignments", businessId, `id, crew_id`, {
        filter: { crew_id: crew.id },
    });
    const memberCount = members?.length || 0;

    const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format
    const { data: projectCrews } = await fetchByBusiness("project_crews", businessId, "*", {
        filter: { crew_id: crew.id, start_date: { lte: today }, end_date: { gte: today } },
    });

    const projectCrewsData = projectCrews as unknown as ProjectCrew[];
    const projectIds = projectCrewsData?.map((pc) => pc.project_id) || [];
    const { data: projects } = await fetchByBusiness("projects", businessId, "*", {
        filter: { id: { in: projectIds } },
    });
    const projectName = (projects as unknown as Project[])?.find((project) => project.id === projectCrewsData[0]?.project_id)?.name || "No Current Project";
    const projectId = projectCrewsData?.find((pc) => pc.crew_id === crew.id)?.project_id || null;

    const data = crew as unknown as CrewWithDetails;
    data.member_count = memberCount;
    data.leader = leaderName;
    data.current_project_id = projectId;
    data.current_project = projectName;

    return data;
};

export const getCrewMembersByCrewId = async (crewId: string): Promise<CrewMember[] | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch crew members by crew ID.");
        return null;
    }

    if (!crewId) {
        console.error("Crew ID is required to fetch crew members by crew ID.");
        return null;
    }

    const { data: crewData, error: crewError } = await fetchByBusiness("crew_member_assignments", businessId, "*", {
        filter: { crew_id: crewId },
    });

    const crewMemberIds = (crewData as unknown as CrewMemberAssignment[])?.map((assignment) => assignment.crew_member_id) || [];


    const { data, error } = await fetchByBusiness("crew_members", businessId, "*", {
        filter: { id: { in: crewMemberIds } },
        orderBy: { column: "name", ascending: true },
    });

    if (error) {
        console.error("Error fetching crew members by crew ID:", error);
        return null;
    }
    if (!data || data.length === 0) {
        return [] as CrewMember[];
    }
    return data as unknown as CrewMember[];
}

export const getCrewSchedule = async (crewId: string): Promise<ProjectCrewWithDetails[] | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch crew members by crew ID.");
        return null;
    }
    const { data: projectCrewsData, error } = await fetchByBusiness("project_crews", businessId, "*", {
        filter: { crew_id: crewId },
    });
    if (error) {
        console.error("Error fetching crew schedule:", error);
        return null;
    }

    if (!projectCrewsData) {
        return [];
    }

    if (projectCrewsData.length === 0) {
        return [];
    }
    const projectId = (projectCrewsData[0] as unknown as ProjectCrew)?.project_id;

    const { data: projectsData } = await fetchByBusiness("projects", businessId, "*", {
        filter: { id: projectId },
    });

    const data = projectCrewsData as unknown as ProjectCrewWithDetails[];
    data.map((projectCrew) => {
        const project = (projectsData as unknown as Project[])?.find((p) => p.id === projectCrew.project_id);
        projectCrew.project_name = project?.name || "No Project";
    });
    return data;
}

export const getCrewEquipment = async (crewId: string): Promise<EquipmentWithAssignment[] | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch crew members by crew ID.");
        return null;
    }

    const { data, error } = await fetchByBusiness("equipment_assignments", businessId, "*", {
        filter: { crew_id: crewId },
    });

    if (error) {
        console.log("Error fetching equipment assignments:", error);
        return null;
    }

    if (!data || data.length === 0) {
        return [];
    }

    const equipmentIds = (data as unknown as EquipmentAssignment[]).map((assignment) => assignment.equipment_id);
    const { data: equipmentData } = await fetchByBusiness("equipment", businessId, "*", {
        filter: { id: { in: equipmentIds } },
    });

    if (error) {
        console.log("Error fetching equipment assignments:", error);
        return null;
    }

    if (!data) {
        return null;
    }
    const equipmentAssignments = (data as unknown as EquipmentAssignment[]).map((assignment) => {
        const equipment = (equipmentData as unknown as Equipment[])?.find((e) => e.id === assignment.equipment_id);
        return {
            ...assignment,
            equipment_name: equipment?.name || "No Equipment",
            equipment_id: equipment?.id || null,
            assigned_date: assignment?.start_date + " - " + assignment?.end_date || "No Dates",
        };
    });

    return equipmentAssignments as unknown as EquipmentWithAssignment[];
}