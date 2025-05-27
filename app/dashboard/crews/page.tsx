export const dynamic = "force-dynamic";

import CrewsList from "./components/list";
import { getCrewsWithDetails } from "@/app/actions/crews";

export default async function CrewsPage() {
    const crews = await getCrewsWithDetails();

    return (
        <div>
            <CrewsList initialCrews={crews} />
        </div>
    )
}