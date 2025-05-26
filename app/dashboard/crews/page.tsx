import CrewsList from "./components/list";
import { getCrewsWithDetails } from "@/app/actions/crews";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import type { CrewWithDetails } from "@/types/crews";

export default async function CrewsPage() {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "")
    const crews = await getCrewsWithDetails();

    return (
        <div>
            <CrewsList initialCrews={crews} businessId={business?.id || ""} />
        </div>
    )
}