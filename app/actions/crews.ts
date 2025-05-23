"use server";
import type { Crew } from "@/types/crews";
import type { CrewInsert, CrewUpdate } from "@/types/crews";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";

export async function getCrews(businessId: string) {
    return await fetchByBusiness("crews", businessId, "*", {
        orderBy: { column: "name", ascending: true },
    });
};

export async function getCrewById(id: string, businessId: string) {
    const { data, error } = await fetchByBusiness("crews", businessId, "*", {
        filter: { id },
    });

    return data && data[0] ? data[0] : null;
};

export async function createCrew(crew: Omit<CrewInsert, "business_id">, businessId: string) {
    return await insertWithBusiness("crews", crew, businessId);
};

export async function updateCrew(id: string, crew: CrewUpdate, businessId: string) {
    return await updateWithBusinessCheck("crews", id, crew, businessId);
};

export async function deleteCrew(id: string, businessId: string) {
    return await deleteWithBusinessCheck("crews", id, businessId);
};

export async function searchCrews(query: string, businessId: string) {
    return await fetchByBusiness("crews", businessId, "*", {
        filter: {
            or: [
                { name: { ilike: `%${query}%` } },
                { leader: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "name", ascending: true },
    });
};

export async function getCrewsWithStats(businessId: string) {
    const { data, error } = await fetchByBusiness("crews", businessId, "*", {
        orderBy: { column: "name", ascending: true },
    });
    if (error) return null;

    const crewIds = data.map((crew) => crew.id);
    const leaderIds = data.filter(crew => crew.leader_id !== null).map((crew) => crew.leader_id);

    const { data: memberData } = await fetchByBusiness("crew_members", businessId, "*", {
        filter: { crew_id: { in: crewIds } },
    });

    const { data: leaderData } = await fetchByBusiness("crew_members", businessId, "*", {
        filter: { id: { in: leaderIds } },
    });

    const { data: projectCrewData } = await fetchByBusiness("project_crews", businessId, "*", {
        filter: { crew_id: { in: crewIds } },
    });

    const projectIds = projectCrewData?.map((crew) => crew.project_id);

    const { data: projectsData } = await fetchByBusiness("projects", businessId, "*", {
        filter: { id: { in: projectIds } },
    });
    const today = new Date();

    const crews = data.map((crew) => {
        const crewMembers = memberData?.filter((member) => member.crew_id === crew.id) || [];
        const crewLeader = leaderData?.find((member) => crew.leader_id === member.id);
        const leaderName = crewLeader ? `${crewLeader.name}` : "No Leader";

        const currentProject = projectCrewData?.find((p) => {
            const start = new Date(p.start_date);
            const end = new Date(p.end_date);
            return (
                p.crew_id === crew.id &&
                start <= today &&
                end >= today
            );
        });

        const currentProjectInfo = projectsData?.find((p) => p.id === currentProject?.project_id);
        return {
            ...crew,
            leader: leaderName,
            members: crewMembers.length,
            current_project: currentProjectInfo?.name || "No Current Project",
            current_project_id: currentProjectInfo?.id || null,
        };
    });

    return crews;
}
export async function getCrewWithStatsById(id: string, businessId: string) {
    const { data, error } = await fetchByBusiness("crews", businessId, "*", {
        filter: { id },
    });
    if (error) return null;

    const crewIds = data.map((crew) => crew.id);
    const leaderIds = data.filter(crew => crew.leader_id !== null).map((crew) => crew.leader_id);

    const { data: memberData } = await fetchByBusiness("crew_members", businessId, "*", {
        filter: { crew_id: { in: crewIds } },
    });

    const { data: leaderData } = await fetchByBusiness("crew_members", businessId, "*", {
        filter: { id: { in: leaderIds } },
    });

    const { data: projectCrewData } = await fetchByBusiness("project_crews", businessId, "*", {
        filter: { crew_id: { in: crewIds } },
    });

    const projectIds = projectCrewData?.map((crew) => crew.project_id);

    const { data: projectsData } = await fetchByBusiness("projects", businessId, "*", {
        filter: { id: { in: projectIds } },
    });
    const today = new Date();

    const crews = data.map((crew) => {
        const crewMembers = memberData?.filter((member) => member.crew_id === crew.id) || [];
        const crewLeader = leaderData?.find((member) => crew.leader_id === member.id);
        const leaderName = crewLeader ? `${crewLeader.name}` : "No Leader";

        const currentProject = projectCrewData?.find((p) => {
            const start = new Date(p.start_date);
            const end = new Date(p.end_date);
            return (
                p.crew_id === crew.id &&
                start <= today &&
                end >= today
            );
        });

        const currentProjectInfo = projectsData?.find((p) => p.id === currentProject?.project_id);
        return {
            ...crew,
            leader: leaderName,
            members: crewMembers.length,
            current_project: currentProjectInfo?.name || "No Current Project",
            current_project_id: currentProjectInfo?.id || null,
        };
    });

    if (crews && crews[0]) {
        return crews[0];
    }

    return null;
}

export async function getCrewMembersByCrewId(crewId: string, businessId: string) {
    const { data, error } = await fetchByBusiness("crew_members", businessId, "*", {
        filter: { crew_id: crewId },
    });
    if (error) {
        return null;
    }
    if (data && data[0]) {
        return data;
    }
    return null;
}

export async function getCrewMemberById(id: string, businessId: string) {
    const { data, error } = await fetchByBusiness("crew_members", businessId, "*", {
        filter: { id },
    });

    if (error) {
        return null;
    }

    if (data && data[0]) {
        const member = data[0];
        return member;
    }

    return null;
}

export async function getCrewSchedule(crewId: string, businessId: string) {
    const { data, error } = await fetchByBusiness("project_crews", businessId, "*", {
        filter: { crew_id: crewId },
    });
    if (error) {
        return null;
    }
    if (!data) {
        return null;
    }
    const projectId = data[0].project_id;

    const { data: projectsData } = await fetchByBusiness("projects", businessId, "*", {
        filter: { id: projectId },
    });

    return data.map((projectCrew) => {
        const project = projectsData?.find((p) => p.id === projectCrew.project_id);
        return {
            ...projectCrew,
            project_name: project?.name || "No Project",
            project_id: project?.id || null,
        };
    });
}

export async function getCrewEquipment(crewId: string, businessId: string) {
    const { data, error } = await fetchByBusiness("equipment_assignments", businessId, "*", {
        filter: { crew_id: crewId },
    });

    const equipmentIds = data.map((assignment) => assignment.equipment_id);
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
    const equipmentAssignments = data.map((assignment) => {
        const equipment = equipmentData?.find((e) => e.id === assignment.equipment_id);
        return {
            ...assignment,
            equipment_name: equipment?.name || "No Equipment",
            equipment_id: equipment?.id || null,
            assigned_date: assignment?.start_date + " - " + assignment?.end_date || "No Dates",
        };
    });

    return equipmentAssignments;
}