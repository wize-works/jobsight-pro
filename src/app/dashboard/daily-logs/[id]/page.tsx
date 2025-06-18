"use client";
import { Suspense, useEffect, useState } from "react";
import DailyLogComponent from "../components/detail";
import { getDailyLogWithDetailsById } from "@/app/actions/daily-logs";
import { getCrews } from "@/app/actions/crews";
import { getProjects } from "@/app/actions/projects";
import { getCrewMembersByCrewId } from "@/app/actions/crew-members";
import { useBusiness } from "@/lib/business-context";
import Loading from "@/app/loading";
import { DailyLogWithDetails } from "@/types/daily-logs";
import { Crew } from "@/types/crews";
import { Project } from "@/types/projects";
import { CrewMember } from "@/types/crew-members";

export default function DailyLogPage({ params }: { params: Promise<{ id: string }> }) {
    const { businessId } = useBusiness();
    const [loading, setLoading] = useState(true);
    const [log, setLog] = useState<DailyLogWithDetails>({} as DailyLogWithDetails);
    const [crews, setCrews] = useState<Crew[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);

    useEffect(() => {
        if (!businessId) {
            return;
        }

        const fetchData = async () => {
            const { id } = await params;
            try {
                // Fetch all required data in parallel
                const [log, crews, projects] = await Promise.all([
                    getDailyLogWithDetailsById(businessId, id),
                    getCrews(businessId),
                    getProjects(businessId)
                ]);

                if (!log) {
                    throw new Error("Daily log not found");
                }

                const crewMembers = await getCrewMembersByCrewId(businessId, log.crew_id || "");

                // Ensure materials and equipment arrays exist even if they're empty
                const safeLog = {
                    ...log,
                    materials: log.materials || [],
                    equipment: log.equipment || []
                };
                setLog(safeLog);
                setCrews(crews);
                setProjects(projects);
                setCrewMembers(crewMembers || []);

            } catch (error) {
                console.error("Error loading daily log:", error);
                setLoading(false);
            }
            finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [businessId, params]);

    if (loading) {
        return (
            <Loading />
        );
    }
    return (
        <Suspense fallback={<div className="loading loading-spinner loading-lg"></div>}>
            <DailyLogComponent log={log} crews={crews} projects={projects} crewMembers={crewMembers} />
        </Suspense>
    );
}