import { redirect } from "next/navigation";
import { useState } from "react";
import ClientEditForm from "../components/client-edit-form";
import { createClient } from "@/app/actions/clients";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getUserBusiness } from "@/app/actions/business";
import { v4 as uuidv4 } from "uuid";

export default async function NewClientPage() {
    const [error, setError] = useState<string | null>(null);
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

    const handleCreate = async (formData: any) => {
        "use server";
        setError(null);
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
        };
        try {
            // Assuming you have a function to create a new client
            await createClient(clientData, businessId);
            redirect("/dashboard/clients");
        } catch (err: any) {
            setError(err.message || "Failed to create client");
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
            {error && <div className="text-error mt-4">{error}</div>}
        </div>
    );
}