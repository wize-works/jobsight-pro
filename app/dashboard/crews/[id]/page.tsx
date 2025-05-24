import { getCrewWithStatsById, getCrewMembersByCrewId, getCrewSchedule, getCrewEquipment } from "@/app/actions/crews";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getUserBusiness } from "@/app/actions/business";
import CrewDetailComponent from "../components/detail";
import { CrewMember } from "@/types/crew-members";
import { ProjectCrew } from "@/types/project-crews";
import { Equipment } from "@/types/equipments";

export default async function CrewPage({ params }: { params: { id: string } }) {
    const crewId = (await params).id;
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-xl mb-4">Business not found</h2>
                <p>Please set up your business to access crew details.</p>
            </div>
        );
    }

    // Fetch the crew data
    const crew = await getCrewWithStatsById(crewId, businessId);
    const members = await getCrewMembersByCrewId(crewId, businessId);
    const schedule = await getCrewSchedule(crewId, businessId);
    const equipment = await getCrewEquipment(crewId, businessId);

    if (!crew) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-xl mb-4">Crew not found</h2>
                <p>The requested crew does not exist or you don't have permission to view it.</p>
            </div>
        );
    }

    return (
        <CrewDetailComponent
            crew={crew}
            members={members as unknown as CrewMember[]}
            schedule={schedule as unknown as ProjectCrew[]}
            equipment={equipment as unknown as Equipment[]}
            businessId={businessId}
        />
    );
}