import { getCrewWithDetailsById, getCrewMembersByCrewId, getCrewSchedule, getCrewEquipment, getCrewScheduleCurrent, getCrewScheduleHistory } from "@/app/actions/crews";
import { getCrewMembers } from "@/app/actions/crew-members";
import { getProjects } from "@/app/actions/projects";
import CrewDetailComponent from "../components/detail";
import type { CrewMember } from "@/types/crew-members";
import type { ProjectCrew } from "@/types/project-crews";
import type { Equipment } from "@/types/equipment";
import type { Project } from "@/types/projects";
import Link from "next/link";

export default async function CrewPage({ params }: { params: Promise<{ id: string }> }) {
    const crewId = (await params).id;

    // Fetch the crew data
    const crew = await getCrewWithDetailsById(crewId);
    const members = await getCrewMembersByCrewId(crewId);
    const allMembers = await getCrewMembers();
    const schedule = await getCrewScheduleCurrent(crewId);
    const history = await getCrewScheduleHistory(crewId);
    const equipment = await getCrewEquipment(crewId);
    const projects = await getProjects();

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
            <div className="flex justify-start items-center mb-4">
                <Link href={`/dashboard/crews`} className="btn btn-ghost btn-sm mb-4 mr-2">
                    <i className="fas fa-arrow-left fa-xl"></i>
                </Link>
                <h1 className="text-2xl font-bold mb-4">Crew Details</h1>
            </div>
            <CrewDetailComponent
                crew={crew}
                members={members as unknown as CrewMember[]}
                allMembers={allMembers as unknown as CrewMember[]}
                schedule={schedule as unknown as ProjectCrew[]}
                history={history as unknown as ProjectCrew[]}
                equipment={equipment as unknown as Equipment[]}
                projects={projects as unknown as Project[]}
            />
        </div>
    );
}