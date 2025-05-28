import { redirect } from "next/navigation";
import ClientEditForm from "../components/edit";
import { createClient } from "@/app/actions/clients";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { v4 as uuidv4 } from "uuid";
import { ClientInsert } from "@/types/clients";

export default async function NewClientPage() {


    const handleCreate = async (formData: any) => {
        "use server";
        const clientData = {
            id: uuidv4(),
            name: formData.get("name"),
            type: formData.get("type"),
            industry: formData.get("industry"),
            contact_name: formData.get("contact"),
            contact_email: formData.get("email"),
            contact_phone: formData.get("phone"),
            website: formData.get("website"),
            address: formData.get("address"),
            city: formData.get("city"),
            state: formData.get("state"),
            zip: formData.get("zip"),
            country: formData.get("country"),
            tax_id: formData.get("taxId"),
            notes: formData.get("notes"),
            logo_url: formData.get("logoUrl"),
            status: formData.get("status"),
        } as ClientInsert;
        try {
            // Assuming you have a function to create a new client
            await createClient(clientData);
            redirect("/dashboard/clients");
        } catch (err: any) {
            console.error("Error creating client:", err);
            return { error: "Failed to create client. Please try again." };
        }
    };

    const initialClient = {
        name: "",
        type: "",
        industry: "",
        contact: "",
        email: "",
        phone: "",
        website: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        country: "USA",
        taxId: "",
        notes: "",
        logoUrl: "",
        status: "active",
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Create New Client</h1>
            <ClientEditForm client={initialClient} onSubmit={handleCreate} />
        </div>
    );
}