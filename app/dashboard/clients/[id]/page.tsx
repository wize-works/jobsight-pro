import ClientDetailComponent from "../components/client-detail";
import { getClientById, getClientContacts, getClientInteractions } from "@/app/actions/clients";
import { getProjectsByClient } from "@/lib/projects";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getUserBusiness } from "@/app/actions/business";

export default async function ClientPage({ params }: { params: { id: string } }) {
    const clientId = (await params).id
    const kindeSession = await getKindeServerSession()
    const user = await kindeSession.getUser()
    const business = await getUserBusiness(user?.id || "")
    const businessId = business?.id || ""

    if (!businessId) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-xl mb-4">Business not found</h2>
                <p>Please set up your business to access client details.</p>
            </div>
        )
    }    // Fetch all client data in parallel
    const [client, projects, contacts, interactions] = await Promise.all([
        getClientById(clientId, businessId),
        getProjectsByClient(clientId, businessId),
        getClientContacts(clientId, businessId),
        getClientInteractions(clientId, businessId)
    ]);

    if (!client) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-xl mb-4">Client not found</h2>
                <p>The requested client does not exist or you don't have permission to view it.</p>
            </div>
        )
    } return (
        <ClientDetailComponent
            client={client}
            projects={projects?.data || []}
            contacts={contacts?.data || []}
            interactions={interactions?.data || []}
            businessId={businessId}
        />
    )
}
