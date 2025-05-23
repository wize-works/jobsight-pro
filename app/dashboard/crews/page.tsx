import CrewsList from "./components/list";
import { getCrewsWithStats } from "@/app/actions/crews";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import type { CrewWithStats } from "@/types/crews";

export default async function CrewsPage() {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "")
    const crewsResponse = await getCrewsWithStats(business?.id || "");
    let crews: CrewWithStats[] = [];

    // Handle different possible response shapes
    if (Array.isArray(crewsResponse)) {
        crews = crewsResponse as CrewWithStats[];
    } else if ('data' in crewsResponse && Array.isArray(crewsResponse.data)) {
        crews = crewsResponse.data as CrewWithStats[];
    }

    return (
        <div>
            <CrewsList crews={crews} businessId={business?.id || ""} />
        </div>
    )
}