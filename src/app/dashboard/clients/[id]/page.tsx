import ClientDetailComponent from "../components/detail";
import { getClientById } from "@/app/actions/clients";
import { getClientContactsByClientId } from "@/app/actions/client-contacts";
import { getClientInteractionsByClientId } from "@/app/actions/client-interactions";
import { getProjectsByClientId } from "@/app/actions/projects";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: clientId } = await params;
    const kindeSession = await getKindeServerSession()
    const user = await kindeSession.getUser()

    const [client, projects, contacts, interactions] = await Promise.all([
        getClientById(clientId),
        getProjectsByClientId(clientId),
        getClientContactsByClientId(clientId),
        getClientInteractionsByClientId(clientId)
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
            projects={projects || []}
            contacts={contacts || []}
            interactions={interactions || []}
        />
    )
}
