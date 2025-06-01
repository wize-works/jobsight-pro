"use server";
import type { Crew, CrewWithDetails, CrewWithMemberInfo } from "@/types/crews";
import type { CrewInsert, CrewUpdate } from "@/types/crews";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { ProjectCrew, ProjectCrewWithDetails } from "@/types/project-crews";
import { Project } from "@/types/projects";
import { CrewMember, CrewMemberUpdate } from "@/types/crew-members";
import { EquipmentAssignment, EquipmentAssignmentWithEquipmentDetails } from "@/types/equipment-assignments";
import { Equipment } from "@/types/equipment";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getUserBusiness } from "@/app/actions/business";
import { CrewMemberAssignment } from "@/types/crew-member-assignments";
import { EquipmentWithAssignment, EquipmentWithAssignments } from "@/types/equipment";
import { DailyLog } from "@/types/daily-logs";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getCrews = async (): Promise<Crew[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("crews", business.id, "*", {
        orderBy: { column: "name", ascending: true },
    });
    if (error) {
        console.error("Error fetching crews:", error);
        return [];
    }
    if (!data || data.length === 0) {
        return [];
    }
    return data;
};

export const getCrewById = async (id: string): Promise<Crew> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("crews", business.id, "*", { filter: { id } });

    if (error) {
        console.error("Error fetching crew by ID:", error);
        throw new Error("Failed to fetch crew by ID");
    }

    if (data && data[0]) {
        return data[0];
    }

    throw new Error("Crew not found");
}

export const createCrew = async (crew: CrewInsert): Promise<Crew> => {
    const { business } = await withBusinessServer();

    crew = await applyCreated<CrewInsert>(crew);

    const { data, error } = await insertWithBusiness("crews", crew, business.id);

    if (error) {
        console.error("Error creating crew:", error);
        throw new Error("Failed to create crew");
    }
    return data;
};

export const updateCrew = async (id: string, crew: CrewUpdate): Promise<Crew> => {
    const { business } = await withBusinessServer();

    crew = await applyUpdated<CrewUpdate>(crew);

    const { data, error } = await updateWithBusinessCheck("crews", id, crew, business.id);

    if (error) {
        console.error("Error updating crew:", error);
        throw new Error("Failed to update crew");
    }
    return data;
}

export const deleteCrewById = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("crews", id, business.id);

    if (error) {
        console.error("Error deleting crew:", error);
        return false;
    }
    return true;
}

