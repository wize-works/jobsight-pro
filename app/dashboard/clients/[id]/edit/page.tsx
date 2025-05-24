import { getClientById, updateClient } from "@/app/actions/clients";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import ClientEditForm from "../../components/edit";
import Link from "next/link";

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
    console.log("Client", client);
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
        const clientData = {
            name: formData.name,
            type: formData.type,
            industry: formData.industry,
            contact_name: formData.contact,
            contact_email: formData.email,
            contact_phone: formData.phone,
            website: formData.website,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            country: formData.country,
            tax_id: formData.taxId,
            notes: formData.notes,
            logo_url: formData.logoUrl,
            status: formData.status,
        };
        await updateClient(clientId, clientData, businessId);
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
            <ClientEditForm client={client} onSubmit={handleUpdateClient} />
        </div>
    );
}
