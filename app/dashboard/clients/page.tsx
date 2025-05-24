import ClientsList from "./components/list";
import { getClients, getClientsWithStats } from "@/app/actions/clients";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import type { ClientWithStats } from "@/types/clients";

export default async function ClientsPage() {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "")
    const clientsResponse = await getClientsWithStats(business?.id || "");
    let clients: ClientWithStats[] = [];

    // Handle different possible response shapes
    if (Array.isArray(clientsResponse)) {
        clients = clientsResponse as ClientWithStats[];
    } else if ('data' in clientsResponse && Array.isArray(clientsResponse)) {
        clients = clientsResponse as ClientWithStats[];
    }

    return (
        <div>
            <ClientsList initialClients={clients} businessId={business?.id || ""} />
        </div>
    )
}