export const searchCrews = async (query: string): Promise<Crew[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("crews", business.id, "*", {
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
        return [];
    }
    return data;
};

export const getCrewsWithDetails = async (): Promise<CrewWithDetails[]> => {
    const { business } = await withBusinessServer();

    const crews = await getCrews();
    if (!crews || crews.length === 0) {
        return [];
    }

    const crewIds = crews.map((crew) => crew.id);
    const leaderIds = crews.map((crew) => crew.leader_id).filter((id) => id !== null);
    const { data: leaderData } = await fetchByBusiness("crew_members", business.id, "*", {
        filter: { id: { in: leaderIds } },
    });

    const { data: members } = await fetchByBusiness("crew_member_assignments", business.id, ["id", "crew_id"], {
        filter: { crew_id: { in: crewIds } },
    });

    const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format
    const { data: projectCrewsData } = await fetchByBusiness("project_crews", business.id, "*", {
        filter: { crew_id: { in: crewIds }, start_date: { lte: today }, end_date: { gte: today } },
    });

    const projectIds = projectCrewsData?.map((pc) => pc.project_id) || [];
    const { data: projectsData } = await fetchByBusiness("projects", business.id, "*", {
        filter: { id: { in: projectIds } },
    });

    const data = crews.map((crew) => {
        const projectId = projectCrewsData?.find((pc) => pc.crew_id === crew.id)?.project_id || null;
        const activeProjects = projectCrewsData?.filter((pc) => pc.crew_id === crew.id).length || 0;
        const crewLogs = []; // Placeholder, as logs are not fetched here
        const totalHours = 0; // Placeholder, as logs are not fetched here
        return {
            ...crew,
            member_count: members?.filter((member) => member.crew_id === crew.id).length ?? 0,
            leader: leaderData?.find((member) => member.id === crew.leader_id)?.name || "No Assigned Leader",
            current_project_id: projectId,
            current_project: projectsData?.find((project) => project.id === projectId)?.name || "No Current Project",
            active_projects: activeProjects,
            total_hours: totalHours,
        }
    });
    return data || [];
};

export const getCrewWithDetailsById = async (id: string): Promise<CrewWithDetails> => {
    const { business } = await withBusinessServer();

    const crew = await getCrewById(id);
    if (!crew) {
        throw new Error("Crew not found");
    }

    let leaderName = "No Assigned Leader";
    if (crew.leader_id !== null) {
        const { data: leader, error: leaderError } = await fetchByBusiness("crew_members", business.id, "*", { filter: { id: crew.leader_id } });
        leaderName = leaderError ? "No Assigned Leader" : !leader ? "No Assigned Leader" : leader[0]?.name || "No Assigned Leader";
    }

    const { data: members } = await fetchByBusiness("crew_member_assignments", business.id, ["id", "crew_id"], {
        filter: { crew_id: crew.id },
    });
    const memberCount = members?.length || 0;

    const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format
    const { data: projectCrewsData } = await fetchByBusiness("project_crews", business.id, "*", {
        filter: { crew_id: crew.id },
    });

    const totalProjects = projectCrewsData?.length || 0;

    const projectCrews = projectCrewsData?.filter((pc) => pc.start_date <= today && (pc.end_date === null || pc.end_date >= today)) || [];

    const projectIds = projectCrews?.map((pc) => pc.project_id) || [];
    const { data: projects } = await fetchByBusiness("projects", business.id, "*", {
        filter: { id: { in: projectIds } },
    });
    const projectName = projects?.find((project) => project.id === projectCrews[0]?.project_id)?.name || "No Current Project";
    const projectId = projectCrews?.find((pc) => pc.crew_id === crew.id)?.project_id || null;

    const { data: crewLogs } = await fetchByBusiness("daily_logs", business.id, "*", {
        filter: { crew_id: crew.id }
    });
    const totalHours = (crewLogs || []).reduce((acc, log) => acc + (log.hours_worked || 0), 0);

    const data: CrewWithDetails = {
        ...crew,
        member_count: memberCount,
        leader: leaderName,
        current_project_id: projectId,
        current_project: projectName,
        active_projects: totalProjects,
        total_hours: totalHours,
    };

    return data;
};

export const getCrewMembersByCrewId = async (crewId: string): Promise<CrewMember[]> => {
    const { business } = await withBusinessServer();

    if (!crewId) {
        console.error("Crew ID is required to fetch crew members by crew ID.");
        throw new Error("Crew ID is required.");
    }

    const { data: crewData, error: crewError } = await fetchByBusiness("crew_member_assignments", business.id, "*", {
        filter: { crew_id: crewId },
    });

    const crewMemberIds = crewData?.map((assignment) => assignment.crew_member_id) || [];


    const { data, error } = await fetchByBusiness("crew_members", business.id, "*", {
        filter: { id: { in: crewMemberIds } },
        orderBy: { column: "name", ascending: true },
    });

    if (error) {
        console.error("Error fetching crew members by crew ID:", error);
        throw new Error("Failed to fetch crew members by crew ID");
    }
    if (!data || data.length === 0) {
        return [];
    }
    return data;
}

export const getCrewSchedule = async (crewId: string): Promise<ProjectCrewWithDetails[]> => {
    const { business } = await withBusinessServer();

    const { data: projectCrewsData, error } = await fetchByBusiness("project_crews", business.id, "*", {
        filter: { crew_id: crewId },
    });
    if (error) {
        console.error("Error fetching crew schedule:", error);
        throw new Error("Failed to fetch crew schedule");
    }

    if (!projectCrewsData) {
        return [];
    }

    if (projectCrewsData.length === 0) {
        return [];
    }
    const projectIds = projectCrewsData.map((pc) => pc.project_id) || [];

    const { data: projectsData } = await fetchByBusiness("projects", business.id, "*", {
        filter: { id: { in: projectIds } },
    });

    const data = projectCrewsData as ProjectCrewWithDetails[];
    data.map((projectCrew) => {
        const project = projectsData?.find((p) => p.id === projectCrew.project_id);
        projectCrew.project_name = project?.name || "No Project";
        return projectCrew;
    });
    return data;
}

export const getCrewScheduleHistory = async (crewId: string): Promise<ProjectCrewWithDetails[]> => {
    const { business } = await withBusinessServer();

    const { data: projectCrewsData, error } = await fetchByBusiness("project_crews", business.id, "*", {
        filter: { crew_id: crewId, end_date: { neq: null, lt: new Date().toISOString() } },
        orderBy: { column: "start_date", ascending: false },
    });
    if (error) {
        console.error("Error fetching crew schedule:", error);
        throw new Error("Failed to fetch crew schedule");
    }

    if (!projectCrewsData) {
        return [];
    }

    if (projectCrewsData.length === 0) {
        return [];
    }
    const projectIds = projectCrewsData.map((pc) => pc.project_id) || [];

    const { data: projectsData } = await fetchByBusiness("projects", business.id, "*", {
        filter: { id: { in: projectIds } },
    });

    const data = projectCrewsData as ProjectCrewWithDetails[];
    data.map((projectCrew) => {
        const project = projectsData?.find((p) => p.id === projectCrew.project_id);
        projectCrew.project_name = project?.name || "No Project";
    });
    return data;
}

export const getCrewScheduleCurrent = async (crewId: string): Promise<ProjectCrewWithDetails[]> => {
    const { business } = await withBusinessServer();

    const { data: projectCrewsData, error } = await fetchByBusiness("project_crews", business.id, "*", {
        filter: {
            crew_id: crewId,
            end_date: { neq: null, gte: new Date().toISOString() }
        },
        orderBy: { column: "start_date", ascending: false },
    });
    if (error) {
        console.error("Error fetching crew schedule:", error);
        throw new Error("Failed to fetch crew schedule");
    }

    if (!projectCrewsData) {
        return [];
    }

    if (projectCrewsData.length === 0) {
        return [];
    }
    const projectIds = projectCrewsData.map((pc) => pc.project_id) || [];

    const { data: projectsData } = await fetchByBusiness("projects", business.id, "*", {
        filter: { id: { in: projectIds } },
    });

    const data = projectCrewsData as ProjectCrewWithDetails[];
    data.map((projectCrew) => {
        const project = projectsData?.find((p) => p.id === projectCrew.project_id);
        projectCrew.project_name = project?.name || "No Project";
    });
    return data;
}

export const getCrewEquipment = async (crewId: string): Promise<EquipmentAssignmentWithEquipmentDetails[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("equipment_assignments", business.id, "*", {
        filter: { crew_id: crewId },
    });

    if (error) {
        console.log("Error fetching equipment assignments:", error);
        throw new Error("Failed to fetch equipment assignments");
    }

    if (!data || data.length === 0) {
        return [];
    }

    const equipmentIds = data.map((assignment) => assignment.equipment_id);
    const { data: equipmentData } = await fetchByBusiness("equipment", business.id, "*", {
        filter: { id: { in: equipmentIds } },
    });

    if (error) {
        console.log("Error fetching equipment assignments:", error);
        throw new Error("Failed to fetch equipment data");
    }

    if (!data) {
        throw new Error("No equipment assignments found for this crew");
    }
    const equipmentAssignments = data.map((assignment) => {
        const equipment = equipmentData?.find((e) => e.id === assignment.equipment_id);
        return {
            ...assignment,
            equipment_name: equipment?.name || "No Equipment",
            equipment_id: equipment?.id || null,
            equipment_type: equipment?.type || "Unknown",
            assigned_date: assignment?.start_date + " - " + assignment?.end_date || "No Dates",
        };
    }) as EquipmentAssignmentWithEquipmentDetails[];

    return equipmentAssignments;
};

export const assignCrewLeader = async (crewId: string, leaderId: string): Promise<Crew> => {
    const { business, userId } = await withBusinessServer();

    // First get the current crew data
    const crew = await getCrewById(crewId);
    if (!crew) {
        console.error("Crew not found");
        throw new Error("Crew not found");
    }

    // Update the crew with new leader_id
    const updateData: CrewUpdate = {
        ...crew,
        leader_id: leaderId,
        updated_at: new Date().toISOString(),
        updated_by: userId || ""
    };

    // Perform the update
    const { data, error } = await updateWithBusinessCheck("crews", crewId, updateData, business.id);

    if (error) {
        console.error("Error assigning crew leader:", error);
        throw new Error("Failed to assign crew leader");
    }

    return data;
}

export const updateCrewNotes = async (crewId: string, notes: string): Promise<Crew> => {
    const { business, userId } = await withBusinessServer();

    // First get the current crew data
    let crew = await getCrewById(crewId);
    if (!crew) {
        console.error("Crew not found");
        throw new Error("Crew not found");
    }

    crew = await applyUpdated<CrewUpdate>(crew);

    // Update the crew with new notes
    const updateData: CrewUpdate = {
        ...crew,
        notes: notes,
    };

    // Perform the update
    const { data, error } = await updateWithBusinessCheck("crews", crewId, updateData, business.id);

    if (error) {
        console.error("Error updating crew notes:", error);
        throw new Error("Failed to update crew notes");
    }

    return data;
}

export const getCrewsByProjectId = async (id: string): Promise<CrewWithMemberInfo[]> => {
    const { business } = await withBusinessServer();

    const { data: projectCrews, error: projectCrewsError } = await fetchByBusiness("project_crews", business.id, "*", {
        filter: { project_id: id },
        orderBy: { column: "start_date", ascending: false },
    });

    if (!projectCrews || projectCrews.length <= 0 || projectCrewsError) {
        return [];
    }

    const crewIds = projectCrews.map((pc) => pc.crew_id);

    const { data: crews, error } = await fetchByBusiness("crews", business.id, "*", {
        filter: { id: { in: crewIds } },
        orderBy: { column: "name", ascending: true },
    });

    if (!crews || error) {
        console.error("Error fetching crews by project ID:", error);
        return [];
    }

    const leaderIds = crews.map((crew) => crew.leader_id).filter((id) => id !== null);
    const { data: leaders } = await fetchByBusiness("crew_members", business.id, "*", {
        filter: { id: { in: leaderIds } },
    });


    const { data: crewMembersData } = await fetchByBusiness("crew_member_assignments", business.id, ["id", "crew_id"], {
        filter: { crew_id: { in: crewIds } },
    });

    const crewWithMembers = crews.map((crew) => {
        const withMember = crew as CrewWithMemberInfo;
        const count = crewMembersData?.filter((member) => member.crew_id === crew.id).length || 0;
        withMember.member_count = count;
        withMember.leader_name = leaders?.find((leader) => leader.id === crew.leader_id)?.name || "No Assigned Leader";
        return withMember;
    });
    return crewWithMembers;
};

export const getAvailableCrews = async (): Promise<CrewWithMemberInfo[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("crews", business.id, "*", {
        filter: { status: { in: ["available"] } },
        orderBy: { column: "name", ascending: true },
    });

    if (error) {
        console.error("Error fetching available crews:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }
    const crewIds = data.map((crew) => crew.id);
    const leaderIds = data.map((crew) => crew.leader_id).filter((id) => id !== null);
    const { data: leaders } = await fetchByBusiness("crew_members", business.id, "*", {
        filter: { id: { in: leaderIds } },
    });


    const { data: crewMembersData } = await fetchByBusiness("crew_member_assignments", business.id, ["id", "crew_id", "crew_member_id"], {
        filter: { crew_id: { in: crewIds } },
    });

    const crewWithMembers = data.map((crew) => {
        const withMember = crew as CrewWithMemberInfo;
        const count = crewMembersData?.filter((member) => member.crew_id === crew.id).length || 0;
        withMember.member_count = count;
        withMember.leader_name = leaders?.find((leader) => leader.id === crew.leader_id)?.name || "No Assigned Leader";
        return withMember;
    });

    return crewWithMembers;
}