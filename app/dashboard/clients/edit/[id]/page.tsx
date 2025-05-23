import { getClientById, updateClient } from "@/app/actions/clients";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import ClientEditForm from "./client-edit-form";

export default async function EditClientPage({ params }: { params: { id: string } }) {
    const clientId = (await params).id;
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-xl mb-4">Business not found</h2>
                <p>Please set up your business to access client details.</p>
            </div>
        );
    }

    const client = await getClientById(clientId, businessId);
    if (!client) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-xl mb-4">Client not found</h2>
                <p>The requested client does not exist or you don't have permission to view it.</p>
            </div>
        );
    }

    async function handleUpdateClient(formData: any) {
        "use server";
        await updateClient(clientId, formData, businessId);
        redirect(`/dashboard/clients/${clientId}`);
    }

    return (
        <div className="max-w-2xl mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">Edit Client</h1>
            <ClientEditForm client={client} onSubmit={handleUpdateClient} />
        </div>
    );
}
