"use client";
import { getCrewDetailsByID } from "@/app/actions/crews";
import CrewDetailComponent from "../components/detail";
import { useBusiness } from "@/lib/business-context";
import { useEffect, useState } from "react";
import Loading from "@/app/loading";
import { CrewWithDetails } from "@/types/crews";
import { CrewMember } from "@/types/crew-members";
import { ProjectCrewWithDetails } from "@/types/project-crews";
import { EquipmentAssignmentWithEquipmentDetails } from "@/types/equipment-assignments";
import { Equipment } from "@/types/equipment";
import { Project } from "@/types/projects";

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
    const [allEquipment, setAllEquipment] = useState<Equipment[]>([]); useEffect(() => {
        if (!businessId) {
            return;
        }
        const fetchData = async () => {
            setLoading(true);
            const { id: crewId } = await params;
            try {
                const crewDetails = await getCrewDetailsByID(businessId, crewId);

                if (crewDetails) {
                    const {
                        crew: crewData,
                        members: membersData,
                        allMembers: allMembersData,
                        schedule: scheduleData,
                        history: historyData,
                        equipment: equipmentData,
                        projects: projectsData,
                        allEquipment: allEquipmentData
                    } = crewDetails;

                    setCrew(crewData);
                    setMembers(membersData);
                    setAllMembers(allMembersData);
                    setSchedule(scheduleData);
                    setHistory(historyData);
                    setEquipment(equipmentData);
                    setProjects(projectsData);
                    setAllEquipment(allEquipmentData);
                } else {
                    console.error("No crew details returned");
                }
            } catch (error) {
                console.error("Error fetching crew details:", error);
            }
            finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [businessId, params]);

    if (loading) {
        return <Loading />;
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
    );
}