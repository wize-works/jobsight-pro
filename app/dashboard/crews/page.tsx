import CrewsList from "./components/list";
import { getCrewsWithDetails, getCrewsWithStats } from "@/app/actions/crews";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import type { CrewWithDetails } from "@/types/crews";

export default async function CrewsPage() {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "")
    const crewsResponse = await getCrewsWithDetails();
    const crews = crewsResponse as CrewWithDetails[];

    return (
        <div>
            <CrewsList initialCrews={crews} businessId={business?.id || ""} />
        </div>
    )
}