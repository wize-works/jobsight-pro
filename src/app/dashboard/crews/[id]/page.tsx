"use client";
import { useCrews } from "@/hooks/useCrews";
import CrewDetailComponent from "../components/detail";
import { useBusiness } from "@/lib/business-context";
import { useEffect, useState } from "react";
import CrewDetailLoading from "./loading";
import { CrewWithDetails } from "@/types/crews";
import { CrewMember } from "@/types/crew-members";
import { ProjectCrewWithDetails } from "@/types/project-crews";
import { EquipmentAssignmentWithEquipmentDetails } from "@/types/equipment-assignments";
import { Equipment } from "@/types/equipment";
import { Project } from "@/types/projects";
import ErrorBoundary from "@/components/error-boundary";

export default function CrewPage({ params }: { params: Promise<{ id: string }> }) {
    const [loading, setLoading] = useState(true);
    const { businessId } = useBusiness();
    const [crew, setCrew] = useState<CrewWithDetails>({} as CrewWithDetails);
    const [members, setMembers] = useState<CrewMember[]>([]);
    const [allMembers, setAllMembers] = useState<CrewMember[]>([]);
    const [schedule, setSchedule] = useState<ProjectCrewWithDetails[]>([]);
    const [history, setHistory] = useState<ProjectCrewWithDetails[]>([]);
    const [equipment, setEquipment] = useState<EquipmentAssignmentWithEquipmentDetails[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);

    // Initialize crews hook
    const { getCrew, error: crewError } = useCrews();

    useEffect(() => {
        if (!businessId) {
            return;
        }
        const fetchData = async () => {
            setLoading(true);
            const { id: crewId } = await params;
            try {
                const crewDetails = await getCrew(crewId, {
                    include_members: true,
                    include_projects: true,
                    include_stats: true
                });

                if (crewDetails) {
                    setCrew(crewDetails);
                    // Handle members from the API response
                    const crewMembers = crewDetails.members || [];
                    setMembers(crewMembers);
                    setAllMembers(crewMembers);

                    // Handle projects from the API response
                    const crewProjects = crewDetails.projects || [];
                    setProjects(crewProjects);

                    // Initialize empty arrays for data not yet implemented in API
                    setSchedule([]);
                    setHistory([]);
                    setEquipment([]);
                    setAllEquipment([]);
                } else {
                    console.error("Failed to load crew details");
                }
            } catch (error) {
                console.error("Error fetching crew details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [businessId, params, getCrew]);

    if (loading) {
        return <CrewDetailLoading />;
    }

    if (!crew) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-xl mb-4">Crew not found</h2>
                <p>The requested crew does not exist or you don't have permission to view it.</p>
            </div>
        );
    }

    return (
        <ErrorBoundary fallback={() => (
            <div className="alert alert-error">
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                    <h3 className="font-bold">Crew Details Error</h3>
                    <div className="text-xs">Failed to load crew details. Please refresh the page.</div>
                </div>
            </div>
        )}>
            <div className="">
                <CrewDetailComponent
                    crew={crew}
                    members={members}
                    allMembers={allMembers}
                    schedule={schedule}
                    history={history}
                    equipment={equipment}
                    projects={projects}
                    allEquipment={allEquipment}
                />
            </div>
        </ErrorBoundary>
    );
}