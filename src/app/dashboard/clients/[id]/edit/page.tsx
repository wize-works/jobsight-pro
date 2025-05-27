import { getClientById, updateClient } from "@/app/actions/clients";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import type { ClientUpdate, Client } from "@/types/clients";
import { redirect } from "next/navigation";
import ClientEditForm from "../../components/edit";
import Link from "next/link";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: clientId } = await params;
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

    const client = await getClientById(clientId);

    if (!client) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-xl mb-4">Client not found</h2>
                <p>The requested client does not exist or you don't have permission to view it.</p>
            </div>
        );
    }

    const currentClient = client; // Make a non-null reference

    async function handleUpdateClient(formData: any) {
        "use server";

        const clientData: ClientUpdate = {
            id: currentClient.id,
            business_id: currentClient.business_id,
            name: formData.name ?? currentClient.name,
            type: formData.type ?? currentClient.type,
            industry: formData.industry ?? currentClient.industry,
            contact_name: formData.contact ?? currentClient.contact_name,
            contact_email: formData.email ?? currentClient.contact_email,
            contact_phone: formData.phone ?? currentClient.contact_phone,
            website: formData.website ?? currentClient.website,
            address: formData.address ?? currentClient.address,
            city: formData.city ?? currentClient.city,
            state: formData.state ?? currentClient.state,
            zip: formData.zip ?? currentClient.zip,
            country: formData.country ?? currentClient.country,
            tax_id: formData.taxId ?? currentClient.tax_id,
            notes: formData.notes ?? currentClient.notes,
            logo_url: formData.logoUrl ?? currentClient.logo_url,
            status: formData.status ?? currentClient.status,
            created_at: currentClient.created_at,
            created_by: currentClient.created_by,
            updated_at: new Date().toISOString(),
            updated_by: user?.id || null
        };

        await updateClient(clientId, clientData);
        redirect(`/dashboard/clients/${clientId}`);
    }

    return (
        <div className="">
            <h1 className="text-2xl font-bold mb-6">
                <Link href={`/dashboard/clients/${clientId}`} className="btn btn-ghost btn-sm mr-2">
                    <i className="fas fa-arrow-left"></i>
                </Link>
                Edit Client
            </h1>
            <ClientEditForm client={currentClient} onSubmit={handleUpdateClient} />
        </div>
    );
}
