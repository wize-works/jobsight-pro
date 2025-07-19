"use client";
import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useDailyLogs } from "@/hooks/use-daily-logs";
import { useCrews } from "@/hooks/use-crews";
import { useProjects } from "@/hooks/useProjects";
import { useBusinessData } from "@/hooks/use-business-data";
import { useBusiness } from "@/lib/business-context";
import DailyLogDetailLoading from "./loading";
import ModalLoading from "@/components/modal-loading";
import { DailyLogWithDetails } from "@/types/daily-logs";
import { Crew } from "@/types/crews";
import { Project } from "@/types/projects";
import { CrewMember } from "@/types/crew-members";

// Dynamic import for the detail component
const DailyLogComponent = dynamic(() => import("../components/detail"), {
    loading: () => <ModalLoading message="Loading daily log details..." />,
});

export default function DailyLogPage({ params }: { params: Promise<{ id: string }> }) {
    const { businessId } = useBusiness();
    const [loading, setLoading] = useState(true);
    const [log, setLog] = useState<DailyLogWithDetails>({} as DailyLogWithDetails);
    const [crews, setCrews] = useState<Crew[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);

    // Hooks
    const { getDailyLogWithDetails } = useDailyLogs();
    const { crews: crewsData, fetchCrews } = useCrews();
    const { projects: projectsData, fetchProjects } = useProjects();
    const { getCrewMembers } = useBusinessData();

    useEffect(() => {
        if (!businessId) {
            return;
        }

        const fetchData = async () => {
            const { id } = await params;
            try {
                // Fetch all required data in parallel
                const [log] = await Promise.all([
                    getDailyLogWithDetails(id),
                    fetchCrews(),
                    fetchProjects()
                ]);

                if (!log) {
                    throw new Error("Daily log not found");
                }

                let crewMembersData: CrewMember[] = [];
                if (log.crew_id) {
                    crewMembersData = await getCrewMembers(businessId);
                    // Note: If crew_members table has a crew_id field, uncomment the line below
                    // crewMembersData = crewMembersData.filter(member => member.crew_id === log.crew_id);
                }

                // Ensure materials and equipment arrays exist even if they're empty
                const safeLog = {
                    ...log,
                    materials: log.materials || [],
                    equipment: log.equipment || []
                };
                setLog(safeLog);
                setCrews(crewsData || []);
                setProjects(projectsData || []);
                setCrewMembers(crewMembersData || []);

            } catch (error) {
                console.error("Error loading daily log:", error);
                setLoading(false);
            }
            finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [businessId, params]); if (loading) {
        return (
            <DailyLogDetailLoading />
        );
    }
    return (
        <Suspense fallback={<div className="loading loading-spinner loading-lg"></div>}>
            <DailyLogComponent log={log} crews={crews} projects={projects} crewMembers={crewMembers} />
        </Suspense>
    );
}