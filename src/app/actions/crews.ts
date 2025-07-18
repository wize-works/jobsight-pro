"use server";
import type { Crew, CrewWithDetails, CrewWithMemberInfo } from "@/types/crews";
import type { CrewInsert, CrewUpdate } from "@/types/crews";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness, fetchByBusinessWithQuery } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { ProjectCrew, ProjectCrewWithDetails } from "@/types/project-crews";
import { Project } from "@/types/projects";
import { CrewMember, CrewMemberUpdate } from "@/types/crew-members";
import { EquipmentAssignment, EquipmentAssignmentWithEquipmentDetails } from "@/types/equipment-assignments";
import { Equipment } from "@/types/equipment";
import { auth } from "@clerk/nextjs/server";
import { getUserBusiness } from "@/app/actions/business";
import { CrewMemberAssignment } from "@/types/crew-member-assignments";
import { EquipmentWithAssignment, EquipmentWithAssignments } from "@/types/equipment";
import { DailyLog } from "@/types/daily-logs";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getCrews = async (businessId: string): Promise<Crew[]> => {
    const { data, error } = await fetchByBusiness("crews", businessId, "*", {
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

export const getCrewById = async (businessId: string, id: string): Promise<Crew> => {
    const { data, error } = await fetchByBusiness("crews", businessId, "*", { filter: { id } });

    if (error) {
        console.error("Error fetching crew by ID:", error);
        throw new Error("Failed to fetch crew by ID");
    }

    if (data && data[0]) {
        return data[0];
    }

    throw new Error("Crew not found");
};

export const createCrew = async (businessId: string, crew: CrewInsert): Promise<Crew> => {
    crew = await applyCreated<CrewInsert>(crew);

    const { data, error } = await insertWithBusiness("crews", crew, businessId);

    if (error) {
        console.error("Error creating crew:", error);
        throw new Error("Failed to create crew");
    }
    return data;
};

export const updateCrew = async (businessId: string, id: string, crew: CrewUpdate): Promise<Crew> => {
    crew = await applyUpdated<CrewUpdate>(crew);

    const { data, error } = await updateWithBusinessCheck("crews", id, crew, businessId);

    if (error) {
        console.error("Error updating crew:", error);
        throw new Error("Failed to update crew");
    }
    return data;
}

export const deleteCrewById = async (businessId: string, id: string): Promise<boolean> => {
    const { error } = await deleteWithBusinessCheck("crews", id, businessId);

    if (error) {
        console.error("Error deleting crew:", error);
        return false;
    }
    return true;
}

export const searchCrews = async (businessId: string, query: string): Promise<Crew[]> => {
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
        return [];
    }
    return data;
};

export const getCrewsWithDetails = async (businessId: string): Promise<CrewWithDetails[]> => {
    const crews = await getCrews(businessId);
    if (!crews || crews.length === 0) {
        return [];
    }

    const crewIds = crews.map((crew) => crew.id);
    const leaderIds = crews.map((crew) => crew.leader_id).filter((id) => id !== null);
    const { data: leaderData } = await fetchByBusiness("crew_members", businessId, "*", {
        filter: { id: { in: leaderIds } },
    });

    const { data: members } = await fetchByBusiness("crew_member_assignments", businessId, ["id", "crew_id"], {
        filter: { crew_id: { in: crewIds } },
    });

    const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format
    const { data: projectCrewsData } = await fetchByBusiness("project_crews", businessId, "*", {
        filter: { crew_id: { in: crewIds }, start_date: { lte: today }, end_date: { gte: today } },
    });

    const projectIds = projectCrewsData?.map((pc) => pc.project_id) || [];
    const { data: projectsData } = await fetchByBusiness("projects", businessId, "*", {
        filter: { id: { in: projectIds } },
    });

    const data = crews.map((crew) => {
        const projectId = projectCrewsData?.find((pc) => pc.crew_id === crew.id)?.project_id || null;
        const activeProjects = projectCrewsData?.filter((pc) => pc.crew_id === crew.id).length || 0;
        return {
            ...crew,
            member_count: members?.filter((member) => member.crew_id === crew.id).length ?? 0,
            current_project_id: projectId,
            current_project: projectsData?.find((project) => project.id === projectId)?.name || "No Current Project",
            active_projects: activeProjects,
            total_hours: 0, // Placeholder for total_hours
        }
    });

    return data;
};

export const getCrewWithDetailsById = async (businessId: string, id: string): Promise<CrewWithDetails> => {
    const crew = await getCrewById(businessId, id);
    if (!crew) {
        throw new Error("Crew not found");
    }

    let leaderName = "No Assigned Leader";
    if (crew.leader_id !== null) {
        const { data: leader, error: leaderError } = await fetchByBusiness("crew_members", businessId, "*", { filter: { id: crew.leader_id } });
        leaderName = leaderError ? "No Assigned Leader" : !leader ? "No Assigned Leader" : leader[0]?.name || "No Assigned Leader";
    }

    const { data: members } = await fetchByBusiness("crew_member_assignments", businessId, ["id", "crew_id"], {
        filter: { crew_id: crew.id },
    });
    const memberCount = members?.length || 0;

    const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format
    const { data: projectCrewsData } = await fetchByBusiness("project_crews", businessId, "*", {
        filter: { crew_id: crew.id },
    });

    const totalProjects = projectCrewsData?.length || 0;

    const projectCrews = projectCrewsData?.filter((pc) => pc.start_date <= today && (pc.end_date === null || pc.end_date >= today)) || [];

    const projectIds = projectCrews?.map((pc) => pc.project_id) || [];
    const { data: projects } = await fetchByBusiness("projects", businessId, "*", {
        filter: { id: { in: projectIds } },
    });
    const projectName = projects?.find((project) => project.id === projectCrews[0]?.project_id)?.name || "No Current Project";
    const projectId = projectCrews?.find((pc) => pc.crew_id === crew.id)?.project_id || null;

    const { data: crewLogs } = await fetchByBusiness("daily_logs", businessId, "*", {
        filter: { crew_id: crew.id }
    });
    const totalHours = (crewLogs || []).reduce((acc, log) => acc + (log.hours_worked || 0), 0);

    const data: CrewWithDetails = {
        ...crew,
        member_count: memberCount,
        current_project_id: projectId,
        current_project: projectName,
        active_projects: totalProjects,
        total_hours: totalHours,
    };

    return data;
};

export const getCrewMembersByCrewId = async (businessId: string, crewId: string): Promise<CrewMember[]> => {
    if (!crewId) {
        console.error("Crew ID is required to fetch crew members by crew ID.");
        throw new Error("Crew ID is required.");
    }

    const { data: crewData, error: crewError } = await fetchByBusiness("crew_member_assignments", businessId, "*", {
        filter: { crew_id: crewId },
    });

    const crewMemberIds = crewData?.map((assignment) => assignment.crew_member_id) || [];


    const { data, error } = await fetchByBusiness("crew_members", businessId, "*", {
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

export const getCrewSchedule = async (businessId: string, crewId: string): Promise<ProjectCrewWithDetails[]> => {

    const { data: projectCrewsData, error } = await fetchByBusiness("project_crews", businessId, "*", {
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

    const { data: projectsData } = await fetchByBusiness("projects", businessId, "*", {
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

export const getCrewScheduleHistory = async (businessId: string, crewId: string): Promise<ProjectCrewWithDetails[]> => {

    const { data: projectCrewsData, error } = await fetchByBusiness("project_crews", businessId, "*", {
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

    const { data: projectsData } = await fetchByBusiness("projects", businessId, "*", {
        filter: { id: { in: projectIds } },
    });

    const data = projectCrewsData as ProjectCrewWithDetails[];
    data.map((projectCrew) => {
        const project = projectsData?.find((p) => p.id === projectCrew.project_id);
        projectCrew.project_name = project?.name || "No Project";
    });
    return data;
}

export const getCrewScheduleCurrent = async (businessId: string, crewId: string): Promise<ProjectCrewWithDetails[]> => {

    const { data: projectCrewsData, error } = await fetchByBusiness("project_crews", businessId, "*", {
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

    const { data: projectsData } = await fetchByBusiness("projects", businessId, "*", {
        filter: { id: { in: projectIds } },
    });

    const data = projectCrewsData as ProjectCrewWithDetails[];
    data.map((projectCrew) => {
        const project = projectsData?.find((p) => p.id === projectCrew.project_id);
        projectCrew.project_name = project?.name || "No Project";
    });
    return data;
}

export const getCrewEquipment = async (businessId: string, crewId: string): Promise<EquipmentAssignmentWithEquipmentDetails[]> => {
    const { data, error } = await fetchByBusiness("equipment_assignments", businessId, "*", {
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
    const { data: equipmentData } = await fetchByBusiness("equipment", businessId, "*", {
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
            equipment_model: equipment?.model || "Unknown",
            assigned_date: assignment?.start_date + " - " + assignment?.end_date || "No Dates",
        };
    }) as EquipmentAssignmentWithEquipmentDetails[];
    console.log("Equipment assignments for crew:", equipmentAssignments);
    return equipmentAssignments;
};

export const assignCrewLeader = async (businessId: string, crewId: string, leaderId: string): Promise<Crew> => {

    // First get the current crew data
    const crew = await getCrewById(businessId, crewId);
    if (!crew) {
        console.error("Crew not found");
        throw new Error("Crew not found");
    }



    // Update the crew with new leader_id
    let updateData: CrewUpdate = {
        ...crew,
        leader_id: leaderId,
    };

    updateData = await applyUpdated<CrewUpdate>(updateData);

    // Perform the update
    const { data, error } = await updateWithBusinessCheck("crews", crewId, updateData, businessId);

    if (error) {
        console.error("Error assigning crew leader:", error);
        throw new Error("Failed to assign crew leader");
    }

    return data;
}

export const updateCrewNotes = async (businessId: string, crewId: string, notes: string): Promise<Crew> => {
    // First get the current crew data
    let crew = await getCrewById(businessId, crewId);
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
    const { data, error } = await updateWithBusinessCheck("crews", crewId, updateData, businessId);

    if (error) {
        console.error("Error updating crew notes:", error);
        throw new Error("Failed to update crew notes");
    }

    return data;
}

export const getCrewsByProjectId = async (businessId: string, id: string): Promise<CrewWithMemberInfo[]> => {
    const { data: projectCrews, error: projectCrewsError } = await fetchByBusiness("project_crews", businessId, "*", {
        filter: { project_id: id },
        orderBy: { column: "start_date", ascending: false },
    });

    if (!projectCrews || projectCrews.length <= 0 || projectCrewsError) {
        return [];
    }

    const crewIds = projectCrews.map((pc) => pc.crew_id);

    const { data: crews, error } = await fetchByBusiness("crews", businessId, "*", {
        filter: { id: { in: crewIds } },
        orderBy: { column: "name", ascending: true },
    });

    if (!crews || error) {
        console.error("Error fetching crews by project ID:", error);
        return [];
    }

    const leaderIds = crews.map((crew) => crew.leader_id).filter((id) => id !== null);
    const { data: leaders } = await fetchByBusiness("crew_members", businessId, "*", {
        filter: { id: { in: leaderIds } },
    });


    const { data: crewMembersData } = await fetchByBusiness("crew_member_assignments", businessId, ["id", "crew_id"], {
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

export const getAvailableCrews = async (businessId: string): Promise<CrewWithMemberInfo[]> => {

    const { data, error } = await fetchByBusiness("crews", businessId, "*", {
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
    const { data: leaders } = await fetchByBusiness("crew_members", businessId, "*", {
        filter: { id: { in: leaderIds } },
    });


    const { data: crewMembersData } = await fetchByBusiness("crew_member_assignments", businessId, ["id", "crew_id", "crew_member_id"], {
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

export const updateCrewMember = async (businessId: string, id: string, crewMember: CrewMemberUpdate): Promise<CrewMember | null> => {

    crewMember = await applyUpdated<CrewMemberUpdate>(crewMember);

    const { data, error } = await updateWithBusinessCheck("crew_members", id, crewMember, businessId);

    if (error) {
        console.error("Error updating crew member:", error);
        return null;
    }

    return data as unknown as CrewMember;
}

export const deleteCrewMember = async (businessId: string, id: string): Promise<boolean> => {

    const { error } = await deleteWithBusinessCheck("crew_members", id, businessId);

    if (error) {
        console.error("Error deleting crew member:", error);
        return false;
    }

    return true;
}

export const getCrewDetailsByID = async (businessId: string, crewId: string): Promise<{
    crew: CrewWithDetails;
    members: CrewMember[];
    allMembers: CrewMember[];
    schedule: any[];
    history: any[];
    equipment: any[];
    projects: any[];
    allEquipment: any[];
    stats: {
        totalMembers: number;
        totalProjects: number;
        activeProjects: number;
        totalEquipment: number;
        totalHours: number;
    };
} | null> => {
    try {
        // First, get the crew with basic related data using joins
        const { data: crewWithRelations, error: crewError } = await fetchByBusinessWithQuery(businessId, {
            from: "crews",
            select: ["*"],
            joins: [
                {
                    table: "crew_member_assignments",
                    select: ["id", "crew_member_id"],
                    alias: "crew_member_assignments"
                },
                {
                    table: "project_crews",
                    select: ["id", "project_id", "start_date", "end_date"],
                    alias: "project_crews"
                },
                {
                    table: "equipment_assignments",
                    select: ["id", "equipment_id", "start_date", "end_date"],
                    alias: "equipment_assignments"
                }
            ],
            where: { id: crewId }
        });

        if (crewError) {
            console.error("Error fetching crew details:", crewError);
            throw new Error("Failed to fetch crew details");
        }

        if (!crewWithRelations || crewWithRelations.length === 0) {
            throw new Error("Crew not found");
        }

        const crewData = crewWithRelations[0];

        // Get aggregated stats
        const { data: statsData, error: statsError } = await fetchByBusinessWithQuery(businessId, {
            from: "crews",
            select: ["id"],
            aggregates: [
                { function: "count", table: "crew_member_assignments", alias: "total_members", where: { crew_id: crewId } },
                { function: "count", table: "project_crews", alias: "total_projects", where: { crew_id: crewId } },
                {
                    function: "count",
                    table: "project_crews",
                    alias: "active_projects",
                    where: {
                        crew_id: crewId,
                        start_date: { lte: new Date().toISOString() },
                        end_date: { gte: new Date().toISOString() }
                    }
                },
                { function: "count", table: "equipment_assignments", alias: "total_equipment", where: { crew_id: crewId } },
                { function: "sum", table: "daily_logs", column: "hours_worked", alias: "total_hours", where: { crew_id: crewId } }
            ],
            where: { id: crewId }
        });

        const statsResult = statsData?.[0] || {};

        // Get crew member details
        const memberAssignments = crewData.crew_member_assignments || [];
        const memberIds = memberAssignments.map((assignment: any) => assignment.crew_member_id);

        let members: CrewMember[] = [];
        if (memberIds.length > 0) {
            const { data: membersData } = await fetchByBusiness("crew_members", businessId, "*", {
                filter: { id: { in: memberIds } },
                orderBy: { column: "name", ascending: true }
            });
            members = membersData || [];
        }

        // Get all crew members for dropdowns
        const { data: allMembersData } = await fetchByBusiness("crew_members", businessId, "*", {
            orderBy: { column: "name", ascending: true }
        });
        const allMembers = allMembersData || [];

        // Get project details for schedule
        const projectAssignments = crewData.project_crews || [];
        const projectIds = projectAssignments.map((assignment: any) => assignment.project_id);

        let projects: any[] = [];
        if (projectIds.length > 0) {
            const { data: projectsData } = await fetchByBusiness("projects", businessId, "*", {
                filter: { id: { in: projectIds } }
            });
            projects = projectsData || [];
        }

        // Get all projects for dropdowns
        const { data: allProjectsData } = await fetchByBusiness("projects", businessId, "*", {
            orderBy: { column: "name", ascending: true }
        });
        const allProjects = allProjectsData || [];

        // Process schedule data
        const today = new Date().toISOString();
        const schedule = projectAssignments.map((assignment: any) => {
            const project = projects.find(p => p.id === assignment.project_id);
            return {
                ...assignment,
                project_name: project?.name || "Unknown Project",
                project: project
            };
        });

        // Separate current schedule from history
        const currentSchedule = schedule.filter((item: any) =>
            item.start_date <= today && (!item.end_date || item.end_date >= today)
        );
        const history = schedule.filter((item: any) =>
            item.end_date && item.end_date < today
        );

        // Get equipment details
        const equipmentAssignments = crewData.equipment_assignments || [];
        const equipmentIds = equipmentAssignments.map((assignment: any) => assignment.equipment_id);

        let equipment: any[] = [];
        if (equipmentIds.length > 0) {
            const { data: equipmentData } = await fetchByBusiness("equipment", businessId, "*", {
                filter: { id: { in: equipmentIds } }
            });

            equipment = equipmentAssignments.map((assignment: any) => {
                const equipmentItem = equipmentData?.find((e: any) => e.id === assignment.equipment_id);
                return {
                    ...assignment,
                    equipment_name: equipmentItem?.name || "Unknown Equipment",
                    equipment_type: equipmentItem?.type || "Unknown",
                    equipment_model: equipmentItem?.model || "Unknown",
                    equipment: equipmentItem
                };
            });
        }

        // Get all equipment for dropdowns
        const { data: allEquipmentData } = await fetchByBusiness("equipment", businessId, "*", {
            orderBy: { column: "name", ascending: true }
        });
        const allEquipment = allEquipmentData || [];

        // Get leader information
        let leaderName = "No Assigned Leader";
        if (crewData.leader_id) {
            const { data: leaderData } = await fetchByBusiness("crew_members", businessId, "*", {
                filter: { id: crewData.leader_id }
            });
            if (leaderData && leaderData.length > 0) {
                leaderName = leaderData[0].name;
            }
        }

        // Build the crew with details
        const crew: CrewWithDetails = {
            ...crewData,
            member_count: statsResult.total_members || 0,
            leader: leaderName,
            current_project_id: currentSchedule[0]?.project_id || null,
            current_project: currentSchedule[0]?.project_name || "No Current Project",
            active_projects: statsResult.active_projects || 0,
            total_hours: statsResult.total_hours || 0
        };

        const stats = {
            totalMembers: statsResult.total_members || 0,
            totalProjects: statsResult.total_projects || 0,
            activeProjects: statsResult.active_projects || 0,
            totalEquipment: statsResult.total_equipment || 0,
            totalHours: statsResult.total_hours || 0
        };

        return {
            crew,
            members,
            allMembers,
            schedule: currentSchedule,
            history,
            equipment,
            projects: allProjects,
            allEquipment,
            stats
        };
    } catch (err) {
        console.error("Error in getCrewDetailsByID:", err);
        throw new Error("Failed to fetch crew details");
    }
};