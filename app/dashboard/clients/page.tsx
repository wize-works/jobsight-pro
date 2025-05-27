export const dynamic = "force-dynamic";

import ClientsList from "./components/list";
import { getClientsWithStats } from "@/app/actions/clients";

export default async function ClientsPage() {
    const clients = await getClientsWithStats();

    return (
        <div>
            <ClientsList initialClients={clients} />
        </div>
    )
}
