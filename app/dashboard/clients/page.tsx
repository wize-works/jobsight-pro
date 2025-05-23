import ClientsList from "./clients-list";
import { getClients } from "@/app/actions/clients";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export default async function ClientsPage() {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "")
    const clients = await getClients(business?.id || "")

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Client Management</h1>
            </div>

            <ClientsList initialClients={clients || []} businessId={business?.id || ""} />
        </div>
    )
}
